import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSuggestionPreference1749660576249 implements MigrationInterface {
    name = 'AddUserSuggestionPreference1749660576249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_suggestion_preference" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "description" text NOT NULL, "accountId" integer NOT NULL, "accountName" character varying NOT NULL, "usageCount" integer NOT NULL DEFAULT '1', "lastUsed" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_suggestion_preference" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_SUGGESTION_PREFERENCE_USER_DESC" ON "user_suggestion_preference" ("userId", "description")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_USER_SUGGESTION_PREFERENCE_USER_DESC"`);
        await queryRunner.query(`DROP TABLE "user_suggestion_preference"`);
    }
} 