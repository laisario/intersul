import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1765399057001 implements MigrationInterface {
    name = 'InitialSchema1765399057001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_invitations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`token\` varchar(255) NOT NULL, \`role\` enum ('ADMIN', 'MANAGER', 'TECHNICIAN', 'COMMERCIAL') NOT NULL, \`position\` varchar(255) NULL, \`email\` varchar(255) NULL, \`expires_at\` timestamp NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`used_at\` timestamp NULL, \`created_by_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_1c885f83eb2a34fedd887e43e8\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`countries\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`code\` varchar(2) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fa1376321185575cf2226b1491\` (\`name\`), UNIQUE INDEX \`IDX_b47cbb5311bad9c9ae17b8c1ed\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`states\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(2) NOT NULL, \`name\` varchar(100) NOT NULL, \`country_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ad8e1b9273aa14bb1c42ca4548\` (\`code\`, \`country_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cities\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`state_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9ad75dbfcb7d82e3295d41f87b\` (\`name\`, \`state_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`neighborhoods\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`city_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_d15c300236c3472d96ab0f21c9\` (\`name\`, \`city_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`addresses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`postal_code\` varchar(10) NOT NULL, \`street\` varchar(200) NOT NULL, \`number\` varchar(20) NOT NULL, \`complement\` varchar(255) NULL, \`neighborhood_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`role\` enum ('ADMIN', 'MANAGER', 'TECHNICIAN', 'COMMERCIAL') NOT NULL DEFAULT 'TECHNICIAN', \`phone\` varchar(255) NULL, \`position\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`addressId\` int NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`REL_bafb08f60d7857f4670c172a6e\` (\`addressId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`copy_machine_catalog\` (\`id\` int NOT NULL AUTO_INCREMENT, \`model\` varchar(255) NOT NULL, \`manufacturer\` varchar(255) NOT NULL, \`description\` text NULL, \`features\` json NULL, \`price\` decimal(10,2) NULL, \`quantity\` int NULL, \`file\` varchar(500) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`franchises\` (\`id\` int NOT NULL AUTO_INCREMENT, \`period\` varchar(50) NOT NULL, \`paper_type\` varchar(20) NOT NULL, \`color\` tinyint NOT NULL DEFAULT 0, \`quantity\` int NOT NULL, \`unit_price\` decimal(10,4) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`client_copy_machines\` (\`id\` int NOT NULL AUTO_INCREMENT, \`serial_number\` varchar(255) NOT NULL, \`client_id\` int NOT NULL, \`catalog_copy_machine_id\` int NULL, \`external_model\` varchar(255) NULL, \`external_manufacturer\` varchar(255) NULL, \`external_description\` text NULL, \`acquisition_type\` enum ('RENT', 'SOLD', 'OWNED') NOT NULL, \`value\` decimal(10,2) NULL, \`franchise_id\` int NULL, \`ultimo_contador\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f1616c3660cf9fd84ea79a4718\` (\`serial_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`clients\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`cnpj\` varchar(255) NULL, \`cpf\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`how_met_company\` enum ('SOCIAL_MEDIA', 'REFERRAL', 'GOOGLE_SEARCH', 'WALK_IN', 'OTHER') NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`addressId\` int NULL, UNIQUE INDEX \`IDX_c2528f5ea78df3e939950b861c\` (\`cnpj\`), UNIQUE INDEX \`IDX_4245ac34add1ceeb505efc9877\` (\`cpf\`), UNIQUE INDEX \`IDX_b48860677afe62cd96e1265948\` (\`email\`), UNIQUE INDEX \`REL_67c4d10f39fdc8a0bbfccdcf73\` (\`addressId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`services\` (\`id\` int NOT NULL AUTO_INCREMENT, \`client_id\` int NULL, \`category_id\` int NULL, \`client_copy_machine_id\` int NULL, \`description\` text NULL, \`status\` enum ('PENDING', 'IN_PROGRESS', 'CONCLUDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`priority\` varchar(20) NULL, \`reason_cancellament\` text NULL, \`is_internal\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8b0be371d28245da6e4f4b6187\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`approvals\` (\`id\` int NOT NULL AUTO_INCREMENT, \`responsable_user_id\` int NOT NULL, \`datetime\` timestamp NOT NULL, \`approved\` tinyint NOT NULL, \`comments\` text NULL, \`step_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`images\` (\`id\` int NOT NULL AUTO_INCREMENT, \`path\` varchar(255) NOT NULL, \`step_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`billings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`copy_machine_id\` int NOT NULL, \`client_id\` int NOT NULL, \`date\` date NOT NULL, \`previous_counter\` int NULL, \`current_counter\` int NULL, \`payment_method\` varchar(50) NULL, \`amount_to_receive\` decimal(10,2) NOT NULL, \`is_invoiced\` tinyint NOT NULL DEFAULT 0, \`responsible_user_id\` int NOT NULL, \`step_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_54f2503187765fd4b4658b4751\` (\`step_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`steps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`observation\` text NULL, \`datetime_start\` timestamp NULL, \`datetime_conclusion\` timestamp NULL, \`datetime_expiration\` timestamp NULL, \`status\` enum ('PENDING', 'IN_PROGRESS', 'CONCLUDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`responsable_client\` varchar(255) NULL, \`reason_cancellament\` text NULL, \`category_id\` int NULL, \`service_id\` int NULL, \`is_billing\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`responsable_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dashboard_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`year\` int NOT NULL, \`month\` int NOT NULL, \`clients_total\` int NOT NULL DEFAULT '0', \`clients_new_this_month\` int NOT NULL DEFAULT '0', \`services_total\` int NOT NULL DEFAULT '0', \`services_pending\` int NOT NULL DEFAULT '0', \`services_in_progress\` int NOT NULL DEFAULT '0', \`services_completed\` int NOT NULL DEFAULT '0', \`services_cancelled\` int NOT NULL DEFAULT '0', \`services_this_week\` int NOT NULL DEFAULT '0', \`services_this_month\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_75a7a0bb6c2594b2451f741e9d\` (\`year\`, \`month\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_invitations\` ADD CONSTRAINT \`FK_a8ebb162a33c0a790d8344a68da\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`states\` ADD CONSTRAINT \`FK_f3bbd0bc19bb6d8a887add08461\` FOREIGN KEY (\`country_id\`) REFERENCES \`countries\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cities\` ADD CONSTRAINT \`FK_1229b56aa12cae674b824fccd13\` FOREIGN KEY (\`state_id\`) REFERENCES \`states\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`neighborhoods\` ADD CONSTRAINT \`FK_fe6e0f77e1c01ea2ce9d88e0f34\` FOREIGN KEY (\`city_id\`) REFERENCES \`cities\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_6741b6c68f7ac6b041f0a4b0fb4\` FOREIGN KEY (\`neighborhood_id\`) REFERENCES \`neighborhoods\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_bafb08f60d7857f4670c172a6ea\` FOREIGN KEY (\`addressId\`) REFERENCES \`addresses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` ADD CONSTRAINT \`FK_ca0490fd25efa92353c5daeda89\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` ADD CONSTRAINT \`FK_fb0c7377a93c13e3c07a4674028\` FOREIGN KEY (\`catalog_copy_machine_id\`) REFERENCES \`copy_machine_catalog\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` ADD CONSTRAINT \`FK_3f2ecd561ec19d851ca3268ae0b\` FOREIGN KEY (\`franchise_id\`) REFERENCES \`franchises\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD CONSTRAINT \`FK_67c4d10f39fdc8a0bbfccdcf73a\` FOREIGN KEY (\`addressId\`) REFERENCES \`addresses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_458874e221f4ed82fa478b755d8\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_1f8d1173481678a035b4a81a4ec\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_c9980cf20b640aab87dc352cb49\` FOREIGN KEY (\`client_copy_machine_id\`) REFERENCES \`client_copy_machines\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`approvals\` ADD CONSTRAINT \`FK_8b5e254c9baa8e5959fb5eed877\` FOREIGN KEY (\`responsable_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`approvals\` ADD CONSTRAINT \`FK_8a7accafd58139889b464943161\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`images\` ADD CONSTRAINT \`FK_b9bc8263599a8567b839df48af3\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_313bf2ecb24fe3f0954296fe762\` FOREIGN KEY (\`copy_machine_id\`) REFERENCES \`client_copy_machines\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_9a4f523381ce963bc280bca3944\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_d6a5bf18ae3589290df62910901\` FOREIGN KEY (\`responsible_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`billings\` ADD CONSTRAINT \`FK_54f2503187765fd4b4658b4751a\` FOREIGN KEY (\`step_id\`) REFERENCES \`steps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_71bbf2353238a7212f0f92ac250\` FOREIGN KEY (\`responsable_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_b2a29692e87b2afa817c5614e07\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_f4b48c6525bcba42b4f9b7f74ad\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_f4b48c6525bcba42b4f9b7f74ad\``);
        await queryRunner.query(`ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_b2a29692e87b2afa817c5614e07\``);
        await queryRunner.query(`ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_71bbf2353238a7212f0f92ac250\``);
        await queryRunner.query(`ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_54f2503187765fd4b4658b4751a\``);
        await queryRunner.query(`ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_d6a5bf18ae3589290df62910901\``);
        await queryRunner.query(`ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_9a4f523381ce963bc280bca3944\``);
        await queryRunner.query(`ALTER TABLE \`billings\` DROP FOREIGN KEY \`FK_313bf2ecb24fe3f0954296fe762\``);
        await queryRunner.query(`ALTER TABLE \`images\` DROP FOREIGN KEY \`FK_b9bc8263599a8567b839df48af3\``);
        await queryRunner.query(`ALTER TABLE \`approvals\` DROP FOREIGN KEY \`FK_8a7accafd58139889b464943161\``);
        await queryRunner.query(`ALTER TABLE \`approvals\` DROP FOREIGN KEY \`FK_8b5e254c9baa8e5959fb5eed877\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_c9980cf20b640aab87dc352cb49\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_1f8d1173481678a035b4a81a4ec\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_458874e221f4ed82fa478b755d8\``);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP FOREIGN KEY \`FK_67c4d10f39fdc8a0bbfccdcf73a\``);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` DROP FOREIGN KEY \`FK_3f2ecd561ec19d851ca3268ae0b\``);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` DROP FOREIGN KEY \`FK_fb0c7377a93c13e3c07a4674028\``);
        await queryRunner.query(`ALTER TABLE \`client_copy_machines\` DROP FOREIGN KEY \`FK_ca0490fd25efa92353c5daeda89\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_bafb08f60d7857f4670c172a6ea\``);
        await queryRunner.query(`ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_6741b6c68f7ac6b041f0a4b0fb4\``);
        await queryRunner.query(`ALTER TABLE \`neighborhoods\` DROP FOREIGN KEY \`FK_fe6e0f77e1c01ea2ce9d88e0f34\``);
        await queryRunner.query(`ALTER TABLE \`cities\` DROP FOREIGN KEY \`FK_1229b56aa12cae674b824fccd13\``);
        await queryRunner.query(`ALTER TABLE \`states\` DROP FOREIGN KEY \`FK_f3bbd0bc19bb6d8a887add08461\``);
        await queryRunner.query(`ALTER TABLE \`user_invitations\` DROP FOREIGN KEY \`FK_a8ebb162a33c0a790d8344a68da\``);
        await queryRunner.query(`DROP INDEX \`IDX_75a7a0bb6c2594b2451f741e9d\` ON \`dashboard_stats\``);
        await queryRunner.query(`DROP TABLE \`dashboard_stats\``);
        await queryRunner.query(`DROP TABLE \`steps\``);
        await queryRunner.query(`DROP INDEX \`REL_54f2503187765fd4b4658b4751\` ON \`billings\``);
        await queryRunner.query(`DROP TABLE \`billings\``);
        await queryRunner.query(`DROP TABLE \`images\``);
        await queryRunner.query(`DROP TABLE \`approvals\``);
        await queryRunner.query(`DROP INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\``);
        await queryRunner.query(`DROP TABLE \`categories\``);
        await queryRunner.query(`DROP TABLE \`services\``);
        await queryRunner.query(`DROP INDEX \`REL_67c4d10f39fdc8a0bbfccdcf73\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_b48860677afe62cd96e1265948\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_4245ac34add1ceeb505efc9877\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_c2528f5ea78df3e939950b861c\` ON \`clients\``);
        await queryRunner.query(`DROP TABLE \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_f1616c3660cf9fd84ea79a4718\` ON \`client_copy_machines\``);
        await queryRunner.query(`DROP TABLE \`client_copy_machines\``);
        await queryRunner.query(`DROP TABLE \`franchises\``);
        await queryRunner.query(`DROP TABLE \`copy_machine_catalog\``);
        await queryRunner.query(`DROP INDEX \`REL_bafb08f60d7857f4670c172a6e\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`addresses\``);
        await queryRunner.query(`DROP INDEX \`IDX_d15c300236c3472d96ab0f21c9\` ON \`neighborhoods\``);
        await queryRunner.query(`DROP TABLE \`neighborhoods\``);
        await queryRunner.query(`DROP INDEX \`IDX_9ad75dbfcb7d82e3295d41f87b\` ON \`cities\``);
        await queryRunner.query(`DROP TABLE \`cities\``);
        await queryRunner.query(`DROP INDEX \`IDX_ad8e1b9273aa14bb1c42ca4548\` ON \`states\``);
        await queryRunner.query(`DROP TABLE \`states\``);
        await queryRunner.query(`DROP INDEX \`IDX_b47cbb5311bad9c9ae17b8c1ed\` ON \`countries\``);
        await queryRunner.query(`DROP INDEX \`IDX_fa1376321185575cf2226b1491\` ON \`countries\``);
        await queryRunner.query(`DROP TABLE \`countries\``);
        await queryRunner.query(`DROP INDEX \`IDX_1c885f83eb2a34fedd887e43e8\` ON \`user_invitations\``);
        await queryRunner.query(`DROP TABLE \`user_invitations\``);
    }

}
