<script lang="ts">
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from '$lib/components/ui/sheet/index.js';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Loader2, ClipboardList, Plus, Trash2, Check } from 'lucide-svelte';
	import { showError, successToast } from '$lib/utils/toast.js';
	import { SERVICE_PRIORITY } from '$lib/utils/constants.js';
	import { useCreateService, useUpdateService, useService } from '$lib/hooks/queries/use-services.svelte.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { useCategories } from '$lib/hooks/queries/use-categories.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { useClientCopyMachines } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import type {
		Service,
		CreateServiceStepDto,
		Step,
	} from '$lib/api/types/service.types.js';

	interface Props {
		open: boolean;
		service?: Service | null;
		serviceId?: number | null;
		onSuccess?: () => void;
	}

	type FormStep = {
		name: string;
		description: string;
		responsableId?: number;
		datetimeExpiration?: string;
		source?: 'suggestion' | 'manual';
	};

	// Estado separado para previews extras (não modifica steps)
	let paymentStepPreview = $state<{ responsableId?: number; datetimeExpiration?: string } | null>(null);
	let boletoStepPreview = $state<{ responsableId?: number; datetimeExpiration?: string } | null>(null);

	let { open = $bindable(false), service = null, serviceId = null, onSuccess }: Props = $props();

	const createMutation = useCreateService();
	const updateMutation = useUpdateService();
	const clientsQuery = useClients();
	const categoriesQuery = useCategories();
	const usersQuery = useUsers();
	const serviceDetailsQuery = $derived(serviceId ? useService(serviceId) : null);

	let initialized = $state(false);

	let formData = $state({
		isInternal: false,
		clientId: 0,
		categoryId: 0,
		clientCopyMachineId: undefined as number | undefined,
		description: '',
		priority: '' as string | undefined,
		amountToReceive: undefined as number | undefined,
		paymentMethod: '' as string | undefined,
		isInvoiced: false
	});

	let steps = $state<FormStep[]>([]);

	let errors = $state<{ clientId?: string; categoryId?: string; steps?: string; amountToReceive?: string; paymentMethod?: string }>({});

	const clients = $derived(clientsQuery.data ?? []);
	const categories = $derived(categoriesQuery.data ?? []);
	// Filter to only active users for selects (defensive filtering)
	const users = $derived((usersQuery.data ?? []).filter(u => u.active === true));
	const selectedCategory = $derived(categories.find((category) => category.id === formData.categoryId) || null);
	const suggestionSteps = $derived(selectedCategory?.steps ?? []);
	const clientCopyMachinesQuery = $derived(formData.clientId ? useClientCopyMachines(formData.clientId) : null);
	const clientCopyMachines = $derived(clientCopyMachinesQuery?.data ?? []);
	const selectedClientCopyMachine = $derived(
		clientCopyMachines.find((machine) => machine.id === formData.clientCopyMachineId) || null
	);

	function resetForm() {
		formData = {
			isInternal: false,
			clientId: 0,
			categoryId: 0,
			clientCopyMachineId: undefined,
			description: '',
			priority: undefined,
			amountToReceive: undefined,
			paymentMethod: undefined,
			isInvoiced: false
		};
		steps = [];
		paymentStepPreview = null;
		boletoStepPreview = null;
		errors = {};
	}

	function fillFromService(serviceData: Service) {
		formData.isInternal = serviceData.isInternal ?? false;
		formData.clientId = serviceData.clientId || 0;
		formData.categoryId = serviceData.categoryId;
		formData.clientCopyMachineId = serviceData.clientCopyMachineId ?? undefined;
		formData.description = serviceData.description || '';
		formData.priority = serviceData.priority || undefined;
		formData.amountToReceive = serviceData.amountToReceive;
		formData.paymentMethod = serviceData.paymentMethod;
		formData.isInvoiced = serviceData.isInvoiced ?? false;
		steps = (serviceData.steps || []).map((step) => ({
			name: step.name,
			description: step.description,
			responsableId: Number(step.responsableId),
			datetimeExpiration: step.datetimeExpiration,
			source: 'manual'
		}));
	}

	$effect(() => {
		if (!open) {
			resetForm();
			initialized = false;
			return;
		}

		if (initialized) return;

		const detailed = serviceDetailsQuery?.data;
		if (detailed) {
			fillFromService(detailed);
		} else if (service) {
			fillFromService(service);
		} else {
			resetForm();
		}

		initialized = true;
	});

	function addSuggestionStep(step: Step) {
		if (isSuggestionAdded(step)) return;

		steps = [
			...steps,
			{
				name: step.name,
				description: step.description,
				datetimeExpiration: step.datetimeExpiration,
				source: 'suggestion'
			}
		];
	}

	function addAllSuggestions() {
		suggestionSteps.forEach(addSuggestionStep);
	}

	function addManualStep() {
		steps = [
			...steps,
			{
				name: '',
				description: '',
				source: 'manual'
			}
		];
	}

	function removeStep(index: number) {
		steps = steps.filter((_, i) => i !== index);
	}

	function updateStepField(index: number, field: keyof FormStep, value: any) {
		steps = steps.map((step, i) => (i === index ? { ...step, [field]: value } : step));
	}

	// Previews extras calculados (não modificam steps)
	// Payment step is always shown for external services (regardless of amount)
	const shouldShowPaymentPreview = $derived(!formData.isInternal);
	
	const shouldShowBoletoPreview = $derived(() => {
		if (formData.isInternal) return false;
		const method = formData.paymentMethod?.toLowerCase() || '';
		return method === 'boleto' || method === 'bank slip' || method === 'bankslip' || method === 'bank slip';
	});
	
	// Função auxiliar para verificar se método é boleto (usado no submit)
	function isBoletoPaymentMethod(method: string | undefined): boolean {
		if (!method) return false;
		const lowerMethod = method.toLowerCase();
		return lowerMethod === 'boleto' || lowerMethod === 'bank slip' || lowerMethod === 'bankslip';
	}

	// Inicializar previews quando necessário
	// Payment step preview is always available for external services
	$effect(() => {
		if (!initialized) return;
		
		// Always initialize payment step preview for external services
		if (shouldShowPaymentPreview && !paymentStepPreview) {
			paymentStepPreview = { responsableId: undefined, datetimeExpiration: undefined };
		} else if (!shouldShowPaymentPreview && paymentStepPreview) {
			paymentStepPreview = null;
		}
		
		// Boleto step preview only for boleto payment method
		if (shouldShowBoletoPreview() && !boletoStepPreview) {
			boletoStepPreview = { responsableId: undefined, datetimeExpiration: undefined };
		} else if (!shouldShowBoletoPreview() && boletoStepPreview) {
			boletoStepPreview = null;
		}
	});

	function isSuggestionAdded(step: Step) {
		return steps.some(
			(existing) =>
				existing.name.trim().toLowerCase() === step.name.trim().toLowerCase() &&
				existing.description.trim().toLowerCase() === step.description.trim().toLowerCase()
		);
	}

	function validateForm() {
		errors = {};

		const invalidStep = steps.some((step) => !step.name.trim() || !step.description.trim());
		if (invalidStep) {
			errors.steps = 'Todas as etapas devem ter nome e descrição preenchidos';
		}

		// Validate external service payment fields
		if (!formData.isInternal) {
			// amount_to_receive is now optional, but if provided, must be positive
			if (formData.amountToReceive !== undefined && formData.amountToReceive !== null && formData.amountToReceive <= 0) {
				errors.amountToReceive = 'Valor a receber deve ser um número positivo';
				return false;
			}
			
			// Payment step is always generated for external services
			// Responsable is optional (can be set later in step details)
			// Boleto step responsable is also optional
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			showError('Por favor, corrija os erros no formulário');
			return;
		}

		const payload: any = {};
		
		payload.isInternal = formData.isInternal;
		
		if (!formData.isInternal) {
			if (formData.clientId > 0) {
				payload.clientId = formData.clientId;
			}
			
			if (formData.clientCopyMachineId) {
				payload.clientCopyMachineId = formData.clientCopyMachineId;
			}
		}
		
		if (formData.categoryId > 0) {
			payload.categoryId = formData.categoryId;
		}
		
		if (formData.description?.trim()) {
			payload.description = formData.description.trim();
		}
		
		if (formData.priority) {
			payload.priority = formData.priority;
		}

		if (!formData.isInternal) {
			payload.amountToReceive = formData.amountToReceive;
			if (formData.paymentMethod) {
				payload.paymentMethod = formData.paymentMethod;
			}
			payload.isInvoiced = formData.isInvoiced;
		}
		
		// Montar array de steps (normais + automáticos se EXTERNO)
		const stepsArray: CreateServiceStepDto[] = [];
		
		// Adicionar steps normais do formulário
		if (steps.length > 0) {
			stepsArray.push(...steps.map<CreateServiceStepDto>((step) => ({
				name: step.name.trim(),
				description: step.description.trim(),
				responsableId: step.responsableId ? Number(step.responsableId) : undefined,
				datetimeExpiration: step.datetimeExpiration || undefined
			})));
		}
		
		// Adicionar step de pagamento automaticamente se EXTERNO (sempre, mesmo sem amount_to_receive)
		// Backend will auto-generate this, but we include it in payload if user configured responsable/expiration
		if (!formData.isInternal) {
			// Verificar se já não existe step de pagamento
			const hasPaymentStep = stepsArray.some(step => 
				step.name.toLowerCase().includes('realizar pagamento') || 
				step.name.toLowerCase() === 'realizar pagamento'
			);
			
			if (!hasPaymentStep && paymentStepPreview) {
				// Build description based on whether amount is provided
				let description = 'Realizar pagamento.';
				if (formData.amountToReceive && formData.amountToReceive > 0) {
				const amountText = formData.amountToReceive.toFixed(2);
					description = `Realizar pagamento. Consulte o valor informado no serviço: R$ ${amountText}.`;
				} else {
					description = 'Realizar pagamento. O valor será definido posteriormente na etapa de pagamento.';
				}
				
				stepsArray.push({
					name: 'Realizar pagamento',
					description: description,
					responsableId: paymentStepPreview.responsableId || undefined,
					datetimeExpiration: paymentStepPreview.datetimeExpiration || undefined
				});
			}
		}
		
		// Adicionar step de boleto automaticamente se método for Boleto
		// Backend will auto-generate this, but we include it in payload if user configured responsable/expiration
		if (!formData.isInternal && isBoletoPaymentMethod(formData.paymentMethod)) {
			// Verificar se já não existe step de boleto
			const hasBoletoStep = stepsArray.some(step => 
				step.name.toLowerCase().includes('cobrança de boleto') || 
				step.name.toLowerCase() === 'cobrança de boleto'
			);
			
			if (!hasBoletoStep && boletoStepPreview) {
				stepsArray.push({
					name: 'Cobrança de boleto',
					description: 'Gerar/realizar cobrança via boleto para o serviço.',
					responsableId: boletoStepPreview.responsableId || undefined,
					datetimeExpiration: boletoStepPreview.datetimeExpiration || undefined
				});
			}
		}
		
		// Incluir steps no payload apenas se houver steps
		if (stepsArray.length > 0) {
			payload.steps = stepsArray;
		}

		try {
			if (serviceId || service) {
				await updateMutation.mutateAsync({
					id: serviceId || service!.id,
					data: payload
				});
				successToast.updated('serviço');
			} else {
				await createMutation.mutateAsync(payload);
				successToast.created('serviço');
			}

			open = false;
			onSuccess?.();
		} catch (error: any) {
			// Map backend field-level errors to form fields
			const errorData = error?.response?.data;
			if (errorData?.errors && Array.isArray(errorData.errors)) {
				// Clear previous errors
				errors = {};
				
				// Map each error to the appropriate form field
				errorData.errors.forEach((err: any) => {
					const field = err.field || err.property;
					const message = err.message || (err.constraints ? Object.values(err.constraints)[0] : 'Erro de validação');
					
					// Map backend field names to frontend form field names
					if (field?.includes('amount_to_receive')) {
						errors.amountToReceive = message;
					} else if (field?.includes('payment_method')) {
						errors.paymentMethod = message;
					} else if (field?.includes('steps') && field?.includes('responsable_id')) {
						// Extract step index if available
						const stepMatch = field.match(/steps\[(\d+)\]/);
						if (stepMatch) {
							const stepIndex = parseInt(stepMatch[1]);
							if (steps[stepIndex]) {
								errors[`steps.${stepIndex}.responsableId`] = message;
							}
						} else {
							errors.steps = message;
						}
					} else if (field?.includes('client_id')) {
						errors.clientId = message;
					} else if (field?.includes('category_id')) {
						errors.categoryId = message;
					} else {
						// Generic error - show in general message
						showError(message);
					}
				});
				
				// If we have field errors, show a general message too
				if (Object.keys(errors).length > 0) {
					showError('Por favor, corrija os erros no formulário');
				}
			} else {
				// Fallback to generic error message
			const message =
					errorData?.message ||
				error?.message ||
				'Erro ao salvar serviço';
			showError(message);
			}
		}
	}

	function closeDialog() {
		open = false;
	}
</script>

<Sheet bind:open>
	<SheetContent class="sm:max-w-[800px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle class="flex items-center gap-2">
				<ClipboardList class="w-5 h-5" />
				{serviceId || service ? 'Editar Serviço' : 'Novo Serviço'}
			</SheetTitle>
			<SheetDescription>
				Preencha as informações do serviço e personalize as etapas que serão executadas.
			</SheetDescription>
		</SheetHeader>

		<div class="space-y-6 mt-6 px-6 pb-6">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Informações do Serviço</CardTitle>
					<CardDescription>Defina o cliente, categoria e descrição do serviço.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label>Tipo de Serviço *</Label>
						<Select
							type="single"
							value={formData.isInternal ? 'internal' : 'external'}
							onValueChange={(value: string) => {
								formData.isInternal = value === 'internal';
								if (formData.isInternal) {
									formData.clientId = 0;
									formData.clientCopyMachineId = undefined;
								}
							}}
						>
							<SelectTrigger>
								{formData.isInternal ? 'Interno' : 'Externo'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="external">Externo</SelectItem>
								<SelectItem value="internal">Interno</SelectItem>
							</SelectContent>
						</Select>
						<p class="text-xs text-muted-foreground">
							Serviços internos não requerem cliente ou equipamento associado
						</p>
					</div>

					{#if !formData.isInternal}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>Cliente *</Label>
								<Select
									type="single"
									value={formData.clientId ? formData.clientId.toString() : ''}
									onValueChange={(value: string) => {
										formData.clientId = value ? parseInt(value) : 0;
										formData.clientCopyMachineId = undefined;
									}}
								>
									<SelectTrigger>
										{formData.clientId
											? clients.find((client) => client.id === formData.clientId)?.name || 'Selecione um cliente'
											: 'Selecione um cliente'}
									</SelectTrigger>
									<SelectContent>
										{#if clientsQuery.isLoading}
											<SelectItem value="" disabled>Carregando clientes...</SelectItem>
										{:else if clientsQuery.error}
											<SelectItem value="" disabled>Erro ao carregar clientes</SelectItem>
										{:else}
											{#each clients as client (client.id)}
												<SelectItem value={client.id.toString()}>
													{client.name}
												</SelectItem>
											{/each}
										{/if}
									</SelectContent>
								</Select>
							</div>

							<div class="space-y-2">
								<Label>Equipamento do Cliente</Label>
								<Select
									type="single"
									value={formData.clientCopyMachineId ? formData.clientCopyMachineId.toString() : ''}
									onValueChange={(value: string) => formData.clientCopyMachineId = value ? parseInt(value) : undefined}
									disabled={!formData.clientId}
								>
									<SelectTrigger class={!formData.clientId ? 'opacity-60 cursor-not-allowed' : ''}>
										{#if !formData.clientId}
											Selecione um cliente primeiro
										{:else if clientCopyMachinesQuery?.isLoading}
											Carregando equipamentos...
										{:else if clientCopyMachinesQuery?.error}
											Erro ao carregar equipamentos
										{:else if !clientCopyMachines.length}
											Nenhum equipamento cadastrado
										{:else if selectedClientCopyMachine}
											{selectedClientCopyMachine.catalogCopyMachine?.model ?? selectedClientCopyMachine.externalModel ?? 'Equipamento'} - {selectedClientCopyMachine.serialNumber}
										{:else}
											Selecione um equipamento
										{/if}
									</SelectTrigger>
									<SelectContent>
										{#if clientCopyMachinesQuery?.isLoading}
											<SelectItem value="" disabled>Carregando equipamentos...</SelectItem>
										{:else if clientCopyMachinesQuery?.error}
											<SelectItem value="" disabled>Erro ao carregar equipamentos</SelectItem>
										{:else if !clientCopyMachines.length}
											<SelectItem value="" disabled>Nenhum equipamento cadastrado</SelectItem>
										{:else}
											<SelectItem value="">
												<span class="text-muted-foreground">Sem equipamento</span>
											</SelectItem>
											{#each clientCopyMachines as machine (machine.id)}
												<SelectItem value={machine.id.toString()}>
													{machine.catalogCopyMachine?.model ?? machine.externalModel ?? 'Equipamento'} - {machine.serialNumber}
												</SelectItem>
											{/each}
										{/if}
									</SelectContent>
								</Select>
								<p class="text-xs text-muted-foreground">Se este serviço envolver máquina, escolha uma.</p>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label>Categoria</Label>
							<Select
								type="single"
								value={formData.categoryId ? formData.categoryId.toString() : ''}
								onValueChange={(value: string) => {
									formData.categoryId = value ? parseInt(value) : 0;
									// Auto-set priority to HIGH for "Cobrança" category
									const selectedCategory = categories.find((cat) => cat.id === (value ? parseInt(value) : 0));
									if (selectedCategory && selectedCategory.name.toLowerCase().includes('cobrança')) {
										formData.priority = 'high';
									}
								}}
							>
								<SelectTrigger>
									{formData.categoryId
										? categories.find((category) => category.id === formData.categoryId)?.name || 'Selecione uma categoria'
										: 'Selecione uma categoria'}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">
										<span class="text-muted-foreground">Sem categoria</span>
									</SelectItem>
									{#if categoriesQuery.isLoading}
										<SelectItem value="" disabled>Carregando categorias...</SelectItem>
									{:else if categoriesQuery.error}
										<SelectItem value="" disabled>Erro ao carregar categorias</SelectItem>
									{:else}
										{#each categories as category (category.id)}
											<SelectItem value={category.id.toString()}>
												{category.name}
											</SelectItem>
										{/each}
									{/if}
								</SelectContent>
							</Select>
							<p class="text-xs text-muted-foreground">Ideal preencher, mas não é obrigatório.</p>
						</div>

						<div class="space-y-2">
							<Label>Prioridade</Label>
							<Select
								type="single"
								value={formData.priority || ''}
								onValueChange={(value: string) => formData.priority = value || undefined}
							>
								<SelectTrigger>
									{formData.priority
										? (() => {
											const priorityKey = formData.priority.toUpperCase() as keyof typeof SERVICE_PRIORITY;
											return SERVICE_PRIORITY[priorityKey]?.label || formData.priority;
										})()
										: 'Selecione uma prioridade'}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">
										<span class="text-muted-foreground">Sem prioridade</span>
									</SelectItem>
									<SelectItem value="LOW">Baixa</SelectItem>
									<SelectItem value="MEDIUM">Média</SelectItem>
									<SelectItem value="HIGH">Alta</SelectItem>
									<SelectItem value="URGENT">Urgente</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div class="space-y-2">
						<Label>Descrição do Serviço</Label>
						<textarea
							value={formData.description}
							oninput={(e) => formData.description = e.currentTarget.value}
							rows="3"
							placeholder="Descreva o serviço em detalhes"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle class="text-lg">Etapas Sugeridas</CardTitle>
						<CardDescription>
							Selecione as etapas sugeridas pela categoria e personalize conforme necessário.
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={addAllSuggestions}
						disabled={!suggestionSteps.length}
					>
						<Plus class="w-4 h-4 mr-2" />
						Adicionar todas
					</Button>
				</CardHeader>
				<CardContent>
					{#if !selectedCategory}
						<p class="text-sm text-muted-foreground">Selecione uma categoria para visualizar as etapas sugeridas.</p>
					{:else if !suggestionSteps.length}
						<p class="text-sm text-muted-foreground">A categoria selecionada não possui etapas sugeridas.</p>
					{:else}
						<div class="space-y-3">
							{#each suggestionSteps as suggestion}
								<div class="border rounded-lg p-4 flex items-start justify-between gap-4">
									<div>
										<p class="font-medium text-sm">{suggestion.name}</p>
										<p class="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={() => addSuggestionStep(suggestion)}
										disabled={isSuggestionAdded(suggestion)}
									>
										{#if isSuggestionAdded(suggestion)}
											<Check class="w-4 h-4" />
										{:else}
											<Plus class="w-4 h-4" />
										{/if}
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle class="text-lg">Etapas do Serviço</CardTitle>
						<CardDescription>
							Adicione ou remova etapas conforme necessário.
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={addManualStep}
					>
						<Plus class="w-4 h-4 mr-2" />
						Adicionar Etapa
					</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if steps.length === 0 && !shouldShowPaymentPreview && !shouldShowBoletoPreview()}
						<p class="text-sm text-muted-foreground">Nenhuma etapa adicionada. Utilize as sugestões ou crie uma etapa manualmente.</p>
					{:else}
						<div class="space-y-4">
							{#each steps as step, index (index)}
								<div class="border rounded-lg p-4 space-y-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline">Etapa {index + 1}</Badge>
											{#if step.source === 'suggestion'}
												<span class="text-xs text-muted-foreground flex items-center gap-1">
													<Check class="w-3 h-3" />
													Sugerida pela categoria
												</span>
											{/if}
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="text-destructive"
											onclick={() => removeStep(index)}
										>
											<Trash2 class="w-4 h-4" />
										</Button>
									</div>

									<div class="space-y-2">
										<Label>Nome da etapa</Label>
										<Input
											value={step.name}
											oninput={(e) => updateStepField(index, 'name', e.currentTarget.value)}
											placeholder="Ex: Avaliação inicial"
										/>
									</div>

									<div class="space-y-2">
										<Label>Descrição</Label>
										<textarea
											value={step.description}
											oninput={(e) => updateStepField(index, 'description', e.currentTarget.value)}
											rows="3"
											placeholder="Descreva o que precisa ser feito nesta etapa"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										></textarea>
									</div>

									<div class="space-y-2">
										<Label>Responsável</Label>
										<Select
											type="single"
											value={step.responsableId ? step.responsableId.toString() : ''}
											onValueChange={(value: string) => updateStepField(index, 'responsableId', value ? parseInt(value) : undefined)}
										>
											<SelectTrigger class="w-full md:w-[220px]">
												{step.responsableId
													? users.find((user) => user.id === step.responsableId)?.name || 'Selecione um responsável'
													: 'Selecione um responsável'}
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													<span class="text-muted-foreground">Sem responsável</span>
												</SelectItem>
												{#if usersQuery.isLoading}
													<SelectItem value="" disabled>Carregando usuários...</SelectItem>
												{:else if usersQuery.error}
													<SelectItem value="" disabled>Erro ao carregar usuários</SelectItem>
												{:else}
													{#each users as user (user.id)}
														<SelectItem value={user.id.toString()}>
															{user.name}
														</SelectItem>
													{/each}
												{/if}
											</SelectContent>
										</Select>
									</div>

									<div class="space-y-2">
										<Label>Expira em</Label>
										<Input
											type="text"
											value={step.datetimeExpiration 
												? (() => {
													const date = new Date(step.datetimeExpiration);
													const day = String(date.getDate()).padStart(2, '0');
													const month = String(date.getMonth() + 1).padStart(2, '0');
													const year = date.getFullYear();
													return `${day}/${month}/${year}`;
												})()
												: ''}
											oninput={(e) => {
												let value = e.currentTarget.value.replace(/\D/g, ''); // Remove non-digits
												
												// Limit to 8 digits (ddmmyyyy)
												if (value.length > 8) {
													value = value.slice(0, 8);
												}
												
												// Format as dd/mm/yyyy
												let formatted = value;
												if (value.length > 2) {
													formatted = value.slice(0, 2) + '/' + value.slice(2);
												}
												if (value.length > 4) {
													formatted = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
												}
												
												// Update the input value
												e.currentTarget.value = formatted;
												
												// Parse and convert to ISO string when complete
												if (value.length === 8) {
													const day = parseInt(value.slice(0, 2), 10);
													const month = parseInt(value.slice(2, 4), 10) - 1; // Month is 0-indexed
													const year = parseInt(value.slice(4, 8), 10);
													
													if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
														const date = new Date(year, month, day);
														date.setHours(23, 59, 59, 999);
														updateStepField(index, 'datetimeExpiration', date.toISOString());
													} else {
														updateStepField(index, 'datetimeExpiration', undefined);
													}
												} else if (value.length === 0) {
													updateStepField(index, 'datetimeExpiration', undefined);
												}
											}}
											placeholder="dd/mm/aaaa"
											maxlength={10}
										/>
									</div>
								</div>
							{/each}
							
							<!-- Preview: Step de Pagamento (apenas visual) -->
							{#if shouldShowPaymentPreview && paymentStepPreview}
								<div class="border rounded-lg p-4 space-y-4 bg-muted/30">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline">Etapa {steps.length + 1}</Badge>
											<Badge variant="secondary" class="text-xs">Automática - Pagamento</Badge>
										</div>
									</div>

									<div class="space-y-2">
										<Label>Nome da etapa</Label>
										<Input
											value="Realizar pagamento"
											disabled
											class="bg-muted"
										/>
									</div>

									<div class="space-y-2">
										<Label>Descrição</Label>
										<textarea
											value={formData.amountToReceive && formData.amountToReceive > 0
												? `Realizar pagamento. Consulte o valor informado no serviço: R$ ${formData.amountToReceive.toFixed(2)}.`
												: 'Realizar pagamento. O valor será definido posteriormente na etapa de pagamento.'}
											disabled
											rows="3"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
										></textarea>
									</div>

									<div class="space-y-2">
										<Label>Responsável</Label>
										<Select
											type="single"
											value={paymentStepPreview.responsableId ? paymentStepPreview.responsableId.toString() : ''}
											onValueChange={(value: string) => {
												if (paymentStepPreview) {
													paymentStepPreview.responsableId = value ? parseInt(value) : undefined;
												}
											}}
										>
											<SelectTrigger class="w-full md:w-[220px]">
												{paymentStepPreview?.responsableId
													? users.find((user) => user.id === paymentStepPreview?.responsableId)?.name || 'Selecione um responsável'
													: 'Selecione um responsável'}
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													<span class="text-muted-foreground">Sem responsável</span>
												</SelectItem>
												{#if usersQuery.isLoading}
													<SelectItem value="" disabled>Carregando usuários...</SelectItem>
												{:else if usersQuery.error}
													<SelectItem value="" disabled>Erro ao carregar usuários</SelectItem>
												{:else}
													{#each users as user (user.id)}
														<SelectItem value={user.id.toString()}>
															{user.name}
														</SelectItem>
													{/each}
												{/if}
											</SelectContent>
										</Select>
									</div>

									<div class="space-y-2">
										<Label>Expira em</Label>
										<Input
											type="text"
											value={paymentStepPreview.datetimeExpiration 
												? (() => {
													const date = new Date(paymentStepPreview.datetimeExpiration!);
													const day = String(date.getDate()).padStart(2, '0');
													const month = String(date.getMonth() + 1).padStart(2, '0');
													const year = date.getFullYear();
													return `${day}/${month}/${year}`;
												})()
												: ''}
											oninput={(e) => {
												if (!paymentStepPreview) return;
												let value = e.currentTarget.value.replace(/\D/g, '');
												if (value.length > 8) value = value.slice(0, 8);
												let formatted = value;
												if (value.length > 2) formatted = value.slice(0, 2) + '/' + value.slice(2);
												if (value.length > 4) formatted = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
												e.currentTarget.value = formatted;
												if (value.length === 8) {
													const day = parseInt(value.slice(0, 2), 10);
													const month = parseInt(value.slice(2, 4), 10) - 1;
													const year = parseInt(value.slice(4, 8), 10);
													if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
														const date = new Date(year, month, day);
														date.setHours(23, 59, 59, 999);
														paymentStepPreview.datetimeExpiration = date.toISOString();
													} else {
														paymentStepPreview.datetimeExpiration = undefined;
													}
												} else if (value.length === 0) {
													paymentStepPreview.datetimeExpiration = undefined;
												}
											}}
											placeholder="dd/mm/aaaa"
											maxlength={10}
										/>
									</div>
								</div>
							{/if}

							<!-- Preview: Step de Boleto (apenas visual) -->
							{#if shouldShowBoletoPreview() && boletoStepPreview}
								<div class="border rounded-lg p-4 space-y-4 bg-muted/30">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline">Etapa {steps.length + (shouldShowPaymentPreview ? 2 : 1)}</Badge>
											<Badge variant="secondary" class="text-xs">Automática - Boleto</Badge>
										</div>
									</div>

									<div class="space-y-2">
										<Label>Nome da etapa</Label>
										<Input
											value="Cobrança de boleto"
											disabled
											class="bg-muted"
										/>
									</div>

									<div class="space-y-2">
										<Label>Descrição</Label>
										<textarea
											value="Realizar cobrança de boleto conforme método de pagamento informado"
											disabled
											rows="3"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
										></textarea>
									</div>

									<div class="space-y-2">
										<Label>Responsável</Label>
										<Select
											type="single"
											value={boletoStepPreview.responsableId ? boletoStepPreview.responsableId.toString() : ''}
											onValueChange={(value: string) => {
												if (boletoStepPreview) {
													boletoStepPreview.responsableId = value ? parseInt(value) : undefined;
												}
											}}
										>
											<SelectTrigger class="w-full md:w-[220px]">
												{boletoStepPreview?.responsableId
													? users.find((user) => user.id === boletoStepPreview?.responsableId)?.name || 'Selecione um responsável'
													: 'Selecione um responsável'}
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													<span class="text-muted-foreground">Sem responsável</span>
												</SelectItem>
												{#if usersQuery.isLoading}
													<SelectItem value="" disabled>Carregando usuários...</SelectItem>
												{:else if usersQuery.error}
													<SelectItem value="" disabled>Erro ao carregar usuários</SelectItem>
												{:else}
													{#each users as user (user.id)}
														<SelectItem value={user.id.toString()}>
															{user.name}
														</SelectItem>
													{/each}
												{/if}
											</SelectContent>
										</Select>
									</div>

									<div class="space-y-2">
										<Label>Expira em</Label>
										<Input
											type="text"
											value={boletoStepPreview.datetimeExpiration 
												? (() => {
													const date = new Date(boletoStepPreview.datetimeExpiration!);
													const day = String(date.getDate()).padStart(2, '0');
													const month = String(date.getMonth() + 1).padStart(2, '0');
													const year = date.getFullYear();
													return `${day}/${month}/${year}`;
												})()
												: ''}
											oninput={(e) => {
												if (!boletoStepPreview) return;
												let value = e.currentTarget.value.replace(/\D/g, '');
												if (value.length > 8) value = value.slice(0, 8);
												let formatted = value;
												if (value.length > 2) formatted = value.slice(0, 2) + '/' + value.slice(2);
												if (value.length > 4) formatted = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
												e.currentTarget.value = formatted;
												if (value.length === 8) {
													const day = parseInt(value.slice(0, 2), 10);
													const month = parseInt(value.slice(2, 4), 10) - 1;
													const year = parseInt(value.slice(4, 8), 10);
													if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
														const date = new Date(year, month, day);
														date.setHours(23, 59, 59, 999);
														boletoStepPreview.datetimeExpiration = date.toISOString();
													} else {
														boletoStepPreview.datetimeExpiration = undefined;
													}
												} else if (value.length === 0) {
													boletoStepPreview.datetimeExpiration = undefined;
												}
											}}
											placeholder="dd/mm/aaaa"
											maxlength={10}
										/>
									</div>
								</div>
							{/if}
						</div>
					{/if}
					{#if errors.steps}
						<p class="text-sm text-destructive">{errors.steps}</p>
					{/if}
				</CardContent>
			</Card>

			{#if !formData.isInternal}
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Informações de Pagamento</CardTitle>
						<CardDescription>
							Configure as informações de pagamento para serviços externos.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>Valor a Receber</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.amountToReceive?.toString() || ''}
									oninput={(e) => {
										const value = e.currentTarget.value;
										formData.amountToReceive = value ? parseFloat(value) : undefined;
									}}
									placeholder="0.00"
									class={errors.amountToReceive ? 'border-destructive' : ''}
								/>
								<p class="text-xs text-muted-foreground">Opcional. Pode ser preenchido posteriormente na etapa de pagamento.</p>
								{#if errors.amountToReceive}
									<p class="text-xs text-destructive">{errors.amountToReceive}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label>Método de Pagamento</Label>
								<Select
									type="single"
									value={formData.paymentMethod || ''}
									onValueChange={(value: string) => formData.paymentMethod = value || undefined}
								>
									<SelectTrigger>
										{formData.paymentMethod || 'Selecione o método de pagamento'}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Cash">Dinheiro</SelectItem>
										<SelectItem value="PIX">PIX</SelectItem>
										<SelectItem value="Debit Card">Cartão de Débito</SelectItem>
										<SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
										<SelectItem value="Bank Slip">Boleto</SelectItem>
										<SelectItem value="Transfer">Transferência</SelectItem>
										<SelectItem value="Fiado">Fiado</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div class="space-y-2">
							<Label class="flex items-center gap-2">
								<input
									type="checkbox"
									checked={formData.isInvoiced}
									onchange={(e) => formData.isInvoiced = e.currentTarget.checked}
									class="h-4 w-4 rounded border-gray-300"
								/>
								<span>Foi Pago</span>
							</Label>
							<p class="text-xs text-muted-foreground">Marque se o pagamento já foi realizado</p>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>

		<SheetFooter class="px-6 pb-6 mt-6 flex gap-2 justify-end">
			<Button
				type="button"
				variant="outline"
				onclick={closeDialog}
				disabled={createMutation.isPending || updateMutation.isPending}
			>
				Cancelar
			</Button>
			<Button
				type="button"
				onclick={handleSubmit}
				disabled={createMutation.isPending || updateMutation.isPending}
			>
				{#if createMutation.isPending || updateMutation.isPending}
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
				{/if}
				{serviceId || service ? 'Salvar alterações' : 'Criar serviço'}
			</Button>
		</SheetFooter>
	</SheetContent>
</Sheet>
