<script lang="ts">
	import { useBillings } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import type { Billing } from '$lib/api/types/billing.types.js';
	import type { BillingQueryParams } from '$lib/api/types/billing.types.js';
	import type { City } from '$lib/api/types/address.types.js';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { PAGINATION } from '$lib/utils/constants.js';
	import { goto } from '$app/navigation';

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

	const clientOptions = $derived(
		clients
			.filter((c) => c.active)
			.map((c) => ({ id: c.id, name: c.name }))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	const selectedCityFilter = $derived(billingFilters.city_id?.toString() || '');
	const selectedClientFilter = $derived(billingFilters.client_id?.toString() || '');


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


	const pageSizeOptions = [10, 25, 50, 100];
</script>

<svelte:head>
	<title>Fechamentos - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Fechamentos</h1>
			<p class="text-muted-foreground">Gerencie os fechamentos de franquia</p>
		</div>
	</div>

	<div class="flex items-center gap-4">
		<div class="w-[200px]">
			<Select
				type="single"
				value={selectedCityFilter}
				onValueChange={(value: string) => {
					updateFilters({ city_id: value ? parseInt(value) : undefined }, { resetPage: true });
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
		<div class="w-[200px]">
			<Select
				type="single"
				value={selectedClientFilter}
				onValueChange={(value: string) => {
					updateFilters({ client_id: value ? parseInt(value) : undefined }, { resetPage: true });
				}}
			>
				<SelectTrigger>
					<span class="block text-left text-sm">
						{selectedClientFilter
							? clientOptions.find((opt) => opt.id.toString() === selectedClientFilter)?.name
							: 'Todos os clientes'}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">Todos os clientes</SelectItem>
					{#each clientOptions as option (option.id)}
						<SelectItem value={option.id.toString()}>{option.name}</SelectItem>
					{/each}
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

