import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1749493120479 implements MigrationInterface {
    name = 'InitialMigration1749493120479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."account_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')`);
        await queryRunner.query(`CREATE TYPE "public"."account_financialcategory_enum" AS ENUM('CURRENT_ASSET', 'LONG_TERM_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'EQUITY', 'OPERATING_REVENUE', 'NON_OPERATING_REVENUE', 'OPERATING_EXPENSE', 'NON_OPERATING_EXPENSE')`);
        await queryRunner.query(`CREATE TABLE "account" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" "public"."account_type_enum" NOT NULL, "balance" numeric(12,2) NOT NULL, "category" character varying NOT NULL DEFAULT 'Uncategorized', "subcategory" character varying NOT NULL DEFAULT '', "financialCategory" "public"."account_financialcategory_enum" NOT NULL, "financialSubcategory" character varying NOT NULL DEFAULT 'Uncategorized', "userId" integer, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."journal_entry_type_enum" AS ENUM('DEBIT', 'CREDIT')`);
        await queryRunner.query(`CREATE TABLE "journal_entry" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL DEFAULT '0', "type" "public"."journal_entry_type_enum" NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "accountId" integer, "transactionId" integer, CONSTRAINT "PK_69167f660c807d2aa178f0bd7e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum" AS ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_recurrencepattern_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" SERIAL NOT NULL, "description" character varying NOT NULL, "startDate" TIMESTAMP NOT NULL, "type" "public"."transaction_type_enum" NOT NULL DEFAULT 'EXPENSE', "isRecurring" boolean NOT NULL DEFAULT false, "recurrencePattern" "public"."transaction_recurrencepattern_enum", "endDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "split_transaction" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL, "description" character varying NOT NULL, "type" character varying NOT NULL, "accountId" integer, "userId" integer, "transactionId" integer, CONSTRAINT "PK_eaba6accf237a0760da9660d673" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff5498c4b977421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry" ADD CONSTRAINT "FK_e5b0001bfb932ef03fcc3927a8c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry" ADD CONSTRAINT "FK_5eb980cfdd7c2a31dad9cc7ab49" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry" ADD CONSTRAINT "FK_f4f40315dce2169d0b492329bd8" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_f74ae3c701709e522967d9b92f5" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_5bf3942257d1a84c0ad32cad21f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4"`);
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_5bf3942257d1a84c0ad32cad21f"`);
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_f74ae3c701709e522967d9b92f5"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`);
        await queryRunner.query(`ALTER TABLE "journal_entry" DROP CONSTRAINT "FK_f4f40315dce2169d0b492329bd8"`);
        await queryRunner.query(`ALTER TABLE "journal_entry" DROP CONSTRAINT "FK_5eb980cfdd7c2a31dad9cc7ab49"`);
        await queryRunner.query(`ALTER TABLE "journal_entry" DROP CONSTRAINT "FK_e5b0001bfb932ef03fcc3927a8c"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff5498c4b977421"`);
        await queryRunner.query(`DROP TABLE "split_transaction"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_recurrencepattern_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "journal_entry"`);
        await queryRunner.query(`DROP TYPE "public"."journal_entry_type_enum"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TYPE "public"."account_financialcategory_enum"`);
        await queryRunner.query(`DROP TYPE "public"."account_type_enum"`);
    }

}
