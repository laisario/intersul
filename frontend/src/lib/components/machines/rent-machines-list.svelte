<script lang="ts">
	import { useRentMachines } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Printer } from 'lucide-svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import type { ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';

	let currentPage = $state(1);
	let pageSize = $state(10);
	const pageSizeOptions = [10, 25, 50, 100];

	const query = $derived(useRentMachines(undefined, currentPage, pageSize));
	const machines = $derived(query.data?.data || []);
	const isLoading = $derived(query.isLoading);
	const totalItems = $derived(query.data?.total || 0);
	const totalPages = $derived(query.data?.totalPages || 0);

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage = currentPage + 1;
		}
	}

	function previousPage() {
		if (currentPage > 1) {
			currentPage = currentPage - 1;
		}
	}

	function handlePageSizeChange(size: number) {
		if (pageSize === size) return;
		pageSize = size;
		currentPage = 1;
	}
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="space-y-4">
			{#each Array(5) as _}
				<Card>
					<CardContent class="p-4">
						<Skeleton class="h-16 w-full" />
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if machines.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Printer class="w-5 h-5" />
					Máquinas Alugadas
				</CardTitle>
				<CardDescription>
					Visualização de máquinas alugadas (RENT)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Modelo</TableHead>
							<TableHead>Fabricante</TableHead>
							<TableHead>Nº Série</TableHead>
							<TableHead>Cliente</TableHead>
							<TableHead>Data de Cadastro</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each machines as machine}
							<TableRow>
								<TableCell class="font-medium">
									{machine?.external_model || machine?.catalogCopyMachine?.model || '-'}
								</TableCell>
								<TableCell>
									{machine?.external_manufacturer || machine?.catalogCopyMachine?.manufacturer || '-'}
								</TableCell>
								<TableCell>{machine?.serial_number}</TableCell>
								<TableCell>{machine?.client?.name || '-'}</TableCell>
								<TableCell>{formatDate((machine as any).created_at || machine.createdAt || null)}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				{#if totalItems > 0}
					<div class="mt-4">
						<PaginationControls
							page={currentPage}
							totalPages={totalPages}
							totalItems={totalItems}
							pageSize={pageSize}
							label="máquinas"
							onPrevious={() => previousPage()}
							onNext={() => nextPage()}
							onSelectPage={(page) => goToPage(page)}
							pageSizeOptions={pageSizeOptions}
							onPageSizeChange={(size) => handlePageSizeChange(size)}
						/>
					</div>
				{/if}
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="py-12 text-center">
				<Printer class="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
				<p class="text-lg font-medium text-muted-foreground">Nenhuma máquina alugada encontrada</p>
			</CardContent>
		</Card>
	{/if}
</div>

