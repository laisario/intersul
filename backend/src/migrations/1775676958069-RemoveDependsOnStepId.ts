import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDependsOnStepId1775676958069 implements MigrationInterface {
  name = 'RemoveDependsOnStepId1775676958069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_78e8126e0bc201fc31cc5700b31\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` DROP COLUMN \`depends_on_step_id\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` ADD \`depends_on_step_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_78e8126e0bc201fc31cc5700b31\` FOREIGN KEY (\`depends_on_step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
