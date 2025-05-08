import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSplitAmountDecimal20250505224325 implements MigrationInterface {
  name = "FixSplitAmountDecimal20250505224325";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'split_transaction'
                    AND column_name = 'amount'
                ) THEN
                    UPDATE "split_transaction"
                    SET "amount" = 0.00
                    WHERE "amount" IS NULL;

                    ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE numeric(12, 2) USING "amount"::numeric(12, 2);
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE integer USING "amount"::integer;
        `);
  }
}
