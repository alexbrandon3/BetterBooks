import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenseIncomeToTransactionTypeEnum1714400000000 implements MigrationInterface {
    name = 'AddExpenseIncomeToTransactionTypeEnum1714400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "transaction_type_enum" ADD VALUE IF NOT EXISTS 'EXPENSE';
        `);
        await queryRunner.query(`
            ALTER TYPE "transaction_type_enum" ADD VALUE IF NOT EXISTS 'INCOME';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No easy way to remove enum values in PostgreSQL without recreating the enum.
        // Best practice: leave this empty, or document a manual revert process if needed.
    }
}
