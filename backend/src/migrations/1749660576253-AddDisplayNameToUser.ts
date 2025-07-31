import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisplayNameToUser1749660576253 implements MigrationInterface {
    name = 'AddDisplayNameToUser1749660576253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "displayName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "displayName"`);
    }
} 