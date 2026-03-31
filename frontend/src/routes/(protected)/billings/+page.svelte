<script lang="ts">
	import { useBillings, useGenerateBillingsByCity, useDeleteBilling } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { formatDate, formatCurrency, getPaymentMethodLabel } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import ClientAsyncSelect from '$lib/components/client-async-select.svelte';
	import type { Billing } from '$lib/api/types/billing.types.js';
	import type { BillingQueryParams } from '$lib/api/types/billing.types.js';
	import type { City } from '$lib/api/types/address.types.js';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { PAGINATION } from '$lib/utils/constants.js';
	import { goto } from '$app/navigation';
	import CityBillingDialog from '$lib/components/city-billing-dialog.svelte';
	import BillingResponsablesDialog from '$lib/components/billing-responsables-dialog.svelte';
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

		generateBillingsMutation.mutate(
			{
				cityId: selectedCityId,
				machines,
			},
			{
				onSuccess: (response) => {
					// Store created billing IDs
					createdBillingIds = response.billings.map((billing) => billing.id);
					successToast.created('Fechamentos gerados com sucesso');
					showResponsablesDialog = false;
					selectedCityId = null;
					// Keep IDs in case user needs to cancel - will be cleared when dialog actually closes
				},
				onError: (error: any) => {
					console.error('Error generating fechamentos:', error);
					if (error.response?.data?.message) {
						showError(error.response.data.message);
					} else {
						errorToast.unknown();
					}
					// Clear created billing IDs on error
					createdBillingIds = [];
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
			<Button variant="outline" onclick={() => showCityBillingDialog = true} class="md:w-auto">
				Gerar Fechamento
			</Button>
		</div>
	</div>

	<div class="flex items-center gap-4">
		<div class="w-[200px]">
			<Select
				type="single"
				value={selectedCityFilter}
				onValueChange={(value: string) => {
					updateFilters({ cityId: value ? parseInt(value) : undefined }, { resetPage: true });
				}}
			>
				<SelectTrigger>
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
		<div class="w-[260px]">
			<ClientAsyncSelect
				value={billingFilters.clientId ?? 0}
				onValueChange={(clientId) => updateFilters({ clientId: clientId || undefined }, { resetPage: true })}
				label=""
				placeholder="Todos os clientes"
			/>
		</div>
		<div class="w-[200px]">
			<Select
				type="single"
				value={selectedPaymentMethodFilter}
				onValueChange={(value: string) => {
					updateFilters({ paymentMethod: value || undefined }, { resetPage: true });
				}}
			>
				<SelectTrigger>
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
		<div class="w-[220px]">
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
				<SelectTrigger>
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
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left p-3 font-medium">Data</th>
								<th class="text-left p-3 font-medium">Cliente</th>
								<th class="text-left p-3 font-medium">Cidade</th>
								<th class="text-left p-3 font-medium">Máquina</th>
								<th class="text-left p-3 font-medium">Contador Anterior</th>
								<th class="text-left p-3 font-medium">Contador Atual</th>
								<th class="text-left p-3 font-medium">Valor a Receber</th>
								<th class="text-left p-3 font-medium">Forma de Pagamento</th>
								<th class="text-left p-3 font-medium">Pagamento Concluído</th>
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
									<td class="p-3">{formatDate(billing.date)}</td>
									<td class="p-3">{billing.client?.name || '-'}</td>
									<td class="p-3">
										{billing.client?.address?.neighborhood?.city?.name || '-'}
									</td>
									<td class="p-3">
										{billing.copyMachine?.catalogCopyMachine?.model ||
											billing.copyMachine?.externalModel ||
											billing.copyMachine?.serialNumber ||
											'-'}
									</td>
									<td class="p-3">{billing.previousCounter ?? '-'}</td>
									<td class="p-3">{billing.currentCounter ?? '-'}</td>
									<td class="p-3">{formatCurrency(billing.amountToReceive)}</td>
									<td class="p-3">{billing.paymentMethod ? getPaymentMethodLabel(billing.paymentMethod) : '-'}</td>
									<td class="p-3">
										{billing.isInvoiced ? 'Sim' : 'Não'}
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
