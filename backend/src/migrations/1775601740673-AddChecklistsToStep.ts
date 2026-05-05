import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChecklistsToStep1775601740673 implements MigrationInterface {
  name = 'AddChecklistsToStep1775601740673';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_78e8126e0bc201fc31cc5700b31\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_steps_depends_on_step_id\` ON \`steps\``,
    );
    await queryRunner.query(
      `CREATE TABLE \`step_checklists\` (\`id\` int NOT NULL AUTO_INCREMENT, \`description\` text NOT NULL, \`completed\` tinyint NOT NULL DEFAULT 0, \`step_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` CHANGE \`description\` \`description\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`step_checklists\` ADD CONSTRAINT \`FK_2ba10a63a907cfd3d17c9019f0d\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_78e8126e0bc201fc31cc5700b31\` FOREIGN KEY (\`depends_on_step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_78e8126e0bc201fc31cc5700b31\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`step_checklists\` DROP FOREIGN KEY \`FK_2ba10a63a907cfd3d17c9019f0d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` CHANGE \`description\` \`description\` text NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE \`step_checklists\``);
    await queryRunner.query(
      `CREATE INDEX \`IDX_steps_depends_on_step_id\` ON \`steps\` (\`depends_on_step_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_78e8126e0bc201fc31cc5700b31\` FOREIGN KEY (\`depends_on_step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}
