import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuggestionFeedback1749660576250 implements MigrationInterface {
    name = 'AddSuggestionFeedback1749660576250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."suggestion_feedback_feedbacktype_enum" AS ENUM('ACCEPTED', 'REJECTED', 'IGNORED')`);
        await queryRunner.query(`CREATE TYPE "public"."suggestion_feedback_suggestionsource_enum" AS ENUM('SMART_AGENT', 'USER_PREFERENCE', 'KEYWORD_FALLBACK')`);
        
        await queryRunner.query(`CREATE TABLE "suggestion_feedback" (
            "id" SERIAL NOT NULL, 
            "userId" integer NOT NULL, 
            "description" text NOT NULL, 
            "suggestedAccountId" integer NOT NULL, 
            "suggestedAccountName" character varying NOT NULL, 
            "confidence" integer NOT NULL, 
            "feedbackType" "public"."suggestion_feedback_feedbacktype_enum" NOT NULL DEFAULT 'IGNORED', 
            "selectedAccountId" integer, 
            "selectedAccountName" character varying, 
            "userReason" text, 
            "suggestionMetadata" jsonb, 
            "contextData" jsonb, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_suggestion_feedback" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE INDEX "IDX_SUGGESTION_FEEDBACK_USER_DESC" ON "suggestion_feedback" ("userId", "description")`);
        await queryRunner.query(`CREATE INDEX "IDX_SUGGESTION_FEEDBACK_USER_ACCOUNT" ON "suggestion_feedback" ("userId", "suggestedAccountId")`);
        await queryRunner.query(`CREATE INDEX "IDX_SUGGESTION_FEEDBACK_TYPE_DATE" ON "suggestion_feedback" ("feedbackType", "createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_SUGGESTION_FEEDBACK_TYPE_DATE"`);
        await queryRunner.query(`DROP INDEX "IDX_SUGGESTION_FEEDBACK_USER_ACCOUNT"`);
        await queryRunner.query(`DROP INDEX "IDX_SUGGESTION_FEEDBACK_USER_DESC"`);
        await queryRunner.query(`DROP TABLE "suggestion_feedback"`);
        await queryRunner.query(`DROP TYPE "public"."suggestion_feedback_suggestionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."suggestion_feedback_feedbacktype_enum"`);
    }
} 