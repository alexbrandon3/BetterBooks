import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToRecurringTransaction1749660576254 implements MigrationInterface {
    name = 'AddIsActiveToRecurringTransaction1749660576254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "isActive"`);
    }
} 