import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFinancialCategoryEnum1748975478229 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop column using the enum
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN IF EXISTS "financialCategory"`);

    // Drop old enum
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."account_financialcategory_enum"`);

    // Create new enum with updated values
    await queryRunner.query(`
      CREATE TYPE "public"."account_financialcategory_enum" AS ENUM (
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

    // Re-add column with new enum
    await queryRunner.query(`
      ALTER TABLE "account"
      ADD COLUMN "financialCategory" "public"."account_financialcategory_enum" NOT NULL DEFAULT 'OPERATING_EXPENSE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN IF EXISTS "financialCategory"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."account_financialcategory_enum"`);
  }
}
