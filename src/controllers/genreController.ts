import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Genre } from "../models/Genre";
import { now } from "../utils/now";
import { GenreRequestData } from "../types/genre";

export const getGenres = async (req: Request, res: Response) => {
    const genres = await AppDataSource.getRepository(Genre)
        .createQueryBuilder("genres")
        .select(["genre.id", "genre.name"])
        .getMany();

    return res.status(200).json({
        message: "Genre fetched successfully.",
        data: genres
    });
}

export const getGenre = async (req: Request, res: Response) => {
    const { id } = req.params;

    const genre = await AppDataSource.getRepository(Genre)
        .createQueryBuilder("genres")
        .select(["genres.id", "genres.name"])
        .where("genres.id = :id", { id })
        .getOne();

    if (!genre) {
        return res.status(404).json({
            error: "Genre was not found."
        });
    }

    return res.status(200).json({
        message: "Genre fetched successfully.",
        data: genre
    });
}

export async function createGenre (req: Request, res: Response) {
    const { name }: GenreRequestData = req.body;
    const currentTime = now();

    try {
        const genre = await AppDataSource.manager
            .save(Genre, {
                name,
                created_at: currentTime,
                updated_at: currentTime,
            });

        const responseData = {
            id: genre.id,
            name: genre.name,
            created_at: genre.created_at,
            updated_at: genre.updated_at
        }

        return res.status(201).json({
            message: "Genre created successfully.",
            data: responseData
        });
    } catch(error) {
        return res.status(500).json({"error": `Genre creation failed: ${error.message}`});
    }
}

export async function updateGenre(req: Request, res: Response) {
    const { id } = req.params;
    const { name }: GenreRequestData = req.body;

    const currentTime = now();

    await AppDataSource.manager.update(
        Genre,
        { id },
        { name, updated_at: currentTime
    });

    const genre = await AppDataSource.getRepository(Genre)
        .createQueryBuilder("genres")
        .select(["genres.id", "genres.name"])
        .where("genres.id = :id", { id })
        .getOne();

    if (!genre) {
        return res.status(404).json({
            error: "Genre was not found."
        });
    }

    return res.status(200).json({
        message: "Genre updated successfully.",
        data: genre
    });
}