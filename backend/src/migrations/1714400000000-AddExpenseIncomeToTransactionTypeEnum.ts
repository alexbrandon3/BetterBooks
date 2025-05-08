import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenseIncomeToTransactionTypeEnum1714400000000
  implements MigrationInterface
{
  name = "AddExpenseIncomeToTransactionTypeEnum1714400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "transaction_type_enum" ADD VALUE IF NOT EXISTS 'EXPENSE';
            ALTER TYPE "transaction_type_enum" ADD VALUE IF NOT EXISTS 'INCOME';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      "PostgreSQL does not support removing enum values. If required, you need to create a new enum type."
    );
  }
}
