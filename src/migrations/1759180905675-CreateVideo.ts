import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateVideo1759180905675 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "videos",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "UUID()"
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "title",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "varchar",
                        length: "1000",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "videos",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("videos");
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("user_id") !== -1,
        );
        await queryRunner.dropForeignKey("videos", foreignKey);
        await queryRunner.dropTable("videos", true);
    }

}
