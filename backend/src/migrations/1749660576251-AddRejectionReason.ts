import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectionReason1749660576251 implements MigrationInterface {
    name = 'AddRejectionReason1749660576251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suggestion_feedback" ADD "rejectionReason" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suggestion_feedback" DROP COLUMN "rejectionReason"`);
    }
} 