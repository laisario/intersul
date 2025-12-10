<script lang="ts">
	import { useStep, useUpdateStep, useStartStep, useConcludeStep, useCancelStep, useStepImages } from '$lib/hooks/queries/use-steps.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';

	// Translate payment method to Portuguese
	function getPaymentMethodLabel(method: string): string {
		const translations: Record<string, string> = {
			'Cash': 'Dinheiro',
			'PIX': 'PIX',
			'Debit Card': 'Cartão de Débito',
			'Credit Card': 'Cartão de Crédito',
			'Bank Slip': 'Boleto',
			'Transfer': 'Transferência',
		};
		return translations[method] || method;
	}
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { ArrowLeft, Save, Play, CheckCircle, XCircle, ExternalLink, Loader2, Image as ImageIcon, X, User, MoreVertical, Edit } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import StepImagesUpload from '$lib/components/step-images-upload.svelte';
	import { queryClient } from '$lib/config/query-client.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { env } from '$lib/config/env.js';
	import type { Image } from '$lib/api/types/service.types.js';
	import { user, canManageServices } from '$lib/stores/auth.svelte.js';
	import { useUpdateBilling, useBilling } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';

	const props = $props<{ data: { id: string } }>();
	const stepId = Number.parseInt(props.data.id, 10);
	const currentUser = $derived($user);
	const userCanManageServices = $derived($canManageServices);

	const stepQuery = $derived(useStep(stepId));
	const step = $derived(stepQuery.data);
	const isLoading = $derived(stepQuery.isLoading);
	const isError = $derived(stepQuery.isError);

	const imagesQuery = $derived(useStepImages(stepId));
	const images = $derived(imagesQuery.data || []);
	const isLoadingImages = $derived(imagesQuery.isLoading);

	const usersQuery = useUsers();
	const users = $derived(usersQuery.data || []);

	const { mutate: updateStep, isPending: isUpdating } = useUpdateStep();
	const { mutate: startStep, isPending: isStarting } = useStartStep();
	const { mutate: concludeStep, isPending: isConcluding } = useConcludeStep();
	const { mutate: cancelStep, isPending: isCancelling } = useCancelStep();
	const { mutate: updateBilling, isPending: isUpdatingBilling } = useUpdateBilling();

	let observation = $state('');
	let responsableClient = $state('');
	let cancelReason = $state('');
	let showCancelDialog = $state(false);
	let isSaving = $state(false);
	let isEditMode = $state(false);
	let selectedImage = $state<Image | null>(null);
	let showImagePreview = $state(false);
	let showEditResponsableDialog = $state(false);
	let selectedResponsableId = $state<number | null>(null);

	// Billing fields
	let previousCounter = $state<number | null>(null);
	let currentCounter = $state<number | null>(null);
	let paymentMethod = $state<string>('');
	let isInvoiced = $state<boolean>(false);
	let calculatedAmountToReceive = $state<number | null>(null);
	let isBillingEditMode = $state(false);

	// Form is only enabled when step status is IN_PROGRESS
	const isFormEnabled = $derived(step?.status === 'IN_PROGRESS');
	
	// Check if current user is the responsable for this step
	const isResponsable = $derived(
		currentUser?.id !== undefined && 
		step?.responsable?.id !== undefined && 
		currentUser.id === step.responsable.id
	);

	$effect(() => {
		if (step) {
			observation = step.observation || '';
			responsableClient = step.responsable_client || '';
			
			// Load billing data if exists
			if (step.is_billing && step.billing) {
				// Only update from step data if we're not in edit mode (to prevent resetting user input)
				if (!isBillingEditMode) {
					previousCounter = step.billing.previous_counter ?? null;
					currentCounter = step.billing.current_counter ?? null;
					paymentMethod = step.billing.payment_method || '';
					isInvoiced = step.billing.is_invoiced ?? false;
					
					// Calculate amount if counters are available
					if (currentCounter !== null && previousCounter !== null && step.billing.copyMachine?.franchise) {
						calculatedAmountToReceive = calculateAmountToReceive(
							previousCounter,
							currentCounter,
							step.billing.copyMachine.franchise
						);
					}
					
					// For billing steps, start in edit mode if form is enabled and billing data is not filled
					if (isFormEnabled) {
						const hasBillingData = step.billing.current_counter !== null || 
							step.billing.payment_method;
						isBillingEditMode = !hasBillingData;
					} else {
						isBillingEditMode = false;
					}
				} else {
					// If in edit mode, only recalculate if counters are available
					if (currentCounter !== null && previousCounter !== null && step.billing.copyMachine?.franchise) {
						calculatedAmountToReceive = calculateAmountToReceive(
							previousCounter,
							currentCounter,
							step.billing.copyMachine.franchise
						);
					}
				}
			}
			
			// Start in preview mode if there's saved data, otherwise start in edit mode
			// Only if form is enabled (IN_PROGRESS status)
			if (isFormEnabled) {
				const hasSavedData = (step.observation && step.observation.trim()) || (step.responsable_client && step.responsable_client.trim());
				isEditMode = !hasSavedData;
			} else {
				isEditMode = false; // Always preview mode for non-editable steps
			}
		}
	});

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'outline';
			case 'IN_PROGRESS':
				return 'secondary';
			case 'CONCLUDED':
				return 'default';
			case 'CANCELLED':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getStatusLabel(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'Pendente';
			case 'IN_PROGRESS':
				return 'Em Andamento';
			case 'CONCLUDED':
				return 'Concluído';
			case 'CANCELLED':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}

	async function handleSave() {
		if (!step) return;
		
		isSaving = true;
		try {
			updateStep(
				{
					id: step.id,
					data: {
						observation: observation.trim() || undefined,
						responsable_client: responsableClient.trim() || undefined,
					},
				},
				{
					onSuccess: () => {
						successToast.updated('Etapa');
						isEditMode = false; // Switch to preview mode
					},
					onError: () => {
						errorToast.update('Etapa');
					},
				},
			);
		} finally {
			isSaving = false;
		}
	}

	function handleEdit() {
		isEditMode = true;
	}

	function handleCancelEdit() {
		// Restore original values from step
		if (step) {
			observation = step.observation || '';
			responsableClient = step.responsable_client || '';
		}
		isEditMode = false;
	}

	function handleImageClick(image: Image) {
		selectedImage = image;
		showImagePreview = true;
	}

	function closeImagePreview() {
		showImagePreview = false;
		selectedImage = null;
	}

	function handleStart() {
		if (!step) return;
		
		startStep(step.id, {
			onSuccess: () => {
				successToast.updated('Etapa iniciada');
			},
			onError: () => {
				errorToast.update('Etapa');
			},
		});
	}

	function handleConclude() {
		if (!step) return;
		
		concludeStep(step.id, {
			onSuccess: () => {
				successToast.updated('Etapa concluída');
			},
			onError: () => {
				errorToast.update('Etapa');
			},
		});
	}

	function handleCancel() {
		if (!step) return;
		
		if (!cancelReason.trim()) {
			showError('Por favor, informe o motivo do cancelamento');
			return;
		}
		
		cancelStep(
			{
				id: step.id,
				reason: cancelReason.trim(),
			},
			{
				onSuccess: () => {
					successToast.updated('Etapa cancelada');
					showCancelDialog = false;
					cancelReason = '';
				},
				onError: () => {
					errorToast.update('Etapa');
				},
			},
		);
	}

	function openCancelDialog() {
		showCancelDialog = true;
		cancelReason = '';
	}

	function closeCancelDialog() {
		showCancelDialog = false;
		cancelReason = '';
	}

	function goToService() {
		if (step?.service_id) {
			goto(`/services/${step.service_id}`);
		}
	}

	function goToClient() {
		if (step?.service?.client_id) {
			goto(`/clients/${step.service.client_id}`);
		} else if (step?.service?.client?.id) {
			goto(`/clients/${step.service.client.id}`);
		}
	}

	function openEditResponsableDialog() {
		selectedResponsableId = step?.responsable?.id || null;
		showEditResponsableDialog = true;
	}

	function closeEditResponsableDialog() {
		showEditResponsableDialog = false;
		selectedResponsableId = null;
	}

	function handleUpdateResponsable() {
		if (!step) return;
		
		if (selectedResponsableId === step.responsable?.id) {
			closeEditResponsableDialog();
			return;
		}
		
		const updateData: { responsable_id?: number | null } = {};
		
		updateData.responsable_id = selectedResponsableId ?? null;

		console.log('updateData', updateData);
		
		updateStep(
			{
				id: step.id,
				data: updateData,
			},
			{
				onSuccess: (updatedStep) => {
					successToast.updated('Responsável da etapa');
					closeEditResponsableDialog();
				},
				onError: (error: any) => {
					console.error('Error updating responsable:', error);
					const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar responsável';
					showError(errorMessage);
				},
			},
		);
	}

	async function handleSaveBilling() {
		if (!step?.billing) return;

		// Validate required fields
		if (currentCounter === null) {
			showError('Por favor, preencha o contador atual');
			return;
		}

		if (previousCounter === null) {
			showError('Por favor, preencha o contador anterior');
			return;
		}

		// Calculate amount to receive
		const amountToReceive = calculatedAmountToReceive ?? 0;

		isSaving = true;
		try {
			updateBilling(
				{
					id: step.billing.id,
					data: {
						previous_counter: previousCounter,
						current_counter: currentCounter,
						payment_method: paymentMethod || undefined,
						amount_to_receive: amountToReceive,
						is_invoiced: isInvoiced,
					},
				},
				{
					onSuccess: () => {
						successToast.updated('Fechamento');
						isBillingEditMode = false;
					},
					onError: () => {
						errorToast.update('Fechamento');
					},
				}
			);
		} finally {
			isSaving = false;
		}
	}

	function handleEditBilling() {
		isBillingEditMode = true;
	}

	function handleCancelEditBilling() {
		if (step?.billing) {
			previousCounter = step.billing.previous_counter ?? null;
			currentCounter = step.billing.current_counter ?? null;
			paymentMethod = step.billing.payment_method || '';
			isInvoiced = step.billing.is_invoiced ?? false;
			calculatedAmountToReceive = null;
			
			// Recalculate if counters exist
			if (currentCounter !== null && previousCounter !== null && step.billing.copyMachine?.franchise) {
				calculatedAmountToReceive = calculateAmountToReceive(
					previousCounter,
					currentCounter,
					step.billing.copyMachine.franchise
				);
			}
		}
		isBillingEditMode = false;
	}

	// Calculate amount to receive based on counters and franchise
	function calculateAmountToReceive(
		previous: number | null,
		current: number | null,
		franchise: { quantity: number; unitPrice?: number; unit_price?: number }
	): number | null {
		if (previous === null || current === null) return null;
		
		const copiesMade = current - previous;
		if (copiesMade <= 0) return 0;
		
		const unitPrice = franchise.unitPrice ?? (franchise as any).unit_price ?? 0;
		if (unitPrice <= 0) return null;
		
		const franchiseValue = franchise.quantity * unitPrice;
		
		// Always charge for franchise value
		// If copies made exceed franchise, add excess charges
		if (copiesMade <= franchise.quantity) {
			// Within franchise: charge only franchise value
			return franchiseValue;
		} else {
			// Exceeded franchise: charge franchise value + excess
			const excessCopies = copiesMade - franchise.quantity;
			const excessValue = excessCopies * unitPrice;
			return franchiseValue + excessValue;
		}
	}

	// Calculate when current counter changes
	$effect(() => {
		if (currentCounter !== null && previousCounter !== null && step?.billing?.copyMachine?.franchise) {
			calculatedAmountToReceive = calculateAmountToReceive(
				previousCounter,
				currentCounter,
				step.billing.copyMachine.franchise
			);
		} else {
			calculatedAmountToReceive = null;
		}
	});
</script>

<svelte:head>
	<title>Etapa - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">

	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar
			</Button>
			<div>
				<h1 class="text-3xl font-bold">Detalhes da Etapa</h1>
				<p class="text-muted-foreground">Gerencie os detalhes da etapa</p>
			</div>
		</div>
		{#if step}
			{#if step.status === 'CONCLUDED'}
				<div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
					<div class="flex items-center gap-2">
						<CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
						<p class="text-sm font-medium text-green-800 dark:text-green-200">
							Esta etapa já foi concluída
						</p>
					</div>
				</div>
			{:else if step.status === 'CANCELLED'}
				<div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
					<div class="flex items-center gap-2">
						<XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
						<p class="text-sm font-medium text-red-800 dark:text-red-200">
							Esta etapa foi cancelada
						</p>
					</div>
				</div>
			{:else if isResponsable}
				{#if step.status === 'PENDING'}
					<Button
						onclick={handleStart}
						disabled={isStarting}
						class="w-full sm:w-auto"
					>
						{#if isStarting}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						{:else}
							<Play class="w-4 h-4 mr-2" />
						{/if}
						Começar Etapa
					</Button>
				{:else if step.status === 'IN_PROGRESS'}
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
						<Button
							onclick={handleConclude}
							disabled={isConcluding}
							class="w-full sm:w-auto"
						>
							{#if isConcluding}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
							{:else}
								<CheckCircle class="w-4 h-4 mr-2" />
							{/if}
							Concluir Etapa
						</Button>
						<Button
							variant="destructive"
							onclick={openCancelDialog}
							disabled={isCancelling}
							class="w-full sm:w-auto"
						>
							<XCircle class="w-4 h-4 mr-2" />
							Cancelar Etapa
						</Button>
					</div>
				{/if}
			{/if}
		{/if}
	</div>

	{#if isLoading}
		<Card>
			<CardContent class="p-6">
				<div class="space-y-4">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-32 w-full" />
				</div>
			</CardContent>
		</Card>
	{:else if isError || !step}
		<Card>
			<CardContent class="p-6">
				<div class="text-center">
					<p class="text-lg font-medium text-red-600">Erro ao carregar etapa</p>
					<p class="text-sm text-muted-foreground mt-2">
						{stepQuery.error?.message || 'Etapa não encontrada ou você não tem permissão para visualizá-la.'}
					</p>
					<Button onclick={() => goto('/')} class="mt-4">
						Voltar ao Dashboard
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Billing Information (for billing steps, appears first) -->
				{#if step.is_billing && step.billing}
					<Card>
						<CardHeader>
							<div>
								<CardTitle>Dados do Fechamento</CardTitle>
								<CardDescription>
									{#if isFormEnabled}
										Preencha as informações do fechamento de franquia
									{:else}
										Informações do fechamento de franquia
									{/if}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if !isFormEnabled}
								<!-- Warning when step is not started -->
								<div class="bg-muted/50 border border-muted rounded-lg p-4">
									<p class="text-sm text-muted-foreground">
										{#if step.status === 'PENDING'}
											Para preencher este formulário, você precisa iniciar a etapa clicando no botão "Iniciar Etapa" ao lado.
										{:else if step.status === 'CONCLUDED'}
											Esta etapa já foi concluída e não pode mais ser editada.
										{:else if step.status === 'CANCELLED'}
											Esta etapa foi cancelada e não pode mais ser editada.
										{:else}
											O formulário está desabilitado.
										{/if}
									</p>
								</div>
								<!-- Show preview even when step is concluded/cancelled -->
								<div class="space-y-4">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p class="text-sm font-medium text-muted-foreground">Contador Anterior</p>
											<p class="text-sm">{step.billing.previous_counter ?? 'N/A'}</p>
										</div>
										<div>
											<p class="text-sm font-medium text-muted-foreground">Contador Atual</p>
											<p class="text-sm">{step.billing.current_counter ?? 'Não preenchido'}</p>
										</div>
									</div>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p class="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
											<p class="text-sm">{step.billing.payment_method ? getPaymentMethodLabel(step.billing.payment_method) : 'Não informado'}</p>
										</div>
										<div>
											<p class="text-sm font-medium text-muted-foreground">Pagamento Concluído</p>
											<p class="text-sm">{step.billing.is_invoiced ? 'Sim' : 'Não'}</p>
										</div>
									</div>
									<div>
										<p class="text-sm font-medium text-muted-foreground">Valor a Receber</p>
										<p class="text-sm font-semibold">{formatCurrency(step.billing.amount_to_receive)}</p>
									</div>
									{#if step.billing.copyMachine}
										<div>
											<p class="text-sm font-medium text-muted-foreground">Máquina</p>
											<p class="text-sm">
												{step.billing.copyMachine.catalogCopyMachine?.model ||
													step.billing.copyMachine.external_model ||
													step.billing.copyMachine.serial_number}
											</p>
										</div>
									{/if}
								</div>
							{:else if isBillingEditMode && isResponsable}
								<!-- Edit Mode -->
								<div class="space-y-4">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="space-y-2">
											<Label for="previous-counter">Contador Anterior *</Label>
											<Input
												id="previous-counter"
												type="number"
												bind:value={previousCounter}
												placeholder="Digite o contador anterior"
												disabled={step.billing.previous_counter !== null}
												class={step.billing.previous_counter !== null ? 'bg-muted' : ''}
											/>
											{#if step.billing.previous_counter !== null}
												<p class="text-xs text-muted-foreground">Este valor já foi preenchido anteriormente</p>
											{/if}
										</div>
										<div class="space-y-2">
											<Label for="current-counter">Contador Atual *</Label>
											<Input
												id="current-counter"
												type="number"
												bind:value={currentCounter}
												placeholder="Digite o contador atual"
											/>
										</div>
									</div>

									<!-- Payment method: show as preview if already filled (anytime) -->
									{#if step.billing.payment_method}
										<div class="space-y-2">
											<Label>Forma de Pagamento</Label>
											<Input
												type="text"
												value={getPaymentMethodLabel(step.billing.payment_method)}
												disabled
												class="bg-muted"
											/>
										</div>
									{/if}

									<!-- Calculation Display (only shown when current counter is entered) -->
									{#if currentCounter !== null && previousCounter !== null && step.billing.copyMachine?.franchise}
										{@const copiesMade = currentCounter - previousCounter}
										{@const franchiseQuantity = step.billing.copyMachine.franchise.quantity}
										{@const unitPrice = step.billing.copyMachine.franchise.unitPrice ?? (step.billing.copyMachine.franchise as any).unit_price ?? 0}
										{@const franchiseValue = franchiseQuantity * unitPrice}
										{@const excessCopies = copiesMade > franchiseQuantity ? copiesMade - franchiseQuantity : 0}
										{@const excessValue = excessCopies * unitPrice}
										
										<div class="bg-muted/50 border border-muted rounded-lg p-4 space-y-2">
											<h4 class="text-sm font-semibold">Cálculo do Valor</h4>
											<div class="space-y-1 text-sm">
												<div class="flex justify-between">
													<span class="text-muted-foreground">Cópias realizadas:</span>
													<span class="font-medium">{copiesMade.toLocaleString('pt-BR')}</span>
												</div>
												<div class="flex justify-between">
													<span class="text-muted-foreground">Franquia incluída:</span>
													<span class="font-medium">{franchiseQuantity.toLocaleString('pt-BR')} páginas</span>
												</div>
												<div class="flex justify-between">
													<span class="text-muted-foreground">Valor da franquia:</span>
													<span class="font-medium">{formatCurrency(franchiseValue)}</span>
												</div>
												{#if copiesMade > franchiseQuantity}
													<div class="flex justify-between">
														<span class="text-muted-foreground">Excesso de cópias:</span>
														<span class="font-medium">{excessCopies.toLocaleString('pt-BR')}</span>
													</div>
													<div class="flex justify-between">
														<span class="text-muted-foreground">Preço unitário:</span>
														<span class="font-medium">{formatCurrency(unitPrice)}</span>
													</div>
													<div class="flex justify-between">
														<span class="text-muted-foreground">Valor do excesso:</span>
														<span class="font-medium">{formatCurrency(excessValue)}</span>
													</div>
												{/if}
												<div class="flex justify-between pt-2 border-t">
													<span class="font-semibold">Valor a Receber:</span>
													<span class="font-bold text-primary">{formatCurrency(calculatedAmountToReceive ?? 0)}</span>
												</div>
											</div>
										</div>

										<!-- Amount to Receive (auto-filled, read-only) -->
										<div class="space-y-2">
											<Label>Valor a Receber</Label>
											<Input
												type="text"
												value={formatCurrency(calculatedAmountToReceive ?? 0)}
												disabled
												class="bg-muted font-semibold"
											/>
										</div>
									{/if}

									<!-- Payment method input and is_invoiced: only show if payment method is not already filled AND counters are filled -->
									{#if !step.billing.payment_method && currentCounter !== null && previousCounter !== null}
										<!-- Payment Method Input -->
										<div class="space-y-2">
											<Label for="payment-method">Forma de Pagamento</Label>
											<Select
												type="single"
												value={paymentMethod}
												onValueChange={(value: string) => {
													paymentMethod = value || '';
												}}
											>
											<SelectTrigger id="payment-method">
												{paymentMethod ? getPaymentMethodLabel(paymentMethod) : 'Selecione a forma de pagamento'}
											</SelectTrigger>
												<SelectContent>
													<SelectItem value="">Nenhuma</SelectItem>
													<SelectItem value="Cash">Dinheiro</SelectItem>
													<SelectItem value="PIX">PIX</SelectItem>
													<SelectItem value="Debit Card">Cartão de Débito</SelectItem>
													<SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
													<SelectItem value="Bank Slip">Boleto</SelectItem>
													<SelectItem value="Transfer">Transferência</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<!-- is_invoiced: only show after current counter is filled (like valor a receber) -->
										<div class="space-y-2">
											<Label for="is-invoiced" class="flex items-center gap-2">
												<input
													id="is-invoiced"
													type="checkbox"
													checked={isInvoiced}
													onchange={(e) => {
														isInvoiced = e.currentTarget.checked;
													}}
													class="h-4 w-4 rounded border-gray-300"
												/>
												<span>Pagamento Concluído</span>
											</Label>
											<p class="text-xs text-muted-foreground">Marque quando o cliente efetuar o pagamento</p>
										</div>
									{:else if step.billing.payment_method && currentCounter !== null && previousCounter !== null}
										<!-- Show is_invoiced even if payment method is already filled, but only after counters are filled -->
										<div class="space-y-2">
											<Label for="is-invoiced" class="flex items-center gap-2">
												<input
													id="is-invoiced"
													type="checkbox"
													checked={isInvoiced}
													onchange={(e) => {
														isInvoiced = e.currentTarget.checked;
													}}
													class="h-4 w-4 rounded border-gray-300"
												/>
												<span>Pagamento Concluído</span>
											</Label>
											<p class="text-xs text-muted-foreground">Marque quando o cliente efetuar o pagamento</p>
										</div>
									{/if}

									<div class="flex justify-end gap-2 pt-4">
										<Button variant="outline" onclick={handleCancelEditBilling} disabled={isSaving || isUpdatingBilling}>
											<X class="w-4 h-4 mr-2" />
											Cancelar
										</Button>
										<Button onclick={handleSaveBilling} disabled={isSaving || isUpdatingBilling}>
											{#if isSaving || isUpdatingBilling}
												<Loader2 class="w-4 h-4 mr-2 animate-spin" />
											{:else}
												<Save class="w-4 h-4 mr-2" />
											{/if}
											Salvar Fechamento
										</Button>
									</div>
								</div>
							{:else}
								<!-- View Mode (read-only) -->
								<div class="space-y-4">
									{#if isFormEnabled && !isResponsable}
										<div class="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
											<div class="flex items-center gap-2">
												<User class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
												<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
													Você não é o responsável por esta etapa. Apenas o responsável pode editar as informações do fechamento.
												</p>
											</div>
										</div>
									{/if}
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p class="text-sm font-medium text-muted-foreground">Contador Anterior</p>
											<p class="text-sm">{step.billing.previous_counter ?? 'N/A'}</p>
										</div>
										<div>
											<p class="text-sm font-medium text-muted-foreground">Contador Atual</p>
											<p class="text-sm">{step.billing.current_counter ?? 'Não preenchido'}</p>
										</div>
									</div>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p class="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
											<p class="text-sm">{step.billing.payment_method ? getPaymentMethodLabel(step.billing.payment_method) : 'Não informado'}</p>
										</div>
										<div>
											<p class="text-sm font-medium text-muted-foreground">Pagamento Concluído</p>
											<p class="text-sm">{step.billing.is_invoiced ? 'Sim' : 'Não'}</p>
										</div>
									</div>
									<div>
										<p class="text-sm font-medium text-muted-foreground">Valor a Receber</p>
										<p class="text-sm font-semibold">{formatCurrency(step.billing.amount_to_receive)}</p>
									</div>
									{#if step.billing.copyMachine}
										<div>
											<p class="text-sm font-medium text-muted-foreground">Máquina</p>
											<p class="text-sm">
												{step.billing.copyMachine.catalogCopyMachine?.model ||
													step.billing.copyMachine.external_model ||
													step.billing.copyMachine.serial_number}
											</p>
										</div>
									{/if}
									{#if isFormEnabled && isResponsable}
										<div class="flex justify-end pt-4">
											<Button variant="outline" size="sm" onclick={handleEditBilling}>
												<Edit class="w-4 h-4 mr-2" />
												Editar
											</Button>
										</div>
									{/if}
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}

				<!-- Step Info -->
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>{step.name}</CardTitle>
								<CardDescription>{step.description}</CardDescription>
							</div>
							<Badge variant={getStatusBadgeVariant(step.status)}>
								{getStatusLabel(step.status)}
							</Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						{#if !isFormEnabled}
							<div class="bg-muted/50 border border-muted rounded-lg p-4">
								<p class="text-sm text-muted-foreground">
									{#if step.status === 'PENDING'}
										Para preencher este formulário, você precisa iniciar a etapa clicando no botão "Iniciar Etapa" ao lado.
									{:else if step.status === 'CONCLUDED'}
										Esta etapa já foi concluída e não pode mais ser editada.
									{:else if step.status === 'CANCELLED'}
										Esta etapa foi cancelada e não pode mais ser editada.
									{:else}
										O formulário está desabilitado.
									{/if}
								</p>
							</div>
						{/if}

						{#if isEditMode && isFormEnabled && isResponsable}
							<!-- Edit Mode: Form -->
							<!-- Observation -->
							<div class="space-y-2">
								<Label for="observation">Observação</Label>
								<textarea
									id="observation"
									placeholder="Adicione observações sobre esta etapa..."
									bind:value={observation}
									rows="4"
									disabled={!isFormEnabled || !isResponsable}
									class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<!-- Responsable Client -->
							<div class="space-y-2">
								<Label for="responsable-client">Responsável no Cliente</Label>
								<Input
									id="responsable-client"
									type="text"
									placeholder="Nome do responsável no local do cliente"
									bind:value={responsableClient}
									disabled={!isFormEnabled || !isResponsable}
								/>
							</div>

							<!-- Images Section -->
							<StepImagesUpload
								stepId={stepId}
								images={images}
								disabled={!isFormEnabled || !isResponsable}
								onImageUploaded={() => {
									queryClient.invalidateQueries({ queryKey: ['steps', stepId, 'images'] });
								}}
								onImageDeleted={() => {
									queryClient.invalidateQueries({ queryKey: ['steps', stepId, 'images'] });
								}}
								onImageClick={handleImageClick}
							/>

							<!-- Save and Cancel Buttons -->
							<div class="flex justify-end gap-2">
								<Button 
									variant="outline" 
									onclick={handleCancelEdit} 
									disabled={isSaving || isUpdating}
								>
									<X class="w-4 h-4 mr-2" />
									Cancelar
								</Button>
								<Button onclick={handleSave} disabled={!isFormEnabled || isSaving || isUpdating}>
									{#if isSaving || isUpdating}
										<Loader2 class="w-4 h-4 mr-2 animate-spin" />
									{:else}
										<Save class="w-4 h-4 mr-2" />
									{/if}
									Salvar Alterações
								</Button>
							</div>
						{:else if isFormEnabled}
							<!-- Preview Mode: Read-only display -->
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<h3 class="text-lg font-semibold">Informações da Etapa</h3>
									{#if isResponsable}
										<Button variant="outline" size="sm" onclick={handleEdit}>
											<Edit class="w-4 h-4 mr-2" />
											Editar
										</Button>
									{/if}
								</div>
								{#if !isResponsable}
									<div class="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
										<div class="flex items-center gap-2">
											<User class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
											<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
												Você não é o responsável por esta etapa. Apenas o responsável pode editar as informações.
											</p>
										</div>
									</div>
								{/if}

								<!-- Observation Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Observação</Label>
									<div class="min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
										{#if observation}
											{observation}
										{:else}
											<span class="text-muted-foreground italic">Nenhuma observação adicionada</span>
										{/if}
									</div>
								</div>

								<!-- Responsable Client Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Responsável no Cliente</Label>
									<div class="min-h-[40px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
										{#if responsableClient}
											{responsableClient}
										{:else}
											<span class="text-muted-foreground italic">Não informado</span>
										{/if}
									</div>
								</div>

								<!-- Images Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Imagens</Label>
									{#if images && images.length > 0}
										<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
											{#each images as image (image.id)}
												<div 
													class="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
													onclick={() => handleImageClick(image)}
												>
													<img
														src={image.path.startsWith('http') ? image.path : `${env.API_URL}${image.path}`}
														alt="Imagem da etapa"
														class="w-full h-full object-cover"
													/>
												</div>
											{/each}
										</div>
									{:else}
										<div class="border-2 border-dashed rounded-lg p-8 text-center">
											<ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
											<p class="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<!-- View Mode for non-editable steps -->
							<!-- Observation -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Observação</Label>
								<div class="min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
									{#if observation}
										{observation}
									{:else}
										<span class="text-muted-foreground italic">Nenhuma observação adicionada</span>
									{/if}
								</div>
							</div>

							<!-- Responsable Client -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Responsável no Cliente</Label>
								<div class="min-h-[40px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
									{#if responsableClient}
										{responsableClient}
									{:else}
										<span class="text-muted-foreground italic">Não informado</span>
									{/if}
								</div>
							</div>

							<!-- Images -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Imagens</Label>
								{#if images && images.length > 0}
									<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{#each images as image (image.id)}
											<div 
												class="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
												onclick={() => handleImageClick(image)}
											>
													<img
														src={image.path.startsWith('http') ? image.path : `${env.API_URL}${image.path}`}
														alt="Imagem da etapa"
														class="w-full h-full object-cover"
													/>
											</div>
										{/each}
									</div>
								{:else}
									<div class="border-2 border-dashed rounded-lg p-8 text-center">
										<ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
										<p class="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
									</div>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Cancel Reason (if cancelled) -->
				{#if step.status === 'CANCELLED' && step.reason_cancellament}
					<Card>
						<CardHeader>
							<CardTitle>Motivo do Cancelamento</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-sm">{step.reason_cancellament}</p>
						</CardContent>
					</Card>
				{/if}

			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Step Details -->
				<Card>
					<CardHeader>
						<CardTitle>Informações</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Serviço</p>
							<div class="text-sm flex items-center gap-2 flex-wrap">
								{#if step.service}
									<span>Serviço #{step.service.id}</span>
									{#if step?.service_id}
										<button
											onclick={() => goToService()}
											class="text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium"
										>
											<ExternalLink class="w-3 h-3" />
											Ver Serviço
										</button>
									{/if}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</div>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Cliente</p>
							<div class="text-sm flex items-center gap-2 flex-wrap">
								{#if step.service?.client}
									<span>{step.service.client.name}</span>
									{#if step?.service?.client_id || step?.service?.client?.id}
										<button
											onclick={() => goToClient()}
											class="text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium"
										>
											<User class="w-3 h-3" />
											Ver Cliente
										</button>
									{/if}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</div>
						</div>
						<div>
							<div class="flex items-center justify-between mb-1">
								<p class="text-sm font-medium text-muted-foreground">Responsável</p>
								{#if userCanManageServices}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
												<MoreVertical class="w-4 h-4" />
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item onclick={openEditResponsableDialog}>
												<Edit class="w-4 h-4 mr-2" />
												Editar Responsável
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}
							</div>
							<div class="text-sm">
								{#if step.responsable}
									<div class="flex items-center gap-2">
										<User class="w-4 h-4 text-muted-foreground" />
										<span>{step.responsable.name}</span>
										{#if step.responsable.email}
											<span class="text-xs text-muted-foreground">({step.responsable.email})</span>
										{/if}
									</div>
								{:else}
									<span class="text-muted-foreground">Não atribuído</span>
								{/if}
							</div>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Início</p>
							<p class="text-sm">
								{#if step.datetime_start}
									{formatDate(step.datetime_start)}
								{:else}
									<span class="text-muted-foreground">Não iniciado</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
							<p class="text-sm">
								{#if step.datetime_conclusion}
									{formatDate(step.datetime_conclusion)}
								{:else}
									<span class="text-muted-foreground">Não concluído</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Expiração</p>
							<p class="text-sm">
								{#if step.datetime_expiration}
									{formatDate(step.datetime_expiration)}
								{:else}
									<span class="text-muted-foreground">Sem expiração</span>
								{/if}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>

<!-- Image Preview Dialog -->
<Dialog.Root bind:open={showImagePreview}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] p-0">
		{#if selectedImage}
			<div class="relative w-full h-full">
				<img
					src={selectedImage.path.startsWith('http') ? selectedImage.path : `${env.API_URL}${selectedImage.path}`}
					alt="Preview da imagem"
					class="w-full h-auto max-h-[85vh] object-contain"
				/>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<ConfirmationDialog
	bind:open={showCancelDialog}
	title="Cancelar Etapa"
	description="Tem certeza que deseja cancelar esta etapa? Esta ação requer um motivo."
	confirmText="Cancelar Etapa"
	cancelText="Voltar"
	variant="destructive"
	icon="warning"
	loading={isCancelling}
	onConfirm={handleCancel}
	onCancel={closeCancelDialog}
>
	<div class="space-y-2 mt-4">
		<Label for="cancel-reason">Motivo do Cancelamento *</Label>
		<textarea
			id="cancel-reason"
			placeholder="Informe o motivo do cancelamento..."
			bind:value={cancelReason}
			rows="3"
			required
			class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
	</div>
</ConfirmationDialog>

<!-- Edit Responsable Dialog -->
<Dialog.Root bind:open={showEditResponsableDialog}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Editar Responsável da Etapa</Dialog.Title>
			<Dialog.Description>
				Selecione um novo responsável para esta etapa. Apenas administradores e gerentes podem alterar o responsável.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="responsable-select">Responsável</Label>
				<Select
					type="single"
					value={selectedResponsableId?.toString() || ''}
					onValueChange={(value: string) => {
						selectedResponsableId = value ? parseInt(value) : null;
					}}
				>
					<SelectTrigger id="responsable-select">
						{#if selectedResponsableId}
							{users.find((u) => u.id === selectedResponsableId)?.name || 'Selecione um responsável'}
						{:else}
							<span class="text-muted-foreground">Selecione um responsável</span>
						{/if}
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
							{#each users as userItem (userItem.id)}
								<SelectItem value={userItem.id.toString()}>
									{userItem.name} {userItem.email ? `(${userItem.email})` : ''}
								</SelectItem>
							{/each}
						{/if}
					</SelectContent>
				</Select>
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={closeEditResponsableDialog}
				disabled={isUpdating}
			>
				Cancelar
			</Button>
			<Button
				type="button"
				onclick={handleUpdateResponsable}
				disabled={isUpdating}
			>
				{#if isUpdating}
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
				{/if}
				Salvar
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

