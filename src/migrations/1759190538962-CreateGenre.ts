import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGenre1759190538962 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "genres",
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
                        name: "name",
                        type: "varchar",
                        length: "100",
                        isUnique: true,
                        isNullable: false
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("genres", true);
    }

}
