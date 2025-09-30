import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateVideoTag1759186830149 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "video_tags",
                columns: [
                    {
                        name: "video_id",
                        type: "uuid",
                        length: "36",
                        isPrimary: true
                    },
                    {
                        name: "tag_id",
                        type: "uuid",
                        length: "36",
                        isPrimary: true
                    }
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "video_tags",
            new TableForeignKey({
                columnNames: ["video_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "videos",
                onDelete: "CASCADE"
            }),
        );

        await queryRunner.createForeignKey(
            "video_tags",
            new TableForeignKey({
                columnNames: ["tag_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tags",
                onDelete: "CASCADE"
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("video_tags");
        const videoIdForeignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("video_id") !== -1,
        );
        const tagIdForeignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("tag_id") !== -1,
        );
        await queryRunner.dropForeignKey("video_tags", videoIdForeignKey);
        await queryRunner.dropForeignKey("video_tags", tagIdForeignKey);
        await queryRunner.dropTable("video_tags", true);
    }

}
