import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSplitAmountDecimal1746489351434 implements MigrationInterface {
  name = "FixSplitAmountDecimal1746489351434";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'split_transaction'
                    AND column_name = 'userId'
                ) THEN
                    ALTER TABLE "split_transaction" ADD "userId" uuid;
                END IF;
            END $$;

            ALTER TABLE "split_transaction"
            ALTER COLUMN "amount" TYPE numeric(10,2) USING "amount"::numeric(10,2);

            UPDATE "transaction"
            SET "amount" = 0.00
            WHERE "amount" IS NULL;

            ALTER TABLE "transaction" ALTER COLUMN "amount" SET NOT NULL;

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_5bf3942257d1a84c0ad32cad21f'
                ) THEN
                    ALTER TABLE "split_transaction"
                    ADD CONSTRAINT "FK_5bf3942257d1a84c0ad32cad21f"
                    FOREIGN KEY ("userId") REFERENCES "user"("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP CONSTRAINT IF EXISTS "FK_5bf3942257d1a84c0ad32cad21f"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "amount" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" ALTER COLUMN "amount" TYPE integer`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP COLUMN IF EXISTS "userId"`
    );
  }
}
