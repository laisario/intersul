import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPriceAndPaymentFieldsToServices1771783423001 implements MigrationInterface {
  name = 'AddPriceAndPaymentFieldsToServices1771783423001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add price field
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add amount_to_receive field
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'amount_to_receive',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add payment_method field
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'payment_method',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Add is_invoiced field
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'is_invoiced',
        type: 'tinyint',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('services', 'is_invoiced');
    await queryRunner.dropColumn('services', 'payment_method');
    await queryRunner.dropColumn('services', 'amount_to_receive');
    await queryRunner.dropColumn('services', 'price');
  }
}
