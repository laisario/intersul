import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDisabledToCopyMachineCatalog1771783423000
  implements MigrationInterface
{
  name = 'AddIsDisabledToCopyMachineCatalog1771783423000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`copy_machine_catalog\` ADD \`isDisabled\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`copy_machine_catalog\` DROP COLUMN \`isDisabled\``,
    );
  }
}
