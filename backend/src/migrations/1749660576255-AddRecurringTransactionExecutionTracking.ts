import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringTransactionExecutionTracking1749660576255 implements MigrationInterface {
    name = 'AddRecurringTransactionExecutionTracking1749660576255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "lastExecuted" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "lastExecutionResult" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "lastExecutionResult"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "lastExecuted"`);
    }
} 