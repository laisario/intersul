<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription
	} from '$lib/components/ui/sheet/index.js';
	import { showError, showSuccess } from '$lib/utils/toast.js';
	import { useCopyMachines, useFranchises, useCreateClientCopyMachine, useUpdateClientCopyMachine } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { AcquisitionType, type CreateClientCopyMachineDto, type CopyMachineCatalog, type UpdateClientCopyMachineDto, type ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';
	import { Loader2, Info } from 'lucide-svelte';

	interface Props {
		open: boolean;
		clientId: number;
		machine?: ClientCopyMachine | null;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), clientId, machine, onSuccess }: Props = $props();

	// TanStack Query hooks for data fetching
	const catalogQuery = useCopyMachines('', 1, 100);
	const franchisesQuery = useFranchises();
	const createMutation = useCreateClientCopyMachine();
	const updateMutation = useUpdateClientCopyMachine();
	
	let isEditing = $derived(!!machine);

	// Derived data from queries
	let catalogMachines = $derived(catalogQuery.data?.data || []);
	let franchises = $derived(franchisesQuery.data || []);
	let isLoadingCatalog = $derived(catalogQuery.isLoading || catalogQuery.isFetching);
	let isLoadingFranchises = $derived(franchisesQuery.isLoading || franchisesQuery.isFetching);

	// Initialize form state based on whether we're editing or creating
	function getInitialFormData(): Partial<CreateClientCopyMachineDto> {
		if (machine) {
			// Editing mode - initialize with machine data
			return {
				serial_number: machine.serial_number || '',
				client_id: clientId,
				acquisition_type: machine.acquisition_type || AcquisitionType.RENT,
				catalog_copy_machine_id: machine.catalog_copy_machine_id ?? undefined,
				external_model: machine.external_model || '',
				external_manufacturer: machine.external_manufacturer || '',
				external_description: machine.external_description || '',
				value: machine.value ?? undefined,
				franchise_id: machine.franchise_id ?? undefined
			};
		} else {
			// Create mode - initialize with defaults
			return {
				serial_number: '',
				client_id: clientId,
				acquisition_type: AcquisitionType.RENT,
				catalog_copy_machine_id: undefined,
				external_model: '',
				external_manufacturer: '',
				external_description: '',
				value: undefined,
				franchise_id: undefined
			};
		}
	}

	// Form state - initialized based on machine prop
	let formData = $state<Partial<CreateClientCopyMachineDto>>(getInitialFormData());

	let selectedCatalogMachine = $state<CopyMachineCatalog | null>(null);

	// Derived states
	let showCatalogSelect = $derived(
		formData.acquisition_type === AcquisitionType.RENT ||
		formData.acquisition_type === AcquisitionType.SOLD
	);

	let showExternalFields = $derived(formData.acquisition_type === AcquisitionType.OWNED);

	let showValueField = $derived(formData.acquisition_type === AcquisitionType.SOLD);

	let showFranchiseSelect = $derived(formData.acquisition_type === AcquisitionType.RENT);

	let suggestedPrice = $derived(
		selectedCatalogMachine?.price ? `R$ ${Number(selectedCatalogMachine.price).toFixed(2)}` : ''
	);

	// Handle catalog machine selection
	function handleCatalogMachineChange(value: string) {
		const machineId = parseInt(value);
		formData.catalog_copy_machine_id = machineId;
		
		// Find the selected machine
		selectedCatalogMachine = catalogMachines.find(m => m.id === machineId) || null;
		
		// If SOLD, suggest the price
		if (formData.acquisition_type === AcquisitionType.SOLD && selectedCatalogMachine?.price) {
			formData.value = Number(selectedCatalogMachine.price);
		}
	}

	// Handle acquisition type change
	function handleAcquisitionTypeChange(value: string) {
		formData.acquisition_type = value as AcquisitionType;
		
		// Reset fields based on type
		if (value === AcquisitionType.OWNED) {
			formData.catalog_copy_machine_id = undefined;
			formData.franchise_id = undefined;
			formData.value = undefined;
			selectedCatalogMachine = null;
		} else if (value === AcquisitionType.RENT) {
			formData.external_model = '';
			formData.external_manufacturer = '';
			formData.external_description = '';
			formData.value = undefined;
		} else if (value === AcquisitionType.SOLD) {
			formData.external_model = '';
			formData.external_manufacturer = '';
			formData.external_description = '';
			formData.franchise_id = undefined;
		}
	}

	// Validate form
	function validateForm(): boolean {
		if (!formData.serial_number?.trim()) {
			showError('Número de série é obrigatório');
			return false;
		}

		if (!formData.acquisition_type) {
			showError('Tipo de aquisição é obrigatório');
			return false;
		}

		// Validate based on acquisition type
		if (showCatalogSelect && !formData.catalog_copy_machine_id) {
			showError('Selecione uma máquina do catálogo');
			return false;
		}

		if (showExternalFields) {
			if (!formData.external_model?.trim()) {
				showError('Modelo é obrigatório para máquinas externas');
				return false;
			}
			if (!formData.external_manufacturer?.trim()) {
				showError('Fabricante é obrigatório para máquinas externas');
				return false;
			}
		}

		if (showFranchiseSelect && !formData.franchise_id) {
			showError('Selecione uma franquia para aluguel');
			return false;
		}

		return true;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		if (isEditing && machine) {
			const payload: UpdateClientCopyMachineDto = {
				serial_number: formData.serial_number!,
				acquisition_type: formData.acquisition_type!,
				catalog_copy_machine_id: formData.catalog_copy_machine_id,
				external_model: formData.external_model || undefined,
				external_manufacturer: formData.external_manufacturer || undefined,
				external_description: formData.external_description || undefined,
				value: formData.value ? Number(formData.value) : undefined,
				franchise_id: formData.franchise_id
			};

			updateMutation.mutate({ id: machine.id, data: payload }, {
				onSuccess: () => {
					showSuccess('Máquina atualizada com sucesso!');
					resetForm();
					open = false;
					onSuccess?.();
				},
				onError: (error: any) => {
					console.error('Error updating client copy machine:', error);
					if (error.response?.data?.message) {
						showError(error.response.data.message);
					} else {
						showError('Erro ao atualizar máquina');
					}
				}
			});
		} else {
			const payload: CreateClientCopyMachineDto = {
				serial_number: formData.serial_number!,
				client_id: clientId,
				acquisition_type: formData.acquisition_type!,
				catalog_copy_machine_id: formData.catalog_copy_machine_id,
				external_model: formData.external_model || undefined,
				external_manufacturer: formData.external_manufacturer || undefined,
				external_description: formData.external_description || undefined,
				value: formData.value ? Number(formData.value) : undefined,
				franchise_id: formData.franchise_id
			};

			createMutation.mutate(payload, {
				onSuccess: () => {
					showSuccess('Máquina cadastrada com sucesso!');
					resetForm();
					open = false;
					onSuccess?.();
				},
				onError: (error: any) => {
					console.error('Error creating client copy machine:', error);
					if (error.response?.data?.message) {
						showError(error.response.data.message);
					} else {
						showError('Erro ao cadastrar máquina');
					}
				}
			});
		}
	}

	// Reset form to default values (for create mode)
	function resetForm() {
		formData.serial_number = '';
		formData.client_id = clientId;
		formData.acquisition_type = AcquisitionType.RENT;
		formData.catalog_copy_machine_id = undefined;
		formData.external_model = '';
		formData.external_manufacturer = '';
		formData.external_description = '';
		formData.value = undefined;
		formData.franchise_id = undefined;
		selectedCatalogMachine = null;
	}

	// Update form data when dialog opens or machine prop changes
	$effect(() => {
		// When dialog opens, initialize form with current machine data (if editing) or defaults (if creating)
		// This effect runs when 'open', 'machine', or 'clientId' changes
		if (open) {
			const initialData = getInitialFormData();
			
			// Update all form fields
			formData.serial_number = initialData.serial_number || '';
			formData.client_id = clientId;
			formData.acquisition_type = initialData.acquisition_type || AcquisitionType.RENT;
			formData.catalog_copy_machine_id = initialData.catalog_copy_machine_id;
			formData.external_model = initialData.external_model || '';
			formData.external_manufacturer = initialData.external_manufacturer || '';
			formData.external_description = initialData.external_description || '';
			formData.value = initialData.value;
			formData.franchise_id = initialData.franchise_id;
			
			console.log('Form initialized - Is editing:', isEditing);
			console.log('Machine data:', machine);
			console.log('Form data:', formData);
		}
	});
	
	// Update client_id when it changes
	$effect(() => {
		formData.client_id = clientId;
	});
	
	// Set selected catalog machine when catalog loads and we're editing
	$effect(() => {
		if (isEditing && machine?.catalog_copy_machine_id && catalogMachines.length > 0) {
			selectedCatalogMachine = catalogMachines.find(m => m.id === machine.catalog_copy_machine_id) || null;
		} else if (!isEditing || !machine?.catalog_copy_machine_id) {
			selectedCatalogMachine = null;
		}
	});
	
	// Reset form when dialog closes
	$effect(() => {
		if (!open) {
			selectedCatalogMachine = null;
		}
	});
</script>

<Sheet bind:open>
	<SheetContent class="sm:max-w-[600px] px-6 overflow-y-auto">
			<SheetHeader>
				<SheetTitle>{isEditing ? 'Editar Máquina' : 'Cadastrar Nova Máquina'}</SheetTitle>
				<SheetDescription>
					{isEditing ? 'Atualize as informações da máquina copiadora' : 'Adicione uma nova máquina copiadora para o cliente'}
				</SheetDescription>
			</SheetHeader>
			
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 mt-6">
			<!-- Serial Number -->
			<div class="space-y-2">
				<Label for="serial_number">Número de Série *</Label>
				<Input
					id="serial_number"
					bind:value={formData.serial_number}
					placeholder="Ex: CN12345678"
					required
					disabled={createMutation.isPending || updateMutation.isPending}
				/>
			</div>

			<!-- Acquisition Type -->
			<div class="space-y-2">
				<Label for="acquisition_type">Tipo de Aquisição *</Label>
				<select
					id="acquisition_type"
					bind:value={formData.acquisition_type}
					onchange={(e) => handleAcquisitionTypeChange(e.currentTarget.value)}
					required
					disabled={createMutation.isPending || updateMutation.isPending}
					class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value={AcquisitionType.RENT}>Aluguel</option>
					<option value={AcquisitionType.SOLD}>Venda</option>
					<option value={AcquisitionType.OWNED}>Própria (Externa)</option>
				</select>
			</div>

			<!-- Catalog Machine Select (for RENT and SOLD) -->
			{#if showCatalogSelect}
				<div class="space-y-2">
					<Label for="catalog_machine">Máquina do Catálogo *</Label>
					{#if isLoadingCatalog}
						<div class="flex items-center justify-center p-4 border rounded-md">
							<Loader2 class="w-4 h-4 animate-spin mr-2" />
							<span class="text-sm text-muted-foreground">Carregando máquinas...</span>
						</div>
					{:else if catalogMachines.length === 0}
						<div class="text-sm text-muted-foreground p-4 border rounded-md">
							Nenhuma máquina disponível no catálogo
						</div>
					{:else}
						<select
							id="catalog_machine"
							value={formData.catalog_copy_machine_id?.toString() || ''}
							onchange={(e) => handleCatalogMachineChange(e.currentTarget.value)}
							required
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione uma máquina</option>
							{#each catalogMachines as machine}
								<option value={machine.id.toString()}>
									{machine.manufacturer} - {machine.model}
									{#if machine.price != null}
										(R$ {Number(machine.price).toFixed(2)})
									{/if}
								</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}

			<!-- External Machine Fields (for OWNED) -->
			{#if showExternalFields}
				<div class="space-y-4 p-4 border rounded-md bg-muted/50">
					<p class="text-sm font-medium">Informações da Máquina Externa</p>
					
					<div class="space-y-2">
						<Label for="external_manufacturer">Fabricante *</Label>
						<Input
							id="external_manufacturer"
							bind:value={formData.external_manufacturer}
							placeholder="Ex: HP, Canon, Xerox"
							required
							disabled={createMutation.isPending || updateMutation.isPending}
						/>
					</div>

					<div class="space-y-2">
						<Label for="external_model">Modelo *</Label>
						<Input
							id="external_model"
							bind:value={formData.external_model}
							placeholder="Ex: LaserJet Pro M404dn"
							required
							disabled={createMutation.isPending || updateMutation.isPending}
						/>
					</div>

					<div class="space-y-2">
						<Label for="external_description">Descrição</Label>
						<textarea
							id="external_description"
							bind:value={formData.external_description}
							placeholder="Detalhes adicionais da máquina..."
							rows={3}
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>
				</div>
			{/if}

			<!-- Value Field (for SOLD) -->
			{#if showValueField}
				<div class="space-y-2">
					<Label for="value">Valor da Venda *</Label>
					<div class="flex gap-2">
						<div class="flex-1">
							<Input
								id="value"
								type="number"
								step="0.01"
								min="0"
								value={formData.value ?? ''}
								oninput={(e) => {
									const val = e.currentTarget.value;
									formData.value = val ? Number(val) : undefined;
								}}
								placeholder="0.00"
								required
								disabled={createMutation.isPending || updateMutation.isPending}
							/>
						</div>
						{#if suggestedPrice}
							<div class="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
								<Info class="w-4 h-4 text-muted-foreground" />
								<span class="text-sm text-muted-foreground">
									Preço sugerido: {suggestedPrice}
								</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Franchise Select (for RENT) -->
			{#if showFranchiseSelect}
				<div class="space-y-2">
					<Label for="franchise">Plano de Franquia *</Label>
					{#if isLoadingFranchises}
						<div class="flex items-center justify-center p-4 border rounded-md">
							<Loader2 class="w-4 h-4 animate-spin mr-2" />
							<span class="text-sm text-muted-foreground">Carregando franquias...</span>
						</div>
					{:else if franchises.length === 0}
						<div class="text-sm text-muted-foreground p-4 border rounded-md">
							Nenhuma franquia disponível
						</div>
					{:else}
						<select
							id="franchise"
							value={formData.franchise_id?.toString() || ''}
							onchange={(e) => formData.franchise_id = parseInt(e.currentTarget.value)}
							required
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione uma franquia</option>
							{#each franchises as franchise}
								<option value={franchise.id.toString()}>
									{franchise.period} - {franchise.paper_type} 
									{franchise.color ? '(Colorida)' : '(P&B)'} - 
									{franchise.quantity} cópias - 
									R$ {franchise?.unitPrice?.toFixed(4)}/un
								</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}

			<!-- Form Actions -->
			<div class="flex justify-end gap-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => { open = false; resetForm(); }}
					disabled={createMutation.isPending || updateMutation.isPending}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
					{#if createMutation.isPending || updateMutation.isPending}
						<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						{isEditing ? 'Atualizando...' : 'Cadastrando...'}
					{:else}
						{isEditing ? 'Atualizar Máquina' : 'Cadastrar Máquina'}
					{/if}
				</Button>
			</div>
		</form>
	</SheetContent>
</Sheet>
