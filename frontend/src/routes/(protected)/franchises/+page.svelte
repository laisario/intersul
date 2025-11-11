<script lang="ts">
import { useFranchises, useCreateFranchise, useUpdateFranchise, useDeleteFranchise } from '$lib/hooks/queries/use-franchises.svelte.js';
import { errorToast, successToast, showError } from '$lib/utils/toast.js';
import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
import { Skeleton } from '$lib/components/ui/skeleton/index.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-svelte';
import type { Franchise } from '$lib/api/types/copy-machine.types.js';
import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
import PaginationControls from '$lib/components/pagination-controls.svelte';

	let showFormModal = $state(false);
	let editingFranchise = $state<Franchise | null>(null);
	let isSubmitting = $state(false);
	
	// Confirmation dialog state
	let showDeleteConfirmation = $state(false);
	let franchiseToDelete = $state<{ id: number; period: string } | null>(null);

let formData = $state({
	period: '',
	paper_type: '',
	color: false,
	quantity: 0,
	unitPrice: ''
});

	const franchisesQuery = $derived(useFranchises());
	const createFranchiseMutation = useCreateFranchise();
	const updateFranchiseMutation = useUpdateFranchise();
	const deleteFranchiseMutation = useDeleteFranchise();
	
	let franchises = $derived(franchisesQuery.data || []);
	let franchisesLoading = $derived(franchisesQuery.isLoading);
	let franchisesError = $derived(franchisesQuery.error);
	let refetchFranchises = $derived(franchisesQuery.refetch);

let currentPage = $state(1);
let pageSize = $state(10);
const pageSizeOptions = [10, 25, 50, 100];

let totalItems = $derived(franchises.length);
let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
let paginatedFranchises = $derived(franchises.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize));

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

$effect(() => {
	franchises;
	const maxPage = Math.max(1, Math.ceil((franchises.length || 0) / pageSize));
	if (currentPage > maxPage) {
		currentPage = maxPage;
	}
});

	function openDeleteConfirmation(franchiseId: number, period: string) {
		franchiseToDelete = { id: franchiseId, period };
		showDeleteConfirmation = true;
	}

	async function handleDeleteFranchise() {
		if (!franchiseToDelete) return;

		try {
			await deleteFranchiseMutation.mutateAsync(franchiseToDelete.id);
			successToast.deleted(`Franquia ${franchiseToDelete.period}`);
			closeDeleteConfirmation();
		} catch (err: any) {
			console.error('Error deleting franchise:', err);
			if (err.response?.data?.message) {
				showError(err.response.data.message);
			} else if (err.message) {
				showError(err.message);
			} else {
				errorToast.unknown();
			}
		}
	}

	function closeDeleteConfirmation() {
		showDeleteConfirmation = false;
		franchiseToDelete = null;
	}

	function closeModal() {
		showFormModal = false;
		editingFranchise = null;
		resetForm();
	}

	function resetForm() {
		formData = {
			period: '',
			paper_type: '',
			color: false,
			quantity: 0,
		unitPrice: ''
		};
	}

	async function handleSubmit() {
		isSubmitting = true;
		
		try {
			if (!formData.period.trim()) {
				showError('Período é obrigatório');
				return;
			}
			if (!formData.paper_type.trim()) {
				showError('Tipo de papel é obrigatório');
				return;
			}
			if (!formData.quantity || formData.quantity <= 0) {
				showError('Quantidade deve ser maior que zero');
				return;
			}
			if (!formData.unitPrice || isNaN(parseFloat(formData.unitPrice)) || parseFloat(formData.unitPrice) <= 0) {
				showError('Preço unitário deve ser um número válido e maior que zero');
				return;
			}

			const payload = {
				period: formData.period.trim(),
				paper_type: formData.paper_type.trim(),
				color: formData.color,
				quantity: Number(formData.quantity),
				unitPrice: parseFloat(formData.unitPrice)
			};

			if (editingFranchise) {
				await updateFranchiseMutation.mutateAsync({ id: editingFranchise.id, data: payload });
				successToast.updated(`Franquia ${formData.period}`);
			} else {
				await createFranchiseMutation.mutateAsync(payload);
				successToast.created(`Franquia ${formData.period}`);
			}

			resetForm();
			closeModal();
		} catch (err: any) {
			console.error('Error saving franchise:', err);
			if (err.response?.data?.message) {
				showError(err.response.data.message);
			} else if (err.message) {
				showError(err.message);
			} else {
				errorToast.unknown();
			}
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenEditModal(franchise: Franchise) {
		editingFranchise = franchise;
		formData = {
			period: franchise.period,
			paper_type: franchise.paper_type,
			color: franchise.color,
			quantity: franchise.quantity,
		unitPrice: franchise.unitPrice.toString()
		};
		showFormModal = true;
	}
</script>

<svelte:head>
	<title>Franquias - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Franquias</h1>
			<p class="text-muted-foreground">Gerencie os planos de franquia</p>
		</div>
		<Button onclick={() => showFormModal = true}>
			<Plus class="w-4 h-4 mr-2" />
			Nova Franquia
		</Button>
	</div>

	<!-- Table -->
	<Card>
		<CardHeader>
			<CardTitle>Lista de Franquias</CardTitle>
		</CardHeader>
		<CardContent>
			{#if franchisesLoading}
				<div class="space-y-3">
					{#each Array(5) as _}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			{:else if franchisesError}
				<div class="text-center py-12">
					<div class="text-red-600">
						<p class="text-lg font-medium">Erro ao carregar franquias</p>
						<p class="text-sm">{franchisesError.message || 'Tente novamente mais tarde.'}</p>
						<Button onclick={() => refetchFranchises?.()} class="mt-4">
							Tentar novamente
						</Button>
					</div>
				</div>
			{:else if !franchises?.length}
				<div class="text-center py-12">
					<div class="text-muted-foreground">
						<p class="text-lg font-medium">Nenhuma franquia encontrada</p>
						<p class="text-sm">Comece adicionando um novo plano de franquia.</p>
					</div>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left p-3 font-medium">Período</th>
								<th class="text-left p-3 font-medium">Tipo de Papel</th>
								<th class="text-center p-3 font-medium">Colorida</th>
								<th class="text-right p-3 font-medium">Quantidade</th>
								<th class="text-right p-3 font-medium">Preço Unitário</th>
								<th class="text-right p-3 font-medium">Valor Total</th>
								<th class="text-center p-3 font-medium">Criado em</th>
								<th class="text-center p-3 font-medium">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each paginatedFranchises as franchise}
								<tr class="border-b hover:bg-gray-50">
									<td class="p-3">{franchise.period}</td>
									<td class="p-3">{franchise.paper_type}</td>
									<td class="p-3 text-center">
										{#if franchise.color}
											<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
												Sim
											</span>
										{:else}
											<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
												Não
											</span>
										{/if}
									</td>
									<td class="p-3 text-right">{franchise.quantity.toLocaleString()}</td>
									<td class="p-3 text-right">{formatCurrency(franchise.unitPrice)}</td>
									<td class="p-3 text-right font-medium">{formatCurrency(franchise.quantity * franchise.unitPrice)}</td>
									<td class="p-3 text-center text-sm text-gray-600">{formatDate(franchise.createdAt)}</td>
									<td class="p-3">
										<div class="flex items-center justify-center space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleOpenEditModal(franchise)}
											>
												<Edit class="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDeleteConfirmation(franchise.id, franchise.period)}
												class="text-red-600 hover:text-red-700"
											>
												<Trash2 class="w-4 h-4" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<PaginationControls
					page={currentPage}
					totalPages={totalPages}
					totalItems={totalItems}
					pageSize={pageSize}
					label="franquias"
					pageSizeOptions={pageSizeOptions}
					onPrevious={() => previousPage()}
					onNext={() => nextPage()}
					onSelectPage={(page) => goToPage(page)}
					onPageSizeChange={(size) => handlePageSizeChange(size)}
				/>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Form Modal -->
<Sheet bind:open={showFormModal}>
	<SheetContent class="sm:max-w-[500px]">
		<SheetHeader>
			<SheetTitle>{editingFranchise ? 'Editar Franquia' : 'Nova Franquia'}</SheetTitle>
			<SheetDescription>
				{editingFranchise ? 'Atualize as informações da franquia.' : 'Adicione um novo plano de franquia.'}
			</SheetDescription>
		</SheetHeader>
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 mt-6 px-6">
			<div class="space-y-2">
				<Label for="period">Período *</Label>
				<Input
					id="period"
					bind:value={formData.period}
					placeholder="Ex: 12 meses"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="paper_type">Tipo de Papel *</Label>
				<Input
					id="paper_type"
					bind:value={formData.paper_type}
					placeholder="Ex: A4, Carta"
					required
				/>
			</div>

			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="color"
					bind:checked={formData.color}
					class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<Label for="color" class="cursor-pointer">Impressão Colorida</Label>
			</div>

			<div class="space-y-2">
				<Label for="quantity">Quantidade *</Label>
				<Input
					id="quantity"
					type="number"
					min="1"
					bind:value={formData.quantity}
					placeholder="Ex: 1000"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="unit_price">Preço Unitário *</Label>
				<Input
					id="unit_price"
					type="number"
					step="0.0001"
					min="0"
					bind:value={formData.unitPrice}
					placeholder="Ex: 0.05"
					required
				/>
			</div>

			<div class="flex justify-end space-x-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => closeModal()}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					{/if}
					{editingFranchise ? 'Atualizar' : 'Criar'} Franquia
				</Button>
			</div>
		</form>
	</SheetContent>
</Sheet>

<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Franquia"
	description="Tem certeza que deseja excluir a franquia '{franchiseToDelete?.period}'? Esta ação não pode ser desfeita."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={deleteFranchiseMutation.isPending}
	onConfirm={handleDeleteFranchise}
	onCancel={closeDeleteConfirmation}
/>

