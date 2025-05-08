import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSplitAmountDecimal20250505224325 implements MigrationInterface {
    name = 'FixSplitAmountDecimal20250505224325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE numeric(12, 2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE integer`);
    }
}
