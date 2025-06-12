import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringTransaction1749660576247 implements MigrationInterface {
    name = 'AddRecurringTransaction1749660576247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recurring_transaction_recurrencepattern_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')`);
        await queryRunner.query(`CREATE TABLE "recurring_transaction" ("id" SERIAL NOT NULL, "description" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "recurrencePattern" "public"."recurring_transaction_recurrencepattern_enum" NOT NULL, "nextRun" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "accountId" integer, CONSTRAINT "PK_6f2199a889c8e4de41bcc2ca46c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD CONSTRAINT "FK_0d61863f6aab3544868b1a39510" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" ADD CONSTRAINT "FK_9c4a7f8db1af0576c1a3dffb2a9" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_9c4a7f8db1af0576c1a3dffb2a9"`);
        await queryRunner.query(`ALTER TABLE "recurring_transaction" DROP CONSTRAINT "FK_0d61863f6aab3544868b1a39510"`);
        await queryRunner.query(`DROP TABLE "recurring_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_transaction_recurrencepattern_enum"`);
    }

}
