import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingStepIdCascade1777914026213
  implements MigrationInterface
{
  name = 'AddBillingStepIdCascade1777914026213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_54f2503187765fd4b4658b4751a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_54f2503187765fd4b4658b4751a\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_54f2503187765fd4b4658b4751a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_54f2503187765fd4b4658b4751a\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
