import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStepDescriptionNullable1776000000000
  implements MigrationInterface
{
  name = 'MakeStepDescriptionNullable1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` MODIFY \`description\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` MODIFY \`description\` text NOT NULL`,
    );
  }
}
