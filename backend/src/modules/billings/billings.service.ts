import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Billing } from './entities/billing.entity';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { GenerateBillingsDto } from './dto/generate-billings.dto';
import { Client } from '../clients/entities/client.entity';
import { ClientCopyMachine } from '../copy-machines/entities/client-copy-machine.entity';
import { Service } from '../services/entities/service.entity';
import { Step } from '../services/entities/step.entity';
import { Category } from '../services/entities/category.entity';
import { User } from '../auth/entities/user.entity';
import { AcquisitionType } from '../../common/enums/acquisition-type.enum';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { StepStatus } from '../../common/enums/step-status.enum';

@Injectable()
export class BillingsService {
  constructor(
    @InjectRepository(Billing)
    private billingsRepository: Repository<Billing>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(ClientCopyMachine)
    private copyMachinesRepository: Repository<ClientCopyMachine>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(filters?: {
    city_id?: number;
    client_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Billing[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    const query = this.billingsRepository
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.copyMachine', 'copyMachine')
      .leftJoinAndSelect('billing.client', 'client')
      .leftJoinAndSelect('billing.responsibleUser', 'responsibleUser')
      .leftJoinAndSelect('billing.step', 'step')
      .leftJoinAndSelect('client.address', 'clientAddress')
      .leftJoinAndSelect('clientAddress.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.city', 'city');

    if (filters?.city_id) {
      query.andWhere('city.id = :city_id', { city_id: filters.city_id });
    }
    if (filters?.client_id) {
      query.andWhere('billing.client_id = :client_id', { client_id: filters.client_id });
    }

    const [data, total] = await query
      .orderBy('billing.date', 'DESC')
      .addOrderBy('billing.created_at', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<Billing> {
    const billing = await this.billingsRepository.findOne({
      where: { id },
      relations: [
        'copyMachine',
        'copyMachine.franchise',
        'copyMachine.catalogCopyMachine',
        'client',
        'client.address',
        'client.address.neighborhood',
        'client.address.neighborhood.city',
        'responsibleUser',
        'step',
        'step.responsable',
      ],
    });

    if (!billing) {
      throw new NotFoundException(`Billing with ID ${id} not found`);
    }

    return billing;
  }

  async create(createBillingDto: CreateBillingDto): Promise<Billing> {
    // Validate copy machine exists
    const copyMachine = await this.copyMachinesRepository.findOne({
      where: { id: createBillingDto.copy_machine_id },
    });
    if (!copyMachine) {
      throw new BadRequestException(`Copy machine with ID ${createBillingDto.copy_machine_id} not found`);
    }

    // Validate client exists
    const client = await this.clientsRepository.findOne({
      where: { id: createBillingDto.client_id },
    });
    if (!client) {
      throw new BadRequestException(`Client with ID ${createBillingDto.client_id} not found`);
    }

    // Validate responsible user exists
    const user = await this.usersRepository.findOne({
      where: { id: createBillingDto.responsible_user_id },
    });
    if (!user) {
      throw new BadRequestException(`User with ID ${createBillingDto.responsible_user_id} not found`);
    }

    const billing = this.billingsRepository.create({
      ...createBillingDto,
      date: new Date(createBillingDto.date),
    });

    const savedBilling = await this.billingsRepository.save(billing);

    // If payment method is boleto, create service automatically
    const paymentMethod = createBillingDto.payment_method?.toLowerCase();
    if (paymentMethod === 'boleto' || paymentMethod === 'bank slip' || paymentMethod === 'bankslip') {
      await this.createBoletoBillingService(
        savedBilling.client_id,
        savedBilling.copy_machine_id,
        savedBilling.id,
      );
      // Reload billing to get the step relationship
      return this.findOne(savedBilling.id);
    }

    return savedBilling;
  }

  async update(id: number, updateBillingDto: UpdateBillingDto, user?: { id: number; role: string }): Promise<Billing> {
    const billing = await this.findOne(id);
    
    // Check permissions: Admin/Manager can update any billing, others can only update if they're the responsible user
    if (user) {
      const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
      const isBillingResponsibleUser = billing.responsible_user_id === user?.id;
      
      // Also check if user is responsible for the associated step
      const isStepResponsibleUser = billing.step?.responsable?.id === user?.id;
      
      if (!isAdminOrManager && !isBillingResponsibleUser && !isStepResponsibleUser) {
        throw new ForbiddenException('Forbidden resource');
      }
    }

    if (updateBillingDto.copy_machine_id) {
      const copyMachine = await this.copyMachinesRepository.findOne({
        where: { id: updateBillingDto.copy_machine_id },
      });
      if (!copyMachine) {
        throw new BadRequestException(`Copy machine with ID ${updateBillingDto.copy_machine_id} not found`);
      }
    }

    if (updateBillingDto.client_id) {
      const client = await this.clientsRepository.findOne({
        where: { id: updateBillingDto.client_id },
      });
      if (!client) {
        throw new BadRequestException(`Client with ID ${updateBillingDto.client_id} not found`);
      }
    }

    if (updateBillingDto.responsible_user_id) {
      const user = await this.usersRepository.findOne({
        where: { id: updateBillingDto.responsible_user_id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${updateBillingDto.responsible_user_id} not found`);
      }
    }

    Object.assign(billing, {
      ...updateBillingDto,
      date: updateBillingDto.date ? new Date(updateBillingDto.date) : undefined,
    });

    const savedBilling = await this.billingsRepository.save(billing);

    // If payment method is boleto and service doesn't exist yet, create it automatically
    const paymentMethod = updateBillingDto.payment_method?.toLowerCase();
    if (paymentMethod === 'boleto' || paymentMethod === 'bank slip' || paymentMethod === 'bankslip') {
      // Check if service already exists
      const currentBilling = await this.findOne(id);
      if (!currentBilling.step?.service) {
        await this.createBoletoBillingService(
          savedBilling.client_id,
          savedBilling.copy_machine_id,
          savedBilling.id,
        );
        // Reload billing to get updated relationships
        return this.findOne(id);
      }
    }

    // If current_counter was updated, update last_counter on the machine and recalculate amount_to_receive if needed
    if (updateBillingDto.current_counter !== undefined && savedBilling.current_counter !== null) {
      const copyMachine = await this.copyMachinesRepository.findOne({
        where: { id: savedBilling.copy_machine_id },
        relations: ['franchise'],
      });
      if (copyMachine) {
        copyMachine.ultimo_contador = savedBilling.current_counter;
        await this.copyMachinesRepository.save(copyMachine);

        // Recalculate amount_to_receive based on new calculation logic
        if (copyMachine.franchise && savedBilling.previous_counter !== null) {
          const franchiseQuantity = copyMachine.franchise.quantity;
          const unitPrice = Number(copyMachine.franchise.unit_price);
          const previousCounter = savedBilling.previous_counter;
          const currentCounter = savedBilling.current_counter;
          const copiesMade = currentCounter - previousCounter;

          // Always charge for franchise value
          const franchiseValue = franchiseQuantity * unitPrice;
          
          if (copiesMade > franchiseQuantity) {
            // Counter exceeded franchise: charge franchise value + excess
            const excessCopies = copiesMade - franchiseQuantity;
            const excessValue = excessCopies * unitPrice;
            savedBilling.amount_to_receive = franchiseValue + excessValue;
          } else {
            // Within franchise: charge only franchise value
            savedBilling.amount_to_receive = franchiseValue;
          }
          
          await this.billingsRepository.save(savedBilling);
        }
      }
    }

    return savedBilling;
  }

  async remove(id: number): Promise<void> {
    const billing = await this.findOne(id);
    await this.billingsRepository.remove(billing);
  }

  /**
   * Ensure category "Fechamento de Franquia" exists
   */
  private async ensureBillingCategory(): Promise<Category> {
    let category = await this.categoriesRepository.findOne({
      where: { name: 'Fechamento de Franquia' },
    });

    if (!category) {
      category = this.categoriesRepository.create({
        name: 'Fechamento de Franquia',
        description: 'Categoria para fechamentos de franquia',
      });
      category = await this.categoriesRepository.save(category);
    }

    return category;
  }

  /**
   * Ensure category "Cobrança de Boleto" exists (steps are created by migration)
   */
  private async ensureBoletoBillingCategory(): Promise<Category> {
    let category = await this.categoriesRepository.findOne({
      where: { name: 'Cobrança de Boleto' },
    });

    if (!category) {
      // Category doesn't exist, create it (steps should be created by migration)
      category = this.categoriesRepository.create({
        name: 'Cobrança de Boleto',
        description: 'Categoria para serviços de cobrança de boleto',
      });
      category = await this.categoriesRepository.save(category);
    }

    return category;
  }

  /**
   * Create boleto billing service with steps when payment method is boleto
   */
  private async createBoletoBillingService(
    clientId: number,
    copyMachineId: number,
    billingId: number,
    responsibleUserId?: number,
    expirationDate?: string,
  ): Promise<Service | null> {
    // Get category
    const category = await this.ensureBoletoBillingCategory();

    // Check if service already exists for this billing
    const billing = await this.billingsRepository.findOne({
      where: { id: billingId },
      relations: ['step', 'step.service'],
    });

    let service: Service | null = null;
    if (billing?.step?.service) {
      service = billing.step.service;
    } else {
      // Create new service
      service = this.servicesRepository.create({
        client_id: clientId,
        category_id: category.id,
        client_copy_machine_id: copyMachineId,
        description: 'Serviço de cobrança de boleto',
        status: ServiceStatus.PENDING,
        is_internal: false,
        priority: 'high', // Always HIGH priority for cobrança category
      });
      service = await this.servicesRepository.save(service);
    }

    // Check if service already has steps (to avoid duplication)
    const existingServiceSteps = await this.stepsRepository.find({
      where: { 
        service_id: service.id,
        is_billing: false,
      },
    });

    if (existingServiceSteps.length > 0) {
      const updateData: any = {};
      if (responsibleUserId && responsibleUserId > 0) {
        updateData.responsable_id = responsibleUserId;
      }
      if (expirationDate) {
        updateData.datetime_expiration = new Date(expirationDate);
      }
      if (Object.keys(updateData).length > 0) {
        await this.stepsRepository.update(
          { service_id: service.id, is_billing: false },
          updateData
        );
      }
      return service;
    }

    // Get ONLY template steps (steps with category_id but NO service_id) - these are the 3 templates from migration
    // Use DISTINCT to avoid duplicates and limit to 3 to ensure we only get the templates
    const templateSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .where('step.category_id = :categoryId', { categoryId: category.id })
      .andWhere('step.service_id IS NULL')
      .orderBy('step.id', 'ASC')
      .limit(3)
      .getMany();

    if (!templateSteps || templateSteps.length === 0) {
      throw new BadRequestException('No template steps found for Boleto Billing category. Please run migrations.');
    }

    // Create service steps from templates - create exactly 3 steps
    const stepsToCreate = templateSteps.map((template, index) => {
      const stepData: any = {
        name: template.name,
        description: template.description,
        service_id: service.id,
        category_id: category.id,
        status: StepStatus.PENDING,
        is_billing: false,
      };
      
      // Assign responsible user to ALL steps if provided (required for boleto service)
      if (responsibleUserId && responsibleUserId > 0) {
        stepData.responsable_id = responsibleUserId;
      }
      
      // Set expiration date for ALL steps if provided
      if (expirationDate) {
        stepData.datetime_expiration = new Date(expirationDate);
      }
      
      return stepData;
    });

    // Create all steps at once
    const savedSteps = await this.stepsRepository.save(stepsToCreate);

    // Link first step to billing if billing doesn't have a step_id yet
    if (savedSteps.length > 0 && billing && !billing.step_id) {
      billing.step_id = savedSteps[0].id;
      await this.billingsRepository.save(billing);
    }

    return service;
  }

  /**
   * Get last billing for a copy machine to get previous_counter
   */
  private async getLastBilling(copyMachineId: number): Promise<Billing | null> {
    return this.billingsRepository.findOne({
      where: { copy_machine_id: copyMachineId },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Generate billings by city
   */
  async generateByCity(generateDto: GenerateBillingsDto): Promise<{
    billings: Billing[];
    services: Service[];
    steps: Step[];
  }> {
    // Validate city exists and get clients from that city
    const clients = await this.clientsRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.address', 'address')
      .leftJoinAndSelect('address.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.city', 'city')
      .leftJoinAndSelect('client.copyMachines', 'copyMachines')
      .leftJoinAndSelect('copyMachines.franchise', 'franchise')
      .leftJoinAndSelect('copyMachines.catalogCopyMachine', 'catalogCopyMachine')
      .where('city.id = :cityId', { cityId: generateDto.city_id })
      .andWhere('client.active = :active', { active: true })
      .getMany();

    if (clients.length === 0) {
      throw new BadRequestException(`No active clients found in the selected city`);
    }

    // Filter RENT machines
    const rentMachines: ClientCopyMachine[] = [];
    clients.forEach((client) => {
      const machines = client.copyMachines?.filter(
        (m) => m.acquisition_type === AcquisitionType.RENT && m.franchise,
      ) || [];
      rentMachines.push(...machines);
    });

    if (rentMachines.length === 0) {
      throw new BadRequestException(`No RENT machines found in the selected city`);
    }

    // Validate all machines in the mapping exist
    const machineIds = generateDto.machines.map((m) => m.copy_machine_id);
    const validMachines = rentMachines.filter((m) => machineIds.includes(m.id));
    if (validMachines.length !== machineIds.length) {
      throw new BadRequestException(`Some machines were not found or are not RENT`);
    }

    // Validate all users exist and are active
    const userIds = [...new Set(generateDto.machines.map((m) => m.responsible_user_id))];
    const users = await this.usersRepository.find({
      where: { id: In(userIds), active: true },
    });
    if (users.length !== userIds.length) {
      throw new BadRequestException(`Some users were not found or are inactive`);
    }

    // Ensure category exists
    const category = await this.ensureBillingCategory();

    // Get current date for service description
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const cityName = clients[0].address?.neighborhood?.city?.name || 'City';

    // Group machines by client
    const machinesByClient = new Map<number, ClientCopyMachine[]>();
    validMachines.forEach((machine) => {
      const clientId = machine.client_id;
      if (!machinesByClient.has(clientId)) {
        machinesByClient.set(clientId, []);
      }
      machinesByClient.get(clientId)!.push(machine);
    });

    const createdBillings: Billing[] = [];
    const createdServices: Service[] = [];
    const createdSteps: Step[] = [];

    // Create service and steps for each client
    for (const [clientId, machines] of machinesByClient.entries()) {
      const client = clients.find((c) => c.id === clientId);
      if (!client) continue;

      // Create service for this client
      const service = this.servicesRepository.create({
        client_id: clientId,
        category_id: category.id,
        description: `fechamento ${cityName} – ${month}/${year}`,
        priority: 'high',
        status: ServiceStatus.PENDING,
      });
      const savedService = await this.servicesRepository.save(service);
      createdServices.push(savedService);

      // Create billing and step for each machine
      for (const machine of machines) {
        const machineMapping = generateDto.machines.find((m) => m.copy_machine_id === machine.id);
        if (!machineMapping) continue;

        // Get last billing for previous_counter
        const lastBilling = await this.getLastBilling(machine.id);
        const previousCounter = lastBilling?.current_counter || machine.ultimo_contador || null;

        // Calculate amount_to_receive (initially 0, will be calculated when counters are filled)
        // The amount is calculated based on: (current_counter - previous_counter - franchise.quantity) * unit_price
        // Only excess copies beyond franchise are charged
        const amountToReceive = 0;

        // Get machine model name
        const modelName =
          machine.catalogCopyMachine?.model ||
          machine.external_model ||
          `${machine.external_manufacturer || ''} ${machine.external_model || ''}`.trim() ||
          'Machine';

        // Create billing
        const billing = this.billingsRepository.create({
          copy_machine_id: machine.id,
          client_id: clientId,
          date: now,
          previous_counter: previousCounter,
          amount_to_receive: amountToReceive,
          responsible_user_id: machineMapping.responsible_user_id,
          payment_method: (machineMapping as any).payment_method || undefined,
          is_invoiced: (machineMapping as any).is_invoiced ?? false,
        });
        const savedBilling = await this.billingsRepository.save(billing);
        createdBillings.push(savedBilling);

        // If payment method is Boleto, create boleto billing service
        const paymentMethod = savedBilling.payment_method?.toLowerCase();
        if (paymentMethod === 'bank slip' || paymentMethod === 'boleto') {
          const boletoServiceUserId = (machineMapping as any).boleto_service_responsible_user_id;
          const boletoServiceExpiration = (machineMapping as any).boleto_service_expiration_date;
          await this.createBoletoBillingService(
            savedBilling.client_id,
            savedBilling.copy_machine_id,
            savedBilling.id,
            boletoServiceUserId,
            boletoServiceExpiration,
          );
        }

        // Create step
        const stepDescription = `Modelo: ${modelName}\nFranquia: ${machine.franchise.quantity} páginas\nÚltimo contador: ${previousCounter ?? 'N/A'}`;
        const stepData: any = {
          name: `fechamento – ${client.name} – ${cityName}`,
          description: stepDescription,
          service_id: savedService.id,
          is_billing: true,
          status: StepStatus.PENDING,
        };
        
        // Validate and assign responsable_id if provided
        if (machineMapping.responsible_user_id) {
          const responsableUser = await this.usersRepository.findOne({
            where: { id: machineMapping.responsible_user_id },
          });
          if (!responsableUser) {
            throw new BadRequestException(`User with ID ${machineMapping.responsible_user_id} not found`);
          }
          stepData.responsable_id = machineMapping.responsible_user_id;
        }
        
        // Add expiration date if provided
        const expirationDate = (machineMapping as any).datetime_expiration;
        if (expirationDate) {
          stepData.datetime_expiration = new Date(expirationDate);
        }
        const step = this.stepsRepository.create(stepData);
        const savedStep = (await this.stepsRepository.save(step)) as unknown as Step;
        createdSteps.push(savedStep);

        // Link billing to step
        savedBilling.step_id = savedStep.id;
        await this.billingsRepository.save(savedBilling);
      }
    }

    return {
      billings: createdBillings,
      services: createdServices,
      steps: createdSteps,
    };
  }
}

