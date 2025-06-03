import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToAccount1748886613883 implements MigrationInterface {
  name = "AddCategoryToAccount1748886613883";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "date"`);

    await queryRunner.query(
      `ALTER TABLE "account" ADD "category" character varying NOT NULL DEFAULT 'Uncategorized'`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "subcategory" character varying NOT NULL DEFAULT ''`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."transaction_cashflowcategory_enum" AS ENUM('OPERATING', 'INVESTING', 'FINANCING')`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "cashFlowCategory" "public"."transaction_cashflowcategory_enum"`
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "userId" integer`);

    // Fix for NULL values in amount column
    await queryRunner.query(
      `UPDATE "transaction" SET "amount" = 0 WHERE "amount" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "amount" TYPE numeric(10,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "amount" SET NOT NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP COLUMN "amount"`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" ADD "amount" numeric(10,2) NOT NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4"`
    );

    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "amount"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "amount" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" DROP COLUMN "amount"`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" ADD "amount" integer NOT NULL`
    );

    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "updatedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "createdAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "cashFlowCategory"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_cashflowcategory_enum"`
    );

    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "subcategory"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "category"`);

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "date" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_d5274fa4d2246daf01d32a8d5e4" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
