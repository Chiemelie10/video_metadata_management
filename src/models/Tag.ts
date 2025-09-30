import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { Video } from "./Video";

@Entity("tags")
export class Tag {
    @PrimaryGeneratedColumn("uuid")
    id: UUID;

    @Column({ length: 100, unique: true, nullable: false })
    name: string;

    @ManyToMany(() => Video, (video) => video.tags)
    videos: Video[];
}