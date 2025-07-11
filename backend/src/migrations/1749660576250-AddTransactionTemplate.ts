import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionTemplate1749660576250 implements MigrationInterface {
    name = 'AddTransactionTemplate1749660576250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction_template" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "type" "public"."transaction_type_enum" NOT NULL, "requiredAccounts" json NOT NULL, "optionalAccounts" json, "isSystemTemplate" boolean NOT NULL DEFAULT false, "usageCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_transaction_template_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction_template" ADD CONSTRAINT "FK_transaction_template_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_template" DROP CONSTRAINT "FK_transaction_template_user"`);
        await queryRunner.query(`DROP TABLE "transaction_template"`);
    }
} 