import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameEntriesToSplits1746633530721 implements MigrationInterface {
  name = "RenameEntriesToSplits1746633530721";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.tables 
                    WHERE table_name = 'entries'
                ) THEN
                    ALTER TABLE "entries" RENAME TO "split_transaction";
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.tables 
                    WHERE table_name = 'split_transaction'
                ) THEN
                    ALTER TABLE "split_transaction" RENAME TO "entries";
                END IF;
            END $$;
        `);
  }
}
