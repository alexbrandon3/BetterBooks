import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSplitTransactionAmount1746634344161
  implements MigrationInterface
{
  name = "FixSplitTransactionAmount1746634344161";

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

                    ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE numeric(10,2) USING "amount"::numeric(10,2);
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE integer;
        `);
  }
}
