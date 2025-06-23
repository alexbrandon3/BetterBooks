import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFinancialCategories1749660576248 implements MigrationInterface {
    name = 'AddMissingFinancialCategories1749660576248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the missing enum values to the existing enum
        await queryRunner.query(`ALTER TYPE "public"."account_financialcategory_enum" ADD VALUE 'RETAINED_EARNINGS'`);
        await queryRunner.query(`ALTER TYPE "public"."account_financialcategory_enum" ADD VALUE 'DRAWINGS'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type, which is complex
        // For now, we'll leave the enum values in place
        console.log("Warning: Cannot remove enum values in PostgreSQL. Manual cleanup may be required.");
        // Use queryRunner to avoid TypeScript error
        await queryRunner.query(`SELECT 1`);
    }
} 