import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRecurringTransaction1748975478228 implements MigrationInterface {
  name = "UpdateRecurringTransaction1748975478228";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists
    const tableExists = await queryRunner.hasTable("recurring_transaction");
    
    if (!tableExists) {
      // Create the table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE "recurring_transaction" (
          "id" SERIAL PRIMARY KEY,
          "amount" decimal(10,2) NOT NULL,
          "description" varchar NOT NULL,
          "type" varchar NOT NULL DEFAULT 'EXPENSE',
          "interval" varchar NOT NULL DEFAULT 'MONTHLY',
          "start_date" TIMESTAMP NOT NULL DEFAULT now(),
          "end_date" TIMESTAMP,
          "account_id" integer,
          "user_id" integer,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "recurring_transaction"
        ADD CONSTRAINT "FK_recurring_transaction_account"
        FOREIGN KEY ("account_id")
        REFERENCES "account"("id")
        ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "recurring_transaction"
        ADD CONSTRAINT "FK_recurring_transaction_user"
        FOREIGN KEY ("user_id")
        REFERENCES "user"("id")
        ON DELETE CASCADE
      `);
    } else {
      // First check if columns exist before adding them
      const table = await queryRunner.getTable("recurring_transaction");
      const columns = table?.columns.map(col => col.name) || [];

      // Add new columns if they don't exist
      if (!columns.includes("type")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "type" varchar NOT NULL DEFAULT 'EXPENSE'`);
      }
      if (!columns.includes("interval")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "interval" varchar NOT NULL DEFAULT 'MONTHLY'`);
      }
      if (!columns.includes("start_date")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "start_date" TIMESTAMP NOT NULL DEFAULT now()`);
      }
      if (!columns.includes("end_date")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "end_date" TIMESTAMP`);
      }
      if (!columns.includes("user_id")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "user_id" integer`);
      }
      if (!columns.includes("created_at")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }
      if (!columns.includes("updated_at")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }

      // Drop recurrence_pattern if it exists
      if (columns.includes("recurrence_pattern")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "recurrence_pattern"`);
      }

      // Change amount type if needed
      const amountColumn = table?.findColumnByName("amount");
      if (amountColumn && amountColumn.type !== "decimal") {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ALTER COLUMN "amount" TYPE decimal(10,2)`);
      }

      // Add foreign key if it doesn't exist
      const foreignKeys = table?.foreignKeys || [];
      const hasUserForeignKey = foreignKeys.some(fk => fk.columnNames.includes("user_id"));
      if (!hasUserForeignKey) {
        await queryRunner.query(`
          ALTER TABLE "recurring_transaction"
          ADD CONSTRAINT "FK_recurring_transaction_user"
          FOREIGN KEY ("user_id")
          REFERENCES "user"("id")
          ON DELETE CASCADE
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable("recurring_transaction");
    
    if (tableExists) {
      const table = await queryRunner.getTable("recurring_transaction");
      const columns = table?.columns.map(col => col.name) || [];

      // Drop foreign key if it exists
      const foreignKeys = table?.foreignKeys || [];
      const hasUserForeignKey = foreignKeys.some(fk => fk.columnNames.includes("user_id"));
      if (hasUserForeignKey) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_recurring_transaction_user"`);
      }

      // Drop columns if they exist
      if (columns.includes("user_id")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "user_id"`);
      }
      if (columns.includes("updated_at")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "updated_at"`);
      }
      if (columns.includes("created_at")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "created_at"`);
      }
      if (columns.includes("end_date")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "end_date"`);
      }
      if (columns.includes("start_date")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "start_date"`);
      }
      if (columns.includes("interval")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "interval"`);
      }
      if (columns.includes("type")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP COLUMN "type"`);
      }

      // Add back recurrence_pattern if it doesn't exist
      if (!columns.includes("recurrence_pattern")) {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD COLUMN "recurrence_pattern" varchar NOT NULL DEFAULT 'MONTHLY'`);
      }

      // Change amount type back if needed
      const amountColumn = table?.findColumnByName("amount");
      if (amountColumn && amountColumn.type === "decimal") {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ALTER COLUMN "amount" TYPE integer`);
      }
    }
  }
} 