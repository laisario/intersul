import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class MakeMachineSerialNumberOptional1772000000001 implements MigrationInterface {
  name = 'MakeMachineSerialNumberOptional1772000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique index first
    await queryRunner.dropIndex('client_copy_machines', 'IDX_f1616c3660cf9fd84ea79a4718');

    // Make serial_number nullable
    await queryRunner.changeColumn(
      'client_copy_machines',
      'serial_number',
      new TableColumn({
        name: 'serial_number',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Create a unique index that allows multiple NULLs
    // MySQL allows multiple NULLs in a UNIQUE index, but we need to ensure the index is correct
    // For MySQL, we can create a unique index that will allow multiple NULLs
    await queryRunner.createIndex(
      'client_copy_machines',
      new TableIndex({
        name: 'IDX_f1616c3660cf9fd84ea79a4718',
        columnNames: ['serial_number'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique index
    await queryRunner.dropIndex('client_copy_machines', 'IDX_f1616c3660cf9fd84ea79a4718');

    // Update any NULL serial numbers to a default value
    await queryRunner.query(`
      UPDATE client_copy_machines 
      SET serial_number = CONCAT('AUTO-', id) 
      WHERE serial_number IS NULL OR serial_number = ''
    `);

    // Make serial_number NOT NULL
    await queryRunner.changeColumn(
      'client_copy_machines',
      'serial_number',
      new TableColumn({
        name: 'serial_number',
        type: 'varchar',
        length: '255',
        isNullable: false,
        isUnique: true,
      }),
    );

    // Recreate the unique index
    await queryRunner.createIndex(
      'client_copy_machines',
      new TableIndex({
        name: 'IDX_f1616c3660cf9fd84ea79a4718',
        columnNames: ['serial_number'],
        isUnique: true,
      }),
    );
  }
}
