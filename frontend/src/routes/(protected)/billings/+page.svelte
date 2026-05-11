<script lang="ts">
	import { useBillings, useGenerateBillingsByCity, useDeleteBilling, useBillingJobStatus } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { formatDate, formatCurrency, getPaymentMethodLabel, getBillingStatusLabel } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ClientAsyncSelect from '$lib/components/client-async-select.svelte';
	import type { Billing } from '$lib/api/types/billing.types.js';
	import type { BillingQueryParams } from '$lib/api/types/billing.types.js';
	import type { City } from '$lib/api/types/address.types.js';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import { errorToast, successToast, showError, showInfo } from '$lib/utils/toast.js';
	import { MoreVertical, Edit, Trash2 } from 'lucide-svelte';
	import { PAGINATION } from '$lib/utils/constants.js';
	import { goto } from '$app/navigation';
	import CityBillingDialog from '$lib/components/city-billing-dialog.svelte';
	import BillingResponsablesDialog from '$lib/components/billing-responsables-dialog.svelte';
	import BillingEditDialog from '$lib/components/billing-edit-dialog.svelte';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';

	let billingFilters = $state<BillingQueryParams>({ page: 1, limit: PAGINATION.DEFAULT_PAGE_SIZE });
	const billingsQuery = useBillings(() => billingFilters);
	const billingsResponse = $derived(billingsQuery.data);
	const billings = $derived(billingsResponse?.data ?? []);
	const totalBillings = $derived(billingsResponse?.total ?? 0);
	const totalPages = $derived(billingsResponse?.totalPages ?? 1);
	const currentPage = $derived(billingFilters.page ?? 1);
	const pageSize = $derived(billingFilters.limit ?? PAGINATION.DEFAULT_PAGE_SIZE);
	const isLoadingBillings = $derived(billingsQuery.isLoading);

	const clientsQuery = useClients();
	const clients = $derived(clientsQuery.data ?? []);

	const cityOptions = $derived(
		(() => {
			const map = new Map<number, { city: City; label: string }>();

			clients.forEach((client) => {
				const city = client.address?.neighborhood?.city;
				if (city) {
					const stateCode = city.state?.code ? ` - ${city.state.code}` : '';
					const label = `${city.name}${stateCode}`;
					if (!map.has(city.id)) {
						map.set(city.id, { city, label });
					}
				}
			});

			return Array.from(map.values())
				.sort((a, b) => a.label.localeCompare(b.label))
				.map(({ city, label }) => ({ id: city.id, label }));
		})()
	);

	// Client list is loaded async by ClientAsyncSelect (searchable).

	const selectedCityFilter = $derived(billingFilters.cityId?.toString() || '');
	const selectedClientFilter = $derived(billingFilters.clientId?.toString() || '');
	const selectedPaymentMethodFilter = $derived(billingFilters.paymentMethod ?? '');
	const selectedSortBy = $derived(billingFilters.sortBy ?? 'date');
	const selectedSortOrder = $derived(billingFilters.sortOrder ?? 'desc');
	const sortOptionValue = $derived(`${selectedSortBy}:${selectedSortOrder}`);


	function updateFilters(newFilters: Partial<BillingQueryParams>, options: { resetPage?: boolean } = {}) {
		const { resetPage = false } = options;
		billingFilters = {
			...billingFilters,
			...newFilters,
			page: resetPage ? 1 : (newFilters.page ?? billingFilters.page ?? 1),
		};
	}

	function handlePageChange(page: number) {
		const maxPage = totalPages;
		if (page < 1 || page > maxPage) return;
		updateFilters({ page }, { resetPage: false });
	}

	function nextPage() {
		handlePageChange(currentPage + 1);
	}

	function previousPage() {
		handlePageChange(currentPage - 1);
	}

	function handlePageSizeChange(size: number) {
		updateFilters({ limit: size, page: 1 }, { resetPage: false });
	}

	function handleViewBilling(id: number) {
		goto(`/billings/${id}`);
	}

	// Generate billings state and handlers
	let showCityBillingDialog = $state(false);
	let showConfirmationDialog = $state(false);
	let showResponsablesDialog = $state(false);
	let selectedCityId = $state<number | null>(null);
	const generateBillingsMutation = useGenerateBillingsByCity();
	const isGeneratingBillings = $derived(generateBillingsMutation.isPending);
	const deleteBillingMutation = useDeleteBilling();
	let createdBillingIds = $state<number[]>([]);
	let currentJobId = $state<string | null>(null);
	let isJobWaitingForCompletion = $state(false);

	// Job status query - only active when there's a jobId
	const jobStatusQuery = useBillingJobStatus(() => currentJobId ?? undefined);
	const jobStatus = $derived(jobStatusQuery.data);
	const isJobWaiting = $derived(jobStatus?.state === 'waiting');
	const isJobActive = $derived(jobStatus?.state === 'active');
	const isJobQueued = $derived(jobStatus?.state === 'queued');
	const isJobDelayed = $derived(jobStatus?.state === 'delayed');
	const isJobRunning = $derived(isJobWaitingForCompletion || isJobWaiting || isJobActive || isJobQueued || isJobDelayed);
	const isJobCompleted = $derived(jobStatus?.state === 'completed');
	const isJobFailed = $derived(jobStatus?.state === 'failed');

	// Handle job completion
	$effect(() => {
		if (isJobCompleted && jobStatus) {
			successToast.created('Fechamentos gerados com sucesso');
			showResponsablesDialog = false;
			selectedCityId = null;
			currentJobId = null;
			isJobWaitingForCompletion = false;
			// Refresh billing list
			billingsQuery.refetch();
		}
	});

	// Handle job failure
	$effect(() => {
		if (isJobFailed && jobStatus) {
			const errorMessage = jobStatus.error || 'Erro ao gerar fechamentos';
			showError(errorMessage);
			// Stop loading and re-enable the button
			currentJobId = null;
			isJobWaitingForCompletion = false;
		}
	});

	function handleCitySelected(cityId: number) {
		selectedCityId = cityId;
		showCityBillingDialog = false;
		showConfirmationDialog = true;
	}

	function handleConfirmGeneration() {
		// Clear created billing IDs when starting a new generation
		createdBillingIds = [];
		showConfirmationDialog = false;
		showResponsablesDialog = true;
	}

	function handleCancelConfirmation() {
		showConfirmationDialog = false;
		selectedCityId = null;
	}

	function handleResponsablesSelected(machines: any[]) {
		if (!selectedCityId) return;

		currentJobId = null;
		isJobWaitingForCompletion = true;
		generateBillingsMutation.mutate(
			{
				cityId: selectedCityId,
				machines,
			},
			{
				onSuccess: (response) => {
					// Store job ID for status polling
					currentJobId = response.jobId;
					// Close dialog immediately after job is enqueued
					showResponsablesDialog = false;
					// Show info message that generation was started
					showInfo('Geração de fechamentos iniciada.');
				},
				onError: (error: any) => {
					console.error('Error generating fechamentos:', error);
					// Re-enable button on immediate error (not job failure, which is handled by effect)
					isJobWaitingForCompletion = false;
					if (error.response?.data?.message) {
						showError(error.response.data.message);
					} else {
						errorToast.unknown();
					}
				},
			}
		);
	}

	async function handleCancelBilling() {
		// If billings were created, delete them
		if (createdBillingIds.length > 0) {
			try {
				// Delete all created billings
				await Promise.all(
					createdBillingIds.map((billingId) => 
						deleteBillingMutation.mutateAsync(billingId).catch((err) => {
							console.error(`Error deleting billing ${billingId}:`, err);
						})
					)
				);
				successToast.deleted('Fechamentos criados');
			} catch (error) {
				console.error('Error deleting billings:', error);
			}
		}
		
		// Clear created billing IDs
		createdBillingIds = [];
		
		// Close dialogs
		showCityBillingDialog = false;
		showConfirmationDialog = false;
		showResponsablesDialog = false;
		selectedCityId = null;
	}
	
	// Clear created billing IDs when dialog closes successfully
	$effect(() => {
		if (!showResponsablesDialog && createdBillingIds.length > 0) {
			// Dialog closed, clear IDs after a short delay to allow cancellation if needed
			setTimeout(() => {
				createdBillingIds = [];
			}, 500);
		}
	});

	// Delete billing state and handlers
	let billingToDelete = $state<Billing | null>(null);
	let showDeleteConfirmation = $state(false);

	// Edit billing state
	let editingBilling = $state<Billing | null>(null);
	let showEditDialog = $state(false);

	function handleEditClick(billing: Billing, event: Event) {
		event.stopPropagation();
		editingBilling = billing;
		showEditDialog = true;
	}

	function handleDeleteClick(billing: Billing) {
		billingToDelete = billing;
		showDeleteConfirmation = true;
	}

	function handleConfirmDelete() {
		if (!billingToDelete) return;

		deleteBillingMutation.mutate(
			billingToDelete.id,
			{
				onSuccess: () => {
					successToast.deleted('Fechamento');
					billingToDelete = null;
					showDeleteConfirmation = false;
				},
				onError: (error: any) => {
					console.error('Error deleting billing:', error);
					if (error.response?.data?.message) {
						showError(error.response.data.message);
					} else {
						errorToast.delete('Fechamento');
					}
					billingToDelete = null;
					showDeleteConfirmation = false;
				},
			}
		);
	}

	function handleCancelDelete() {
		billingToDelete = null;
		showDeleteConfirmation = false;
	}

	const pageSizeOptions = [10, 25, 50, 100];
</script>

<svelte:head>
	<title>Fechamentos - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">Fechamentos</h1>
			<p class="text-muted-foreground">Gerencie os fechamentos de franquia</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={() => showCityBillingDialog = true} class="md:w-auto" disabled={isJobRunning}>
				{#if isJobRunning}
					Aguarde...
				{:else}
					Gerar Fechamento
				{/if}
			</Button>
		</div>
	</div>

	<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
		<div class="w-full sm:w-[200px]">
			<Select
				type="single"
				value={selectedCityFilter}
				onValueChange={(value: string) => {
					updateFilters({ cityId: value ? parseInt(value) : undefined }, { resetPage: true });
				}}
			>
				<SelectTrigger class="w-full">
					<span class="block text-left text-sm">
						{selectedCityFilter
							? cityOptions.find((opt) => opt.id.toString() === selectedCityFilter)?.label
							: 'Todas as cidades'}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">Todas as cidades</SelectItem>
					{#each cityOptions as option (option.id)}
						<SelectItem value={option.id.toString()}>{option.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>
		<div class="w-full sm:w-[260px]">
			<ClientAsyncSelect
				value={billingFilters.clientId ?? 0}
				onValueChange={(clientId) => updateFilters({ clientId: clientId || undefined }, { resetPage: true })}
				label=""
				placeholder="Todos os clientes"
				class="w-full"
			/>
		</div>
		<div class="w-full sm:w-[200px]">
			<Select
				type="single"
				value={selectedPaymentMethodFilter}
				onValueChange={(value: string) => {
					updateFilters({ paymentMethod: value || undefined }, { resetPage: true });
				}}
			>
				<SelectTrigger class="w-full">
					<span class="block text-left text-sm">
						{selectedPaymentMethodFilter ? selectedPaymentMethodFilter : 'Todas as formas'}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">Todas as formas</SelectItem>
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
		<div class="w-full sm:w-[220px]">
			<Select
				type="single"
				value={sortOptionValue}
				onValueChange={(value: string) => {
					const [sortBy, sortOrder] = value.split(':');
					updateFilters(
						{ sortBy: sortBy || 'date', sortOrder: (sortOrder as 'asc' | 'desc') || 'desc' },
						{ resetPage: true },
					);
				}}
			>
				<SelectTrigger class="w-full">
					<span class="block text-left text-sm">
						{sortOptionValue === 'date:desc'
							? 'Data (mais recentes)'
							: sortOptionValue === 'date:asc'
								? 'Data (mais antigos)'
								: sortOptionValue === 'payment_method:asc'
									? 'Forma de pagamento (A → Z)'
									: sortOptionValue === 'payment_method:desc'
										? 'Forma de pagamento (Z → A)'
										: 'Ordenação'}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="date:desc">Data (mais recentes)</SelectItem>
					<SelectItem value="date:asc">Data (mais antigos)</SelectItem>
					<SelectItem value="payment_method:asc">Forma de pagamento (A → Z)</SelectItem>
					<SelectItem value="payment_method:desc">Forma de pagamento (Z → A)</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Lista de Fechamentos</CardTitle>
		</CardHeader>
		<CardContent>
			{#if isLoadingBillings}
				<div class="space-y-3">
					{#each Array(5) as _}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			{:else if !billings?.length}
				<div class="text-center py-12">
					<div class="text-muted-foreground">
						<p class="text-lg font-medium">Nenhum fechamento encontrado</p>
						<p class="text-sm">Ajuste os filtros ou crie novos fechamentos.</p>
					</div>
				</div>
			{:else}
				<!-- Mobile cards -->
				<div class="md:hidden space-y-3">
					{#each billings as billing (billing.id)}
						<div
							class="bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
							onclick={() => handleViewBilling(billing.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleViewBilling(billing.id);
								}
							}}
						>
							<div class="p-4 pb-3 border-b">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-base leading-tight">{billing.client?.name || '-'}</h3>
										<p class="text-xs text-muted-foreground mt-1">
											{billing.client?.address?.neighborhood?.city?.name || '-'} · {formatDate(billing.date)}
										</p>
									</div>
									{#if billing.isInvoiced}
										<Badge variant="default" class="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 shrink-0">
											Pago
										</Badge>
									{:else}
										<span class="text-muted-foreground text-xs shrink-0">Pendente</span>
									{/if}
								</div>
							</div>
							<div class="p-4 space-y-2">
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Máquina</span>
									<span class="font-medium">
										{billing.copyMachine?.catalogCopyMachine?.model ||
											billing.copyMachine?.externalModel ||
											billing.copyMachine?.serialNumber ||
											'-'}
									</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Contador</span>
									<span class="font-mono text-sm">
										{billing.previousCounter ?? '-'} → {billing.currentCounter ?? '-'}
									</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Valor</span>
									<span class="font-medium">{formatCurrency(billing.amountToReceive)}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Pagamento</span>
									<span class="text-muted-foreground">
										{billing.paymentMethod ? getPaymentMethodLabel(billing.paymentMethod) : '-'}
									</span>
								</div>
							</div>
							<div class="p-3 border-t bg-muted/20 flex justify-end" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild>
										<Button variant="ghost" size="sm" class="h-8 w-8 p-0">
											<MoreVertical class="h-4 w-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onclick={(e) => { e.stopPropagation(); handleEditClick(billing, e); }}>
											<Edit class="w-4 h-4 mr-2" />
											Editar
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item class="text-red-600 cursor-pointer" onclick={(e) => { e.stopPropagation(); handleDeleteClick(billing); }}>
											<Trash2 class="w-4 h-4 mr-2" />
											Excluir
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
					{/each}
				</div>

				<!-- Desktop table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left p-3 font-medium">Cliente</th>
								<th class="text-left p-3 font-medium">Cidade</th>
								<th class="text-left p-3 font-medium">Data</th>
								<th class="text-left p-3 font-medium">Máquina</th>
								<th class="text-center p-3 font-medium">Contador Anterior</th>
								<th class="text-center p-3 font-medium">Contador Atual</th>
								<th class="text-right p-3 font-medium">Valor</th>
								<th class="text-left p-3 font-medium">Pagamento</th>
								<th class="text-center p-3 font-medium">Status</th>
								<th class="text-right p-3 font-medium w-12">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each billings as billing}
								<tr 
									class="border-b hover:bg-gray-50 cursor-pointer"
									onclick={() => handleViewBilling(billing.id)}
									role="button"
									tabindex="0"
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleViewBilling(billing.id);
										}
									}}
								>
									<td class="p-3 font-medium text-foreground">{billing.client?.name || '-'}</td>
									<td class="p-3 text-muted-foreground">
										{billing.client?.address?.neighborhood?.city?.name || '-'}
									</td>
									<td class="p-3 text-muted-foreground">{formatDate(billing.date)}</td>
									<td class="p-3 text-muted-foreground">
										{billing.copyMachine?.catalogCopyMachine?.model ||
											billing.copyMachine?.externalModel ||
											billing.copyMachine?.serialNumber ||
											'-'}
									</td>
									<td class="p-3 text-center font-mono text-sm">{billing.previousCounter ?? '-'}</td>
									<td class="p-3 text-center font-mono text-sm">{billing.currentCounter ?? '-'}</td>
									<td class="p-3 text-right font-medium">{formatCurrency(billing.amountToReceive)}</td>
									<td class="p-3 text-muted-foreground">{billing.paymentMethod ? getPaymentMethodLabel(billing.paymentMethod) : '-'}</td>
									<td class="p-3 text-center">
										{#if billing.isInvoiced}
											<Badge variant="default" class="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
												Pago
											</Badge>
										{:else}
											<span class="text-muted-foreground text-sm">Pendente</span>
										{/if}
									</td>
									<td class="p-3" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger asChild>
												<Button variant="ghost" size="sm" class="h-8 w-8 p-0 hover:bg-transparent">
													<span class="sr-only">Abrir menu</span>
													<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
													</svg>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												<DropdownMenu.Item onclick={(e) => handleEditClick(billing, e)}>
													<Edit class="w-4 h-4 mr-2" />
													Editar
												</DropdownMenu.Item>
												<DropdownMenu.Separator />
												<DropdownMenu.Item class="text-red-600 cursor-pointer" onclick={() => handleDeleteClick(billing)}>
													Excluir
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if totalBillings > 0}
					<PaginationControls
						page={currentPage}
						totalPages={totalPages}
						totalItems={totalBillings}
						pageSize={pageSize}
						label="fechamentos"
						onPrevious={() => previousPage()}
						onNext={() => nextPage()}
						onSelectPage={(page) => handlePageChange(page)}
						pageSizeOptions={pageSizeOptions}
						onPageSizeChange={(size) => handlePageSizeChange(size)}
					/>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

<CityBillingDialog
	bind:open={showCityBillingDialog}
	onConfirm={handleCitySelected}
	onCancel={handleCancelBilling}
/>

<ConfirmationDialog
	bind:open={showConfirmationDialog}
	title="Confirmar Geração de Fechamentos"
	description="Esta ação irá criar novos serviços e fechamentos para todos os clientes da cidade selecionada que possuem máquinas RENT. Deseja continuar?"
	confirmText="Continuar"
	cancelText="Cancelar"
	variant="info"
	icon="info"
	loading={false}
	onConfirm={handleConfirmGeneration}
	onCancel={handleCancelConfirmation}
/>

<BillingResponsablesDialog
	bind:open={showResponsablesDialog}
	cityId={selectedCityId || 0}
	loading={isGeneratingBillings}
	onConfirm={handleResponsablesSelected}
	onCancel={handleCancelBilling}
/>

<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Fechamento"
	description={`Tem certeza que deseja excluir o fechamento de ${billingToDelete?.client?.name || 'cliente'}? Esta ação não pode ser desfeita.`}
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="warning"
	loading={deleteBillingMutation.isPending}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>

<BillingEditDialog
	bind:open={showEditDialog}
	billing={editingBilling!}
	onSuccess={() => {
		billingsQuery.refetch();
	}}
/>
