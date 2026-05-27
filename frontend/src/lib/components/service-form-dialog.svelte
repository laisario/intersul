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
	import { getPaymentMethodLabel } from '$lib/utils/formatting.js';
	import { useCreateService, useUpdateService, useService } from '$lib/hooks/queries/use-services.svelte.js';
	import ClientAsyncSelect from '$lib/components/client-async-select.svelte';
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
		description?: string;
		responsableId?: number;
		datetimeExpiration?: string;
		source?: 'suggestion' | 'manual';
		checklist_descriptions?: string[];
	};

	// Estado separado para previews extras (não modifica steps)
	let paymentStepPreview = $state<{
		description?: string;
		responsableId?: number;
		datetimeExpiration?: string;
	} | null>(null);

	let { open = $bindable(false), service = null, serviceId = null, onSuccess }: Props = $props();

	const createMutation = useCreateService();
	const updateMutation = useUpdateService();
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
		hasPayment: false,
		amountToReceive: undefined as number | undefined,
		paymentMethod: '' as string | undefined,
		isInvoiced: false
	});

	let steps = $state<FormStep[]>([]);

	let errors = $state<Record<string, string>>({});

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
			hasPayment: false,
			amountToReceive: undefined,
			paymentMethod: undefined,
			isInvoiced: false
		};
		steps = [];
		paymentStepPreview = null;
		errors = {};
	}

	function inferHasPaymentFromService(serviceData: Service): boolean {
		if (serviceData.isInternal) return false;
		const amt =
			serviceData.amountToReceive != null && Number(serviceData.amountToReceive) > 0;
		const pm = !!(serviceData.paymentMethod && String(serviceData.paymentMethod).trim());
		if (amt || pm || serviceData.isInvoiced) return true;
		const stepNames = (serviceData.steps || []).map((s) => s.name.trim().toLowerCase());
		return stepNames.some(
			(n) =>
				n === 'realizar pagamento' ||
				n === 'cobrança de boleto' ||
				n.includes('cobrança de boleto')
		);
	}

	function isAutoPaymentOrBoletoStepName(name: string): boolean {
		const n = name.trim().toLowerCase();
		return n === 'realizar pagamento' || n === 'cobrança de boleto';
	}

	function fillFromService(serviceData: Service) {
		formData.isInternal = serviceData.isInternal ?? false;
		formData.clientId = serviceData.clientId || 0;
		formData.categoryId = serviceData.categoryId;
		formData.clientCopyMachineId = serviceData.clientCopyMachineId ?? undefined;
		formData.description = serviceData.description || '';
		formData.priority = serviceData.priority || undefined;
		formData.hasPayment = inferHasPaymentFromService(serviceData);
		formData.amountToReceive = serviceData.amountToReceive;
		formData.paymentMethod = serviceData.paymentMethod;
		formData.isInvoiced = serviceData.isInvoiced ?? false;
		steps = (serviceData.steps || []).map((step) => ({
			name: step.name,
			description: step.description,
			responsableId: Number(step.responsableId),
			datetimeExpiration: step.datetimeExpiration,
			source: 'manual',
			checklist_descriptions: step.checklists?.map(c => c.description) || []
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
				source: 'suggestion',
				checklist_descriptions: step.checklists?.map(c => c.description) || []
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
				source: 'manual',
				checklist_descriptions: []
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
	const shouldShowPaymentPreview = $derived(!formData.isInternal && formData.hasPayment);

	// Inicializar previews quando necessário (somente com pagamento habilitado)
	$effect(() => {
		if (!initialized) return;

		if (shouldShowPaymentPreview && !paymentStepPreview) {
			paymentStepPreview = {
				description: '',
				responsableId: undefined,
				datetimeExpiration: undefined
			};
		} else if (!shouldShowPaymentPreview && paymentStepPreview) {
			paymentStepPreview = null;
		}
	});

	function isSuggestionAdded(step: Step) {
		return steps.some(
			(existing) =>
				existing.name.trim().toLowerCase() === step.name.trim().toLowerCase() &&
				(existing.description?.trim().toLowerCase() || '') === (step.description?.trim().toLowerCase() || '')
		);
	}

	function toggleSuggestionStep(suggestion: Step) {
		if (isSuggestionAdded(suggestion)) {
			const idx = steps.findIndex(
				(existing) =>
					existing.name.trim().toLowerCase() === suggestion.name.trim().toLowerCase() &&
					(existing.description?.trim().toLowerCase() || '') === (suggestion.description?.trim().toLowerCase() || '')
			);
			if (idx !== -1) {
				steps = steps.filter((_, i) => i !== idx);
			}
			return;
		}
		addSuggestionStep(suggestion);
	}

	function validateForm() {
		errors = {};

		const stepsToValidate = formData.hasPayment
			? steps
			: steps.filter((s) => !isAutoPaymentOrBoletoStepName(s.name));
		const invalidStep = stepsToValidate.some((step) => !step.name.trim());
		if (invalidStep) {
			errors.steps = 'Todas as etapas devem ter um nome';
		}

		if (!formData.isInternal && formData.hasPayment) {
			if (formData.amountToReceive !== undefined && formData.amountToReceive !== null && formData.amountToReceive <= 0) {
				errors.amountToReceive = 'Valor a receber deve ser um número positivo';
				return false;
			}
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
			payload.hasPayment = formData.hasPayment;

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

		if (!formData.isInternal && formData.hasPayment) {
			payload.amountToReceive = formData.amountToReceive;
			if (formData.paymentMethod) {
				payload.paymentMethod = formData.paymentMethod;
			}
			payload.isInvoiced = formData.isInvoiced;
		}

		const stepsArray: CreateServiceStepDto[] = [];

		const stepsForPayload = formData.hasPayment
			? steps
			: steps.filter((s) => !isAutoPaymentOrBoletoStepName(s.name));

		if (stepsForPayload.length > 0) {
			stepsArray.push(...stepsForPayload.map<CreateServiceStepDto>((step) => ({
				name: step.name.trim(),
				description: step.description?.trim() || undefined,
				responsableId: step.responsableId ? Number(step.responsableId) : undefined,
				datetimeExpiration: step.datetimeExpiration || undefined,
				checklist_descriptions: step.checklist_descriptions?.filter(c => c.trim()) || undefined
			})));
		}

		if (!formData.isInternal && formData.hasPayment) {
			const hasPaymentStep = stepsArray.some(
				(step) =>
					step.name.toLowerCase().includes('realizar pagamento') ||
					step.name.toLowerCase() === 'realizar pagamento'
			);

			if (!hasPaymentStep && paymentStepPreview) {
				stepsArray.push({
					name: 'Realizar pagamento',
					description: paymentStepPreview.description?.trim() || undefined,
					responsableId: paymentStepPreview.responsableId || undefined,
					datetimeExpiration: paymentStepPreview.datetimeExpiration || undefined
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
				</CardHeader>
				<CardContent class="space-y-3">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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
										formData.hasPayment = false;
										formData.amountToReceive = undefined;
										formData.paymentMethod = undefined;
										formData.isInvoiced = false;
										paymentStepPreview = null;
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
						</div>

						<div class="space-y-2">
							<Label>Categoria</Label>
							<Select
								type="single"
								value={formData.categoryId ? formData.categoryId.toString() : ''}
								onValueChange={(value: string) => {
									formData.categoryId = value ? parseInt(value) : 0;
									const cat = categories.find((c) => c.id === (value ? parseInt(value) : 0));
									if (cat && cat.name.toLowerCase().includes('cobrança')) {
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
						</div>

						<div class="space-y-2">
							<Label>Prioridade</Label>
							<Select
								type="single"
								value={formData.priority || ''}
								onValueChange={(value: string) => (formData.priority = value || undefined)}
							>
								<SelectTrigger>
									{formData.priority
										? (() => {
												const priorityKey = formData.priority!.toUpperCase() as keyof typeof SERVICE_PRIORITY;
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
							rows="2"
							placeholder="Descreva o serviço em detalhes"
							class="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>

					{#if !formData.isInternal}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<ClientAsyncSelect
									bind:value={formData.clientId}
									onValueChange={() => {
										formData.clientCopyMachineId = undefined;
									}}
									placeholder="Selecione um cliente"
								/>
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
							</div>
						</div>
					{/if}

					{#if !formData.isInternal}
					<div class="rounded-lg border bg-muted/20 p-3 space-y-2">
						<Label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={formData.hasPayment}
								onchange={(e) => {
									const checked = e.currentTarget.checked;
									formData.hasPayment = checked;
									if (!checked) {
										formData.amountToReceive = undefined;
										formData.paymentMethod = undefined;
										formData.isInvoiced = false;
										paymentStepPreview = null;
										steps = steps.filter((s) => !isAutoPaymentOrBoletoStepName(s.name));
									}
								}}
								class="mt-1 h-4 w-4 rounded border-gray-300"
							/>
							<span>
								<span class="font-medium">Serviço com pagamento</span>
								<span class="block text-xs font-normal text-muted-foreground mt-0.5">
									Ative apenas se houver cobrança ou etapas de pagamento. Campos e etapas automáticas ficam ocultos até então.
								</span>
							</span>
						</Label>
					</div>
					{/if}
				</CardContent>
			</Card>

			{#if selectedCategory}
				<Card>
					<CardHeader class="flex flex-row items-start justify-between gap-3 py-4">
						<div>
							<CardTitle class="text-lg">Etapas Sugeridas</CardTitle>
							<CardDescription>
								Clique para adicionar ou remover a etapa do serviço.
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
					<CardContent class="pt-0">
						{#if !suggestionSteps.length}
							<p class="text-sm text-muted-foreground">A categoria selecionada não possui etapas sugeridas.</p>
						{:else}
							<div class="divide-y rounded-lg border">
								{#each suggestionSteps as suggestion}
									<button
										type="button"
										class={`w-full text-left p-3 flex items-start justify-between gap-3 border transition-colors cursor-pointer ${
											isSuggestionAdded(suggestion)
												? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/60'
												: 'border-transparent hover:bg-muted/30'
										}`}
										onclick={() => toggleSuggestionStep(suggestion)}
									>
										<div class="min-w-0">
											<p class="font-medium text-sm truncate">{suggestion.name}</p>
											{#if suggestion.description}
												<p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{suggestion.description}</p>
											{/if}
										</div>
										<span class="shrink-0">
											{#if isSuggestionAdded(suggestion)}
												<Check class="w-4 h-4 text-muted-foreground" />
											{:else}
												<Plus class="w-4 h-4" />
											{/if}
										</span>
									</button>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

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
					{#if steps.length === 0 && !shouldShowPaymentPreview}
						<p class="text-sm text-muted-foreground">Nenhuma etapa adicionada. Utilize as sugestões ou crie uma etapa manualmente.</p>
					{:else}
						<div class="space-y-3">
							{#each steps as step, index (index)}
								<div class="border rounded-lg p-3 space-y-3">
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

									<!-- Checklist Section -->
									<div class="space-y-2 border-t pt-3 mt-3">
										<Label class="text-sm font-medium">Checklist (itens a serem completados)</Label>
										{#if step.checklist_descriptions && step.checklist_descriptions.length > 0}
											<div class="space-y-2 mb-3">
												{#each step.checklist_descriptions as checkItem, checkIndex}
													<div class="flex items-center gap-2">
														<Input
															value={step.checklist_descriptions[checkIndex]}
															oninput={(e) => {
																const newChecklist = [...(step.checklist_descriptions || [])];
																newChecklist[checkIndex] = e.currentTarget.value;
																updateStepField(index, 'checklist_descriptions', newChecklist);
															}}
															placeholder="Item do checklist"
															class="flex-1"
														/>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onclick={() => {
																const newChecklist = (step.checklist_descriptions || []).filter((_, i) => i !== checkIndex);
																updateStepField(index, 'checklist_descriptions', newChecklist);
															}}
															class="text-destructive hover:text-destructive/80"
														>
															<Trash2 class="w-4 h-4" />
														</Button>
													</div>
												{/each}
											</div>
										{/if}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={() => {
												const currentChecklist = step.checklist_descriptions || [];
												updateStepField(index, 'checklist_descriptions', [...currentChecklist, '']);
											}}
										>
											<Plus class="w-4 h-4 mr-2" />
											Adicionar Item
										</Button>
									</div>

									<!-- Description (Additional Information) - Secondary -->
									<div class="space-y-2 border-t pt-3 mt-3">
										<Label class="text-muted-foreground">Informações adicionais</Label>
										<textarea
											value={step.description || ''}
											oninput={(e) => updateStepField(index, 'description', e.currentTarget.value)}
											rows="2"
											placeholder="Detalhes adicionais (opcional)"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-muted-foreground"
										></textarea>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="space-y-2">
											<Label>Responsável</Label>
											<Select
												type="single"
												value={step.responsableId ? step.responsableId.toString() : ''}
												onValueChange={(value: string) => updateStepField(index, 'responsableId', value ? parseInt(value) : undefined)}
											>
												<SelectTrigger class="w-full">
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
											value={paymentStepPreview.description || ''}
											oninput={(e) => {
												if (paymentStepPreview) {
													paymentStepPreview.description = e.currentTarget.value;
												}
											}}
											rows="3"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
						</div>
					{/if}
					{#if errors.steps}
						<p class="text-sm text-destructive">{errors.steps}</p>
					{/if}
				</CardContent>
			</Card>

			{#if !formData.isInternal && formData.hasPayment}
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Informações de Pagamento</CardTitle>
						<CardDescription>
							Valores e método de cobrança deste serviço (somente quando há pagamento).
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
										{formData.paymentMethod
											? getPaymentMethodLabel(formData.paymentMethod)
											: 'Selecione o método de pagamento'}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Cash">Dinheiro</SelectItem>
										<SelectItem value="PIX">PIX</SelectItem>
										<SelectItem value="Debit Card">Cartão de Débito</SelectItem>
										<SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
										<SelectItem value="Bank Slip">Boleto</SelectItem>
										<SelectItem value="Transfer">Transferência</SelectItem>
										<SelectItem value="Fiado">Faturado</SelectItem>
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
