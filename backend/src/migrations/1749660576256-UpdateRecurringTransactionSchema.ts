import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRecurringTransactionSchema1749660576256 implements MigrationInterface {
    name = 'UpdateRecurringTransactionSchema1749660576256'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove the old accountId column and its foreign key
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_9c4a7f8db1af0576c1a3dffb2a9"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "accountId"`);
        
        // Add the new columns for primary and secondary accounts
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "primaryAccountId" integer`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "secondaryAccountId" integer`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "primaryEntryType" character varying NOT NULL DEFAULT 'DEBIT'`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "secondaryEntryType" character varying NOT NULL DEFAULT 'CREDIT'`);
        
        // Add foreign key constraints for the new account columns
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD CONSTRAINT "FK_recurring_transaction_primary_account" FOREIGN KEY ("primaryAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD CONSTRAINT "FK_recurring_transaction_secondary_account" FOREIGN KEY ("secondaryAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the new foreign key constraints
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_recurring_transaction_secondary_account"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_recurring_transaction_primary_account"`);
        
        // Remove the new columns
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "secondaryEntryType"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "primaryEntryType"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "secondaryAccountId"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "primaryAccountId"`);
        
        // Restore the old accountId column
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD "accountId" integer`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD CONSTRAINT "FK_9c4a7f8db1af0576c1a3dffb2a9" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
} 