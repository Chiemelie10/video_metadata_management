import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { User } from "./User";
import { Tag } from "./Tag";
import { Genre } from "./Genre";
import { entityTransformer } from "../utils/entityTransformer";
import { UploadStatus } from "../types/video";

const transformer = entityTransformer();

@Entity("videos")
export class Video {
    @PrimaryGeneratedColumn("uuid")
    id: UUID

    @Column({ length: 255, nullable: false })
    title: string;

    @Column({ length: 1000, nullable: false })
    description: string;

    @Column({ length: 255, nullable: true })
    video: string;

    @Column({ type: "enum", enum: UploadStatus })
    status: UploadStatus;

    @Column({ type: "timestamp", nullable: false, transformer })
    created_at: string;

    @Column({ type: "timestamp", nullable: true, transformer })
    updated_at: string;

    @ManyToOne(() => User, (user) => user.videos, { onDelete: "CASCADE" })
    @JoinColumn({name: "user_id"})
    user: User;

    @ManyToMany(() => Tag, (tag) => tag.videos)
    @JoinTable({ name: "video_tags" })
    tags: Tag[];

    @ManyToMany(() => Genre, (genre) => genre.videos)
    @JoinTable({ name: "video_genres" })
    genres: Genre[];
}