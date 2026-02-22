import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBoletoBillingCategoryAndSteps1770000000000 implements MigrationInterface {
    name = 'CreateBoletoBillingCategoryAndSteps1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if category already exists to make migration idempotent
        const categoryExists = await queryRunner.query(
            `SELECT id FROM categories WHERE name = 'Cobrança de Boleto' LIMIT 1`
        );

        let categoryId: number;

        if (categoryExists && categoryExists.length > 0) {
            // Category already exists, use its ID
            categoryId = categoryExists[0].id;
        } else {
            // Create the category and get its ID
            await queryRunner.query(
                `INSERT INTO categories (name, description, created_at, updated_at) 
                 VALUES ('Cobrança de Boleto', 'Categoria para serviços de cobrança de boleto', NOW(), NOW())`
            );
            
            // Get the inserted category ID
            const insertedCategory = await queryRunner.query(
                `SELECT id FROM categories WHERE name = 'Cobrança de Boleto' LIMIT 1`
            );
            categoryId = insertedCategory[0].id;
        }

        // Check if template steps already exist to make migration idempotent
        const existingSteps = await queryRunner.query(
            `SELECT id FROM steps WHERE category_id = ? AND service_id IS NULL`,
            [categoryId]
        );

        // Only create steps if they don't exist (should be exactly 3)
        if (!existingSteps || existingSteps.length < 3) {
            // Define the 3 template steps for boleto billing
            const templateSteps = [
                {
                    name: 'Geração do Boleto',
                    description: 'Gerar boleto bancário para cobrança do serviço',
                },
                {
                    name: 'Envio do Boleto',
                    description: 'Enviar boleto ao cliente via email ou correio',
                },
                {
                    name: 'Confirmação de Pagamento',
                    description: 'Confirmar recebimento do pagamento do boleto',
                },
            ];

            // Insert template steps (only if they don't exist)
            for (const step of templateSteps) {
                const stepExists = await queryRunner.query(
                    `SELECT id FROM steps WHERE category_id = ? AND name = ? AND service_id IS NULL LIMIT 1`,
                    [categoryId, step.name]
                );

                if (!stepExists || stepExists.length === 0) {
                    await queryRunner.query(
                        `INSERT INTO steps (
                            name, 
                            description, 
                            category_id, 
                            service_id, 
                            status, 
                            is_billing, 
                            created_at, 
                            updated_at
                        ) VALUES (?, ?, ?, NULL, 'PENDING', 0, NOW(), NOW())`,
                        [step.name, step.description, categoryId]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Find the category
        const category = await queryRunner.query(
            `SELECT id FROM categories WHERE name = 'Cobrança de Boleto' LIMIT 1`
        );

        if (category && category.length > 0) {
            const categoryId = category[0].id;

            // Delete template steps (only those without service_id)
            await queryRunner.query(
                `DELETE FROM steps WHERE category_id = ? AND service_id IS NULL`,
                [categoryId]
            );

            // Check if category has any other steps or services before deleting
            const hasSteps = await queryRunner.query(
                `SELECT COUNT(*) as count FROM steps WHERE category_id = ?`,
                [categoryId]
            );
            const hasServices = await queryRunner.query(
                `SELECT COUNT(*) as count FROM services WHERE category_id = ?`,
                [categoryId]
            );

            // Only delete category if it has no steps or services
            if ((hasSteps[0]?.count || 0) === 0 && (hasServices[0]?.count || 0) === 0) {
                await queryRunner.query(
                    `DELETE FROM categories WHERE id = ?`,
                    [categoryId]
                );
            }
        }
    }
}
