import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDisabledToFranchises1771783422000 implements MigrationInterface {
    name = 'AddIsDisabledToFranchises1771783422000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`franchises\` ADD \`isDisabled\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`franchises\` DROP COLUMN \`isDisabled\``);
    }
}
