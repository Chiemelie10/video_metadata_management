import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { User } from "./User";
import { Tag } from "./Tag";
import { Genre } from "./Genre";

@Entity("videos")
export class Video {
    @PrimaryGeneratedColumn("uuid")
    id: UUID

    @Column({ length: 255 })
    email: string

    @Column({ length: 255 })
    title: string;

    @Column({ length: 1000 })
    description: string;

    @Column({ type: "timestamp" })
    created_at: Date;

    @Column({ type: "timestamp", nullable: true })
    updated_at: Date;

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