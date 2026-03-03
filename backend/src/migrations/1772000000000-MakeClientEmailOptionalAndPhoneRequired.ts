import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeClientEmailOptionalAndPhoneRequired1772000000000 implements MigrationInterface {
  name = 'MakeClientEmailOptionalAndPhoneRequired1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any NULL phones to a default value (to avoid constraint violation)
    // This handles existing records that might have NULL phone
    await queryRunner.query(`
      UPDATE clients 
      SET phone = 'N/A' 
      WHERE phone IS NULL OR phone = ''
    `);

    // Make email nullable (remove NOT NULL constraint)
    await queryRunner.changeColumn(
      'clients',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Make phone NOT NULL
    await queryRunner.changeColumn(
      'clients',
      'phone',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: make email NOT NULL
    await queryRunner.changeColumn(
      'clients',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: false,
        isUnique: true,
      }),
    );

    // Revert: make phone nullable
    await queryRunner.changeColumn(
      'clients',
      'phone',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }
}
