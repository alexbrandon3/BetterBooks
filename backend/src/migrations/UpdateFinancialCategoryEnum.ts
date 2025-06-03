import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFinancialCategoryEnum implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename the existing enum type to a temporary name
        await queryRunner.query(`ALTER TYPE "public"."account_financialcategory_enum" RENAME TO "account_financialcategory_enum_old"`);

        // Create the new enum type with the updated values
        await queryRunner.query(`
            CREATE TYPE "public"."account_financialcategory_enum" AS ENUM(
                'CURRENT_ASSET',
                'FIXED_ASSET',
                'CURRENT_LIABILITY',
                'LONG_TERM_LIABILITY',
                'EQUITY',
                'OPERATING_REVENUE',
                'NON_OPERATING_REVENUE',
                'OPERATING_EXPENSE',
                'NON_OPERATING_EXPENSE'
            )
        `);

        // Update the column to use the new enum type
        await queryRunner.query(`
            ALTER TABLE "account" 
            ALTER COLUMN "financialCategory" TYPE "public"."account_financialcategory_enum" 
            USING "financialCategory"::text::"public"."account_financialcategory_enum"
        `);

        // Drop the old enum type
        await queryRunner.query(`DROP TYPE "public"."account_financialcategory_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes by recreating the old enum type and updating the column
        await queryRunner.query(`
            CREATE TYPE "public"."account_financialcategory_enum_old" AS ENUM(
                'REVENUE',
                'COGS',
                'OPERATING_EXPENSE',
                'OTHER_INCOME',
                'OTHER_EXPENSE',
                'ASSET',
                'LIABILITY',
                'EQUITY'
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "account" 
            ALTER COLUMN "financialCategory" TYPE "public"."account_financialcategory_enum_old" 
            USING "financialCategory"::text::"public"."account_financialcategory_enum_old"
        `);

        await queryRunner.query(`DROP TYPE "public"."account_financialcategory_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."account_financialcategory_enum_old" RENAME TO "account_financialcategory_enum"`);
    }
} 