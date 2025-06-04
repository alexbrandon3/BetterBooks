import { MigrationInterface, QueryRunner } from "typeorm";

export class FixBalanceToNumeric1748975478229 implements MigrationInterface {
  name = "FixBalanceToNumeric1748975478229";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the column exists and its current type
    const table = await queryRunner.getTable("account");
    const balanceColumn = table?.findColumnByName("balance");

    if (balanceColumn) {
      // Change the column type to numeric
      await queryRunner.query(`
        ALTER TABLE "account"
        ALTER COLUMN "balance" TYPE numeric(12,2)
        USING balance::numeric(12,2)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to integer if needed
    const table = await queryRunner.getTable("account");
    const balanceColumn = table?.findColumnByName("balance");

    if (balanceColumn) {
      await queryRunner.query(`
        ALTER TABLE "account"
        ALTER COLUMN "balance" TYPE integer
        USING balance::integer
      `);
    }
  }
} 