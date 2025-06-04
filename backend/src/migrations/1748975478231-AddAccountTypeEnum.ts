import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountTypeEnum1748975478231 implements MigrationInterface {
  name = "AddAccountTypeEnum1748975478231";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "account_type_enum" AS ENUM (
          'ASSET', 
          'LIABILITY', 
          'EQUITY', 
          'REVENUE', 
          'EXPENSE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "type" TYPE "account_type_enum"
      USING "type"::text::"account_type_enum";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "account"
      ALTER COLUMN "type" TYPE varchar;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "account_type_enum";
    `);
  }
} 