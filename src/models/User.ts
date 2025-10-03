import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { Video } from "./Video";
import { entityTransformer } from "../utils/entityTransformer";

const transformer = entityTransformer();

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: UUID

    @Column({ length: 255 })
    username: string

    @Column({ length: 255 })
    email: string

    @Column({ length: 500 })
    password: string;

    @Column({ type: "timestamp", nullable: true, transformer })
    deleted_at: string;

    @Column({ type: "timestamp", nullable: false, transformer })
    created_at: string;

    @Column({ type: "timestamp", nullable: true, transformer })
    updated_at: string;

    @OneToMany(() => Video, (video) => video.user)
    videos: Video[]
}