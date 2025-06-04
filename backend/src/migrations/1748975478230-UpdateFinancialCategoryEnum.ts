import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFinancialCategoryEnum1748975478230 implements MigrationInterface {
  name = "UpdateFinancialCategoryEnum1748975478230";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "financial_category_enum" AS ENUM (
          'CURRENT_ASSET',
          'FIXED_ASSET',
          'CURRENT_LIABILITY',
          'LONG_TERM_LIABILITY',
          'EQUITY',
          'OPERATING_REVENUE',
          'NON_OPERATING_REVENUE',
          'OPERATING_EXPENSE',
          'NON_OPERATING_EXPENSE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Drop the default value
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" DROP DEFAULT;
    `);

    // First convert to text
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" TYPE text
      USING "financialCategory"::text;
    `);

    // Then convert to the new enum type
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" TYPE "financial_category_enum"
      USING "financialCategory"::"financial_category_enum";
    `);

    // Set the default value back
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" SET DEFAULT 'CURRENT_ASSET';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the default value
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" DROP DEFAULT;
    `);

    // Convert back to text first
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" TYPE text
      USING "financialCategory"::text;
    `);

    // Then convert to varchar
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" TYPE varchar
      USING "financialCategory"::varchar;
    `);

    // Set the default value back
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "financialCategory" SET DEFAULT 'CURRENT_ASSET';
    `);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "financial_category_enum";`);
  }
} 