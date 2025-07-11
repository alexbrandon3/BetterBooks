import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClosingEntryTransactionType1749660576251 implements MigrationInterface {
    name = 'AddClosingEntryTransactionType1749660576251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the CLOSING_ENTRY value to the existing transaction_type_enum
        await queryRunner.query(`ALTER TYPE "public"."transaction_type_enum" ADD VALUE 'CLOSING_ENTRY'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type, which is complex
        // For now, we'll leave the enum value in place
        console.log("Warning: Cannot remove enum values in PostgreSQL. Manual cleanup may be required.");
        // Use queryRunner to avoid TypeScript error
        await queryRunner.query(`SELECT 1`);
    }
} 