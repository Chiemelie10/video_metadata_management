import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UUID } from "crypto";
import { Video } from "./Video";

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

    @Column({ type: "timestamp", nullable: true })
    deleted_at: Date;

    @Column({ type: "timestamp" })
    created_at: Date;

    @Column({ type: "timestamp", nullable: true })
    updated_at: Date;

    @OneToMany(() => Video, (video) => video.user)
    videos: Video[]
}