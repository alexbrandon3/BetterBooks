import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddAccountWeight1749660576258 implements MigrationInterface {
    name = 'AddAccountWeight1749660576258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "account_weight",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "userId",
                        type: "int",
                    },
                    {
                        name: "keyword",
                        type: "varchar",
                        length: "100",
                    },
                    {
                        name: "accountId",
                        type: "int",
                    },
                    {
                        name: "weight",
                        type: "int",
                        default: 50,
                    },
                    {
                        name: "transactionType",
                        type: "varchar",
                        length: "20",
                        isNullable: true,
                    },
                    {
                        name: "isDefault",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "usageCount",
                        type: "int",
                        default: 0,
                    },
                    {
                        name: "lastUsed",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_account_weight_user_keyword" ON "account_weight" ("userId", "keyword")`);
        await queryRunner.query(`CREATE INDEX "IDX_account_weight_user_keyword_account" ON "account_weight" ("userId", "keyword", "accountId")`);
        await queryRunner.query(`CREATE INDEX "IDX_account_weight_account" ON "account_weight" ("accountId")`);

        // Add unique constraint
        await queryRunner.query(`ALTER TABLE "account_weight" ADD CONSTRAINT "UQ_account_weight_user_keyword_account" UNIQUE ("userId", "keyword", "accountId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_weight_user_keyword"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_weight_user_keyword_account"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_weight_account"`);
        await queryRunner.dropTable("account_weight");
    }
} 