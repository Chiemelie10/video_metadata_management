import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { Video } from "./Video";
import { entityTransformer } from "../utils/entityTransformer";

const transformer = entityTransformer();

@Entity("tags")
export class Tag {
    @PrimaryGeneratedColumn("uuid")
    id: UUID;

    @Column({ length: 100, unique: true, nullable: false })
    name: string;

    @Column({ type: "timestamp", nullable: false, transformer })
    created_at: string;

    @Column({ type: "timestamp", nullable: true, transformer })
    updated_at: string;

    @ManyToMany(() => Video, (video) => video.tags)
    videos: Video[];
}