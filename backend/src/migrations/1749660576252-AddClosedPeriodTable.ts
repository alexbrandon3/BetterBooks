import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddClosedPeriodTable1749660576252 implements MigrationInterface {
    name = 'AddClosedPeriodTable1749660576252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "closed_periods",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "userId",
                        type: "integer",
                        isNullable: false
                    },
                    {
                        name: "startDate",
                        type: "date",
                        isNullable: false
                    },
                    {
                        name: "endDate",
                        type: "date",
                        isNullable: false
                    },
                    {
                        name: "periodType",
                        type: "varchar",
                        length: "20",
                        isNullable: false
                    },
                    {
                        name: "closingTransactionId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "closed_periods",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "user",
                onDelete: "CASCADE"
            })
        );

        // Create index for efficient lookups
        await queryRunner.query(`CREATE INDEX "IDX_closed_periods_user_date" ON "closed_periods" ("userId", "startDate", "endDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("closed_periods");
    }
} 