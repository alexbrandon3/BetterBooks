import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAccountFinancialFields1748975478228 implements MigrationInterface {
    name = 'UpdateAccountFinancialFields1748975478228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update financialCategory based on account type
        await queryRunner.query(`
            UPDATE "account"
            SET "financialCategory" = CASE
                WHEN "type" = 'ASSET' THEN 'Asset'::account_financialcategory_enum
                WHEN "type" = 'LIABILITY' THEN 'Liability'::account_financialcategory_enum
                WHEN "type" = 'EQUITY' THEN 'Equity'::account_financialcategory_enum
                ELSE 'OtherExpense'::account_financialcategory_enum
            END
        `);

        // Update financialSubcategory using existing category
        await queryRunner.query(`
            UPDATE "account"
            SET "financialSubcategory" = CASE
                WHEN "category" IS NULL OR "category" = '' THEN 'Uncategorized'
                ELSE "category"
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to revert the data updates
    }
} 