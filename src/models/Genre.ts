import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { Video } from "./Video";
import { entityTransformer } from "../utils/entityTransformer";

const transformer = entityTransformer();

@Entity("genres")
export class Genre {
    @PrimaryGeneratedColumn("uuid")
    id: UUID;

    @Column({ length: 100, unique: true, nullable: false })
    name: string;

    @Column({ type: "timestamp", nullable: false, transformer })
    created_at: Date;

    @Column({ type: "timestamp", nullable: true, transformer })
    updated_at: Date;

    @ManyToMany(() => Video, (video) => video.tags)
    videos: Video[];
}