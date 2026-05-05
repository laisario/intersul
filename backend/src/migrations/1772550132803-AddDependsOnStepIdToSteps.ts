import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddDependsOnStepIdToSteps1772550132803
  implements MigrationInterface
{
  name = 'AddDependsOnStepIdToSteps1772550132803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists (in case migration was partially run)
    const table = await queryRunner.getTable('steps');
    const hasColumn = table?.findColumnByName('depends_on_step_id');

    if (!hasColumn) {
      // Add depends_on_step_id column
      await queryRunner.addColumn(
        'steps',
        new TableColumn({
          name: 'depends_on_step_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Check if foreign key already exists
    const foreignKeys = table?.foreignKeys || [];
    const hasForeignKey = foreignKeys.some(
      (fk) => fk.columnNames.indexOf('depends_on_step_id') !== -1,
    );

    if (!hasForeignKey) {
      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'steps',
        new TableForeignKey({
          columnNames: ['depends_on_step_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'steps',
          onDelete: 'SET NULL', // If parent step is deleted, set depends_on_step_id to NULL
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Check if index already exists
    const hasIndex = table?.indices?.some(
      (idx) => idx.columnNames.indexOf('depends_on_step_id') !== -1,
    );

    if (!hasIndex) {
      // Create index for better query performance
      await queryRunner.query(`
        CREATE INDEX \`IDX_steps_depends_on_step_id\` ON \`steps\` (\`depends_on_step_id\`)
      `);
    }

    // Migrate existing steps: set dependencies based on creation order within each service
    // This ensures backward compatibility by creating a dependency chain for existing steps
    // Only update steps that don't already have a dependency set
    await queryRunner.query(`
      UPDATE steps s1
      INNER JOIN (
        SELECT 
          s.id,
          s.service_id,
          s.created_at,
          (
            SELECT s2.id
            FROM steps s2
            WHERE s2.service_id = s.service_id
            AND (s2.created_at < s.created_at OR (s2.created_at = s.created_at AND s2.id < s.id))
            ORDER BY s2.created_at ASC, s2.id ASC
            LIMIT 1
          ) AS prev_id
        FROM steps s
        WHERE s.service_id IS NOT NULL
        AND s.depends_on_step_id IS NULL
      ) AS ordered ON s1.id = ordered.id
      SET s1.depends_on_step_id = ordered.prev_id
      WHERE ordered.prev_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('steps');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('depends_on_step_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('steps', foreignKey);
    }

    // Drop index
    const indices = table?.indices || [];
    const index = indices.find(
      (idx) => idx.columnNames.indexOf('depends_on_step_id') !== -1,
    );
    if (index) {
      await queryRunner.query(`
        DROP INDEX \`IDX_steps_depends_on_step_id\` ON \`steps\`
      `);
    }

    // Drop column
    const hasColumn = table?.findColumnByName('depends_on_step_id');
    if (hasColumn) {
      await queryRunner.dropColumn('steps', 'depends_on_step_id');
    }
  }
}
