<script lang="ts">
	import { useCopyMachines, useCreateCopyMachine, useUpdateCopyMachine, useDeleteCopyMachine } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import { Skeleton } from '$lib/components/ui/skeleton/index.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
import { Plus, Edit, Trash2, Eye, Search, Printer, User, Loader2 } from 'lucide-svelte';
import { goto } from '$app/navigation';
import type { CopyMachineCatalog } from '$lib/api/types/copy-machine.types.js';
import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
import ImageUpload from '$lib/components/image-upload.svelte';
import { copyMachinesApi } from '$lib/api/endpoints/copy-machines';
import PaginationControls from '$lib/components/pagination-controls.svelte';

	let searchTerm = $state('');
	let showNewMachineModal = $state(false);
	let showEditMachineModal = $state(false);
	let currentPage = $state(1);
	let pageSize = $state(6);
const pageSizeOptions = [6, 12, 24, 48];
	let selectedMachine = $state<CopyMachineCatalog | null>(null);
	let editingMachine = $state<CopyMachineCatalog | null>(null);
	let isSubmitting = $state(false);
	
	// Confirmation dialog state
	let showDeleteConfirmation = $state(false);
	let machineToDelete = $state<{ id: number; model: string } | null>(null);

    let formData = $state({
		model: '',
		manufacturer: '',
		description: '',
		features: [] as string[],
		price: '',
		quantity: undefined as number | undefined,
        file: null as File | null
	});

	let searchQuery = $derived(searchTerm || '');
	const catalogQuery = $derived(useCopyMachines(searchQuery, currentPage, pageSize));
	const createMachineMutation = useCreateCopyMachine();
	const updateMachineMutation = useUpdateCopyMachine();
	const deleteMachineMutation = useDeleteCopyMachine();
	
	let catalogMachines = $derived(catalogQuery.data?.data || []);
	let catalogLoading = $derived(catalogQuery.isLoading);
	let catalogFetching = $derived(catalogQuery.isFetching);
	let catalogError = $derived(catalogQuery.error);
	let refetchCatalog = $derived(catalogQuery.refetch);
	
	let totalItems = $derived(catalogQuery.data?.total || 0);
	let totalPages = $derived(catalogQuery.data?.totalPages || 0);
	let currentPageData = $derived(catalogQuery.data?.page || 1);
	let pageSizeData = $derived(catalogQuery.data?.limit || 12);
	
	function handleSearch() {
		currentPage = 1;
	}
	
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

	function openDeleteConfirmation(machineId: number, machineModel: string) {
		machineToDelete = { id: machineId, model: machineModel };
		showDeleteConfirmation = true;
	}

	async function handleDeleteMachine() {
		if (!machineToDelete) return;

		try {
			await deleteMachineMutation.mutateAsync(machineToDelete.id);
			successToast.deleted(machineToDelete.model);
			closeDeleteConfirmation();
		} catch (err: any) {
			console.error('Error deleting machine:', err);
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
		machineToDelete = null;
	}


	function closeModals() {
		showNewMachineModal = false;
		showEditMachineModal = false;
		selectedMachine = null;
		editingMachine = null;
		resetForm();
	}

    function resetForm() {
		formData = {
			model: '',
			manufacturer: '',
			description: '',
			features: [],
			price: '',
			quantity: undefined,
            file: null
		};
	}

	function addFeature() {
		formData.features = [...formData.features, ''];
	}

	function removeFeature(index: number) {
		formData.features = formData.features.filter((_, i) => i !== index);
	}

	function logFormData(fd: FormData) {
		const rows: Array<Record<string, any>> = [];
		fd.forEach((value, key) => {
			if (value instanceof File) {
				rows.push({ key, type: 'File', name: value.name, mime: value.type, size: value.size });
			} else {
				rows.push({ key, value: String(value) });
			}
		});
		console.group('[Machines] Outgoing FormData');
		console.table(rows);
		console.groupEnd();
	}

	async function handleSubmit() {
		isSubmitting = true;
		
		try {
			if (!formData.model.trim()) {
				showError('Modelo é obrigatório');
				return;
			}
			if (!formData.manufacturer.trim()) {
				showError('Fabricante é obrigatório');
				return;
			}
			if (formData.price && isNaN(parseFloat(formData.price))) {
				showError('Preço deve ser um número válido');
				return;
			}

			const features = formData.features
				.filter(f => f && typeof f === 'string' && f.trim() !== '')
				.map(f => f.trim());

			const fd = new FormData();
			fd.append('model', formData.model.trim());
			fd.append('manufacturer', formData.manufacturer.trim());
			if (formData.description?.trim()) fd.append('description', formData.description.trim());
			features.forEach((f) => fd.append('features', f));
			if (formData.price && !isNaN(parseFloat(formData.price))) fd.append('price', String(parseFloat(formData.price)));
			if (formData.quantity !== undefined && formData.quantity !== null && !isNaN(Number(formData.quantity))) fd.append('quantity', String(Number(formData.quantity)));
			if (formData.file) {
				fd.append('file', formData.file);
			}
	
            if (editingMachine) {
                await updateMachineMutation.mutateAsync({ id: editingMachine.id, data: fd as any });
				successToast.updated(formData.model);
			} else {
                await createMachineMutation.mutateAsync(fd as any);
				successToast.created(formData.model);
			}

			resetForm();
			closeModals();
		} catch (err: any) {
			console.error('Error saving machine:', err);
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

	function handleOpenEditModal(machine: CopyMachineCatalog) {
		editingMachine = machine;
		formData = {
			model: machine.model,
			manufacturer: machine.manufacturer,
			description: machine.description || '',
			features: machine.features || [],
            price: machine.price?.toString() || '',
            quantity: machine.quantity,
            file: null
		};
		showNewMachineModal = true;
	}

	$effect(() => {
		console.log(formData);
	});
</script>

<svelte:head>
	<title>Máquinas - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Máquinas</h1>
			<p class="text-muted-foreground">Gerencie o catálogo de máquinas</p>
		</div>
		<div class="flex items-center space-x-2">
			<Button onclick={() => showNewMachineModal = !showNewMachineModal}>
				<Plus class="w-4 h-4 mr-2" />
				Nova Máquina
			</Button>
		</div>
	</div>

	<!-- Search -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-2">
			<div class="relative flex-1 max-w-sm">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
				<Input
					type="text"
					placeholder="Buscar máquinas..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="pl-10"
				/>
			</div>
		</div>
		
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#if catalogLoading || catalogFetching || !catalogMachines}
			{#each Array(6) as _}
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-3/4" />
						<Skeleton class="h-4 w-1/2" />
					</CardHeader>
					<CardContent>
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-2/3 mt-2" />
					</CardContent>
				</Card>
			{/each}
		{:else if catalogError}
			<div class="col-span-full text-center py-12">
				<div class="text-red-600">
					<p class="text-lg font-medium">Erro ao carregar máquinas</p>
					<p class="text-sm">{catalogError.message || 'Tente novamente mais tarde.'}</p>
					<Button onclick={() => refetchCatalog?.()} class="mt-4">
						Tentar novamente
					</Button>
				</div>
			</div>
		{:else if !catalogMachines?.length}
			<div class="col-span-full text-center py-12">
				<div class="text-muted-foreground">
					<p class="text-lg font-medium">Nenhuma máquina encontrada</p>
					<p class="text-sm">Comece adicionando uma nova máquina ao catálogo.</p>
				</div>
			</div>
		{:else}
			{#each catalogMachines as machine}
				<Card class="hover:shadow-md transition-shadow">
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle class="text-lg">{machine.model}</CardTitle>
							<Badge variant="outline">{machine.manufacturer}</Badge>
						</div>
						{#if machine.description}
							<CardDescription>{machine.description}</CardDescription>
						{/if}
					</CardHeader>
					
					<!-- Machine Image -->
					{#if machine.file}
						<div class="px-6 pb-2">
							<div class="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
								<img 
									src={machine.file} 
									alt={machine.model}
									class="w-full h-full object-cover"
									onerror={(event) => {
										const img = event.target as HTMLImageElement;
										img.style.display = 'none';
									}}
								/>
							</div>
						</div>
					{/if}
					
					<CardContent>
						<div class="space-y-3">
							{#if machine.features && machine.features.length > 0}
								<div>
									<h4 class="text-sm font-medium text-muted-foreground mb-2">Características:</h4>
									<div class="flex flex-wrap gap-1">
										{#each machine.features as feature}
											<Badge variant="secondary" class="text-xs">
												{feature}
											</Badge>
										{/each}
									</div>
								</div>
							{/if}
							
							<div class="space-y-2">
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Preço:</span>
									<span class="font-medium text-lg">{machine.price ? formatCurrency(machine.price) : 'Preço não informado'}</span>
								</div>
								{#if machine.quantity !== undefined && machine.quantity !== null}
									<div class="flex items-center justify-between text-sm">
										<span class="text-muted-foreground">Quantidade:</span>
										<span class="font-medium">{machine.quantity}</span>
									</div>
								{/if}
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Adicionada em:</span>
									<span>{formatDate(machine.created_at)}</span>
								</div>
							</div>
						</div>
						
						<div class="flex items-center justify-end space-x-2 mt-4">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => handleOpenEditModal(machine)}
							>
								<Edit class="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => openDeleteConfirmation(machine.id, machine.model)}
								class="text-red-600 hover:text-red-700"
							>
								<Trash2 class="w-4 h-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>
	
{#if totalPages > 0}
	<PaginationControls
		page={currentPage}
		totalPages={totalPages}
		totalItems={totalItems}
		pageSize={pageSize}
		label="máquinas"
		pageSizeOptions={pageSizeOptions}
		onPrevious={() => previousPage()}
		onNext={() => nextPage()}
		onSelectPage={(page) => goToPage(page)}
		onPageSizeChange={(size) => handlePageSizeChange(size)}
	/>
{/if}
</div>

<!-- New Machine Modal -->
<Sheet bind:open={showNewMachineModal}>
	<SheetContent class="sm:max-w-[600px] h-[90vh] flex flex-col">
		<SheetHeader class="flex-shrink-0">
			<SheetTitle>{editingMachine ? 'Editar Máquina' : 'Nova Máquina'}</SheetTitle>
			<SheetDescription>
				{editingMachine ? 'Atualize as informações da máquina.' : 'Adicione uma nova máquina ao catálogo.'}
			</SheetDescription>
		</SheetHeader>
		<div class="flex-1 flex flex-col min-h-0">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex-1 flex flex-col min-h-0">
				<div class="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 max-h-full">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="model">Modelo *</Label>
						<Input
							id="model"
							bind:value={formData.model}
							placeholder="Ex: WorkCentre 6515"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="manufacturer">Fabricante *</Label>
						<Input
							id="manufacturer"
							bind:value={formData.manufacturer}
							placeholder="Ex: Xerox"
							required
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="description">Descrição</Label>
					<textarea
						id="description"
						bind:value={formData.description}
						placeholder="Descreva as características da máquina"
						rows={3}
						class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					></textarea>
				</div>

				<div class="space-y-2">
					<Label>Características</Label>
					<div class="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50/50">
						{#each formData.features as feature, index}
							<div class="flex items-center gap-2">
								<Input
									bind:value={formData.features[index]}
									placeholder="Ex: Impressão colorida"
									class="flex-1"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => removeFeature(index)}
									class="text-red-600 hover:text-red-700"
								>
									<Trash2 class="w-4 h-4" />
								</Button>
							</div>
						{/each}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addFeature}
							class="w-full"
						>
							<Plus class="w-4 h-4 mr-2" />
							Adicionar Característica
						</Button>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="price">Preço *</Label>
						<Input
							id="price"
							type="number"
							step="0.01"
							min="0"
							bind:value={formData.price}
							placeholder="0.00"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="quantity">Quantidade em estoque</Label>
						<Input
							id="quantity"
							type="number"
							min="0"
							bind:value={formData.quantity}
							placeholder="1, 2, 3, etc."
						/>
					</div>
				</div>

				<div class="space-y-2">
                <ImageUpload
                    bind:value={formData.file}
                    onChange={(file) => formData.file = file}
                    label="Imagem da Máquina"
                    placeholder="Faça upload de um arquivo"
                />
				</div>

				</div>

				<div class="flex-shrink-0 border-t bg-background p-6">
					<div class="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onclick={() => showNewMachineModal = false}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{#if isSubmitting}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
							{/if}
							{editingMachine ? 'Atualizar' : 'Criar'} Máquina
						</Button>
					</div>
				</div>
			</form>
		</div>
	</SheetContent>
</Sheet>

<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Máquina"
	description="Tem certeza que deseja excluir a máquina '{machineToDelete?.model}'? Esta ação não pode ser desfeita."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={deleteMachineMutation.isPending}
	onConfirm={handleDeleteMachine}
	onCancel={closeDeleteConfirmation}
/>
