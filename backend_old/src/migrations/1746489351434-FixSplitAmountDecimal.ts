import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSplitAmountDecimal1746489351434 implements MigrationInterface {
    name = 'FixSplitAmountDecimal1746489351434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD "amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD CONSTRAINT "FK_5bf3942257d1a84c0ad32cad21f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP CONSTRAINT "FK_5bf3942257d1a84c0ad32cad21f"`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "amount" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "split_transaction" ADD "amount" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "split_transaction" DROP COLUMN "userId"`);
    }

}
