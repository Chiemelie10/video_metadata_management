import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateVideoGenre1759190557447 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "video_genres",
                columns: [
                    {
                        name: "video_id",
                        type: "uuid",
                        length: "36",
                        isPrimary: true
                    },
                    {
                        name: "genre_id",
                        type: "uuid",
                        length: "36",
                        isPrimary: true
                    }
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "video_genres",
            new TableForeignKey({
                columnNames: ["video_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "videos",
                onDelete: "CASCADE"
            }),
        );

        await queryRunner.createForeignKey(
            "video_genres",
            new TableForeignKey({
                columnNames: ["genre_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "genres",
                onDelete: "CASCADE"
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("video_genres");
        const videoIdForeignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("video_id") !== -1,
        );
        const genreIdForeignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("genre_id") !== -1,
        );
        await queryRunner.dropForeignKey("video_genres", videoIdForeignKey);
        await queryRunner.dropForeignKey("video_genres", genreIdForeignKey);
        await queryRunner.dropTable("video_genres", true);
    }

}
