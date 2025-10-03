import {Request, Response, NextFunction} from "express";
import { ValidateVideoMetadata, VidMetadateFieldError } from "../../types/video";
import { cleanInput } from "../../utils/cleanInput";
import { Tag } from "../../models/Tag";
import { AppDataSource } from "../../config/data-source";
import { In } from "typeorm";
import { Genre } from "../../models/Genre";

export const validateVideoMetadata = async (req: Request, res: Response, next: NextFunction) => {
    let { title, tags, description, genres }: ValidateVideoMetadata = req.body;
    let tagEntities: Tag[] = [];
    let genreEntities: Genre[] = [];

    let errors: VidMetadateFieldError = {};
    let titleErrors: string[] = [];
    let tagErrors: string[] = [];
    let genreErrors: string[] = [];
    let descriptionErrors: string[] = [];

    if (!title) {
        titleErrors.push("The field title is required.");
        errors["title"] = titleErrors;
    }

    if (!description) {
        descriptionErrors.push("The field description is required.");
        errors["description"] = descriptionErrors;
    }

    // Validate type
    const titleIsString = typeof title === "string";
    const descriptionIsString = typeof description === "string";
    let tagsIsArrayString = false;
    let genresIsArrayString = false;

    if (Array.isArray(tags)) {
        const allStrings = tags.every(item => typeof item === "string");

        if (allStrings) {
            tagsIsArrayString = true
        }
    }

    if (Array.isArray(genres)) {
        const allStrings = genres.every(item => typeof item === "string");

        if (allStrings) {
            genresIsArrayString = true
        }
    }

    if (title && !titleIsString) {
        titleErrors.push("The field title should be a string.");
        errors["title"] = titleErrors;
    }

    if (description && !descriptionIsString) {
        descriptionErrors.push("The field description should be a string.");
        errors["description"] = descriptionErrors;
    }

    if (tags && !tagsIsArrayString) {
        tagErrors.push("The field tags should be an an array of strings.");
        errors["tags"] = tagErrors;
    }

    if (genres && !genresIsArrayString) {
        genreErrors.push("The field genres should be an a array of strings.");
        errors["genres"] = genreErrors;
    }

    if (title && titleIsString) {
        title = cleanInput(title);

        if (title.length > 100) {
            titleErrors.push("The field title should not exceed 100 characters.");
            errors["title"] = titleErrors;
        }
    }

    if (description && descriptionIsString) {
        description = cleanInput(description);

        if (description.length > 1000) {
            descriptionErrors.push("The field description should not exceed 1000 characters.");
            errors["description"] = descriptionErrors;
        }    
    }

    if (tags && tagsIsArrayString) {
        let newTags: { name: string }[] = [];
        let tagsToFind: string[] = [];

        for (let tag of tags) {
            tag = cleanInput(tag);

            const exists = await AppDataSource.getRepository(Tag).exists({
                where: { name: tag }
            });

            if (exists) {
                tagsToFind.push(tag);
            } else if (!exists && tag != "") {
                newTags.push({ name: tag });
                tagsToFind.push(tag);
            }
        }

        if (newTags.length > 0) {
            await AppDataSource.createQueryBuilder().insert().into(Tag).values(newTags).execute();
        }

        tagEntities = await AppDataSource.getRepository(Tag).findBy({ name: In(tagsToFind) });
    }

    if (genres && genresIsArrayString) {
        for (let genre of genres) {
            const exists = await AppDataSource.getRepository(Genre).exists({
                where: { id: genre }
            });

            if (!exists) {
                genreErrors.push(`The id ${genre} was not found.`);
                errors["genres"] = genreErrors;
            }

            if (genreErrors.length === 0) {
                genreEntities = await AppDataSource.getRepository(Genre).findBy({ id: In(genres) });
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    req.body.title = title;
    req.body.description = description;
    req.body.tags = tagEntities;
    req.body.genres = genreEntities;

    next();
}