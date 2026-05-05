import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePriceFromServices1771796367085
  implements MigrationInterface
{
  name = 'RemovePriceFromServices1771796367085';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`services\` DROP COLUMN \`price\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`services\` ADD \`price\` decimal(10,2) NULL`,
    );
  }
}
