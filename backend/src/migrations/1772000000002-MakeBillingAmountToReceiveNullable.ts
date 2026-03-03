import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeBillingAmountToReceiveNullable1772000000002 implements MigrationInterface {
  name = 'MakeBillingAmountToReceiveNullable1772000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make amount_to_receive nullable in billings table
    await queryRunner.changeColumn(
      'billings',
      'amount_to_receive',
      new TableColumn({
        name: 'amount_to_receive',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Update any NULL amounts to 0 before making it NOT NULL
    await queryRunner.query(`
      UPDATE billings 
      SET amount_to_receive = 0 
      WHERE amount_to_receive IS NULL
    `);

    // Revert: make amount_to_receive NOT NULL
    await queryRunner.changeColumn(
      'billings',
      'amount_to_receive',
      new TableColumn({
        name: 'amount_to_receive',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: false,
      }),
    );
  }
}
