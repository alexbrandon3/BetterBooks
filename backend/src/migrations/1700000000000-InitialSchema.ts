import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "account_type" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
      CREATE TYPE "account_sub_type" AS ENUM (
        'cash', 'accounts_receivable', 'inventory', 'fixed_asset', 'prepaid_expense',
        'accounts_payable', 'accrued_liability', 'long_term_debt',
        'common_stock', 'retained_earnings',
        'sales', 'interest_income',
        'cost_of_goods_sold', 'operating_expense', 'interest_expense'
      );
      CREATE TYPE "transaction_type" AS ENUM ('debit', 'credit');
      CREATE TYPE "document_type" AS ENUM ('invoice', 'receipt', 'statement', 'contract', 'other');
    `);

    // Create accounts table
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "type" "account_type" NOT NULL,
        "subType" "account_sub_type",
        "balance" decimal(19,4) NOT NULL DEFAULT '0',
        "description" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id")
      );
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" TIMESTAMP NOT NULL,
        "amount" decimal(19,4) NOT NULL,
        "type" "transaction_type" NOT NULL,
        "description" character varying NOT NULL,
        "accountId" uuid NOT NULL,
        "referenceNumber" character varying,
        "notes" character varying,
        "isReconciled" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fileName" character varying NOT NULL,
        "fileKey" character varying NOT NULL,
        "fileType" character varying NOT NULL,
        "fileSize" integer NOT NULL,
        "type" "document_type" NOT NULL DEFAULT 'other',
        "description" character varying,
        "accountId" uuid,
        "transactionId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_documents_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_documents_transaction" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_accounts_type" ON "accounts" ("type");
      CREATE INDEX "IDX_accounts_subType" ON "accounts" ("subType");
      CREATE INDEX "IDX_transactions_date" ON "transactions" ("date");
      CREATE INDEX "IDX_transactions_account" ON "transactions" ("accountId");
      CREATE INDEX "IDX_documents_account" ON "documents" ("accountId");
      CREATE INDEX "IDX_documents_transaction" ON "documents" ("transactionId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "accounts"`);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE "document_type";
      DROP TYPE "transaction_type";
      DROP TYPE "account_sub_type";
      DROP TYPE "account_type";
    `);
  }
} 