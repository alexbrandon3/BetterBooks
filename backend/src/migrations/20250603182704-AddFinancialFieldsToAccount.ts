import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinancialFieldsToAccount20250603182704 implements MigrationInterface {
    name = 'AddFinancialFieldsToAccount20250603182704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."account_financialcategory_enum" AS ENUM(
                'Revenue',
                'COGS',
                'OperatingExpense',
                'OtherIncome',
                'OtherExpense',
                'Asset',
                'Liability',
                'Equity'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "account"
            ADD "financialCategory" "public"."account_financialcategory_enum" NOT NULL DEFAULT 'OtherExpense'
        `);
        await queryRunner.query(`
            ALTER TABLE "account"
            ADD "financialSubcategory" character varying NOT NULL DEFAULT 'Uncategorized'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            DROP COLUMN "financialSubcategory"
        `);
        await queryRunner.query(`
            ALTER TABLE "account"
            DROP COLUMN "financialCategory"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."account_financialcategory_enum"
        `);
    }
}
