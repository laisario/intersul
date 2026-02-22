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

	// Derived data from queries (filter out disabled items)
	let catalogMachines = $derived((catalogQuery.data?.data || []).filter((m: CopyMachineCatalog) => !m.isDisabled));
	let franchises = $derived((franchisesQuery.data || []).filter((f: Franchise) => !f.isDisabled));
	let isLoadingCatalog = $derived(catalogQuery.isLoading || catalogQuery.isFetching);
	let isLoadingFranchises = $derived(franchisesQuery.isLoading || franchisesQuery.isFetching);

	// Initialize form state based on whether we're editing or creating
	function getInitialFormData(): CreateClientCopyMachineDto {
		if (machine) {
			// Editing mode - initialize with machine data (already in camelCase from API)
			return {
				serialNumber: machine.serialNumber || '',
				clientId: clientId,
				acquisitionType: machine.acquisitionType || AcquisitionType.RENT,
				catalogCopyMachineId: machine.catalogCopyMachineId ?? undefined,
				externalModel: machine.externalModel || '',
				externalManufacturer: machine.externalManufacturer || '',
				externalDescription: machine.externalDescription || '',
				value: machine.value ?? undefined,
				franchiseId: machine.franchiseId ?? undefined
			};
		} else {
			// Create mode - initialize with defaults
			return {
				serialNumber: '',
				clientId: clientId,
				acquisitionType: AcquisitionType.RENT,
				catalogCopyMachineId: undefined,
				externalModel: '',
				externalManufacturer: '',
				externalDescription: '',
				value: undefined,
				franchiseId: undefined
			};
		}
	}

	// Form state - initialized based on machine prop (using camelCase, humps converts to snake_case on send)
	let formData = $state<Partial<CreateClientCopyMachineDto>>(getInitialFormData());

	let selectedCatalogMachine = $state<CopyMachineCatalog | null>(null);

	// Derived states
	let showCatalogSelect = $derived(
		formData.acquisitionType === AcquisitionType.RENT ||
		formData.acquisitionType === AcquisitionType.SOLD
	);

	let showExternalFields = $derived(formData.acquisitionType === AcquisitionType.OWNED);

	let showValueField = $derived(formData.acquisitionType === AcquisitionType.SOLD);

	let showFranchiseSelect = $derived(formData.acquisitionType === AcquisitionType.RENT);

	let suggestedPrice = $derived(
		selectedCatalogMachine?.price ? `R$ ${Number(selectedCatalogMachine.price).toFixed(2)}` : ''
	);

	// Handle catalog machine selection
	function handleCatalogMachineChange(value: string) {
		if (!value || value === '') {
			formData.catalogCopyMachineId = undefined;
			selectedCatalogMachine = null;
			return;
		}
		
		const machineId = parseInt(value, 10);
		if (isNaN(machineId) || machineId <= 0) {
			console.error('Invalid catalog machine ID:', value);
			formData.catalogCopyMachineId = undefined;
			selectedCatalogMachine = null;
			return;
		}
		
		formData.catalogCopyMachineId = machineId;
		
		// Find the selected machine
		selectedCatalogMachine = catalogMachines.find(m => m.id === machineId) || null;
		
		// If SOLD, suggest the price
		if (formData.acquisitionType === AcquisitionType.SOLD && selectedCatalogMachine?.price) {
			formData.value = Number(selectedCatalogMachine.price);
		}
	}

	// Handle acquisition type change
	function handleAcquisitionTypeChange(value: string) {
		formData.acquisitionType = value as AcquisitionType;
		
		// Reset fields based on type
		if (value === AcquisitionType.OWNED) {
			formData.catalogCopyMachineId = undefined;
			formData.franchiseId = undefined;
			formData.value = undefined;
			selectedCatalogMachine = null;
		} else if (value === AcquisitionType.RENT) {
			formData.externalModel = '';
			formData.externalManufacturer = '';
			formData.externalDescription = '';
			formData.value = undefined;
		} else if (value === AcquisitionType.SOLD) {
			formData.externalModel = '';
			formData.externalManufacturer = '';
			formData.externalDescription = '';
			formData.franchiseId = undefined;
		}
	}

	// Validate form
	function validateForm(): boolean {
		if (!formData.serialNumber?.trim()) {
			showError('Número de série é obrigatório');
			return false;
		}

		if (formData.serialNumber.trim().length < 5) {
			showError('Número de série deve ter pelo menos 5 caracteres');
			return false;
		}

		if (!formData.acquisitionType) {
			showError('Tipo de aquisição é obrigatório');
			return false;
		}

		// Validate based on acquisition type
		if (showCatalogSelect && !formData.catalogCopyMachineId) {
			showError('Selecione uma máquina do catálogo');
			return false;
		}

		// Validate catalog machine ID is a valid number
		if (showCatalogSelect && formData.catalogCopyMachineId) {
			if (isNaN(formData.catalogCopyMachineId) || formData.catalogCopyMachineId <= 0) {
				showError('ID da máquina do catálogo inválido');
				return false;
			}
		}

		if (showExternalFields) {
			if (!formData.externalModel?.trim()) {
				showError('Modelo é obrigatório para máquinas externas');
				return false;
			}
			if (!formData.externalManufacturer?.trim()) {
				showError('Fabricante é obrigatório para máquinas externas');
				return false;
			}
		}

		if (showFranchiseSelect && !formData.franchiseId) {
			showError('Selecione uma franquia para aluguel');
			return false;
		}

		return true;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		// Send camelCase directly - humps will convert to snake_case automatically
		if (isEditing && machine) {
			const payload: UpdateClientCopyMachineDto = {
				serialNumber: formData.serialNumber!,
				acquisitionType: formData.acquisitionType!,
				catalogCopyMachineId: formData.catalogCopyMachineId,
				externalModel: formData.externalModel,
				externalManufacturer: formData.externalManufacturer,
				externalDescription: formData.externalDescription,
				value: formData.value,
				franchiseId: formData.franchiseId
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
			// Ensure catalogCopyMachineId is a valid number or undefined
			let catalogId: number | undefined = undefined;
			if (formData.catalogCopyMachineId) {
				const parsed = Number(formData.catalogCopyMachineId);
				if (!isNaN(parsed) && parsed > 0 && parsed < Number.MAX_SAFE_INTEGER) {
					catalogId = parsed;
				} else {
					console.error('Invalid catalog machine ID:', formData.catalogCopyMachineId);
				}
			}

			const payload: CreateClientCopyMachineDto = {
				serialNumber: formData.serialNumber!,
				clientId: clientId,
				acquisitionType: formData.acquisitionType!,
				catalogCopyMachineId: catalogId,
				externalModel: formData.externalModel,
				externalManufacturer: formData.externalManufacturer,
				externalDescription: formData.externalDescription,
				value: formData.value,
				franchiseId: formData.franchiseId
			};

			console.log('Submitting payload:', payload);

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
		formData.serialNumber = '';
		formData.clientId = clientId;
		formData.acquisitionType = AcquisitionType.RENT;
		formData.catalogCopyMachineId = undefined;
		formData.externalModel = '';
		formData.externalManufacturer = '';
		formData.externalDescription = '';
		formData.value = undefined;
		formData.franchiseId = undefined;
		selectedCatalogMachine = null;
	}

	// Update form data when dialog opens or machine prop changes
	$effect(() => {
		// When dialog opens, initialize form with current machine data (if editing) or defaults (if creating)
		// This effect runs when 'open', 'machine', or 'clientId' changes
		if (open) {
			const initialData = getInitialFormData();
			
		// Update all form fields (all in camelCase)
		formData.serialNumber = initialData.serialNumber || '';
		formData.clientId = clientId;
		formData.acquisitionType = initialData.acquisitionType || AcquisitionType.RENT;
		formData.catalogCopyMachineId = initialData.catalogCopyMachineId;
		formData.externalModel = initialData.externalModel || '';
		formData.externalManufacturer = initialData.externalManufacturer || '';
		formData.externalDescription = initialData.externalDescription || '';
		formData.value = initialData.value;
		formData.franchiseId = initialData.franchiseId;
		
		}
	});
	
	// Update clientId when it changes
	$effect(() => {
		formData.clientId = clientId;
	});
	
	// Set selected catalog machine when catalog loads and we're editing
	$effect(() => {
		if (isEditing && machine?.catalogCopyMachineId && catalogMachines.length > 0) {
			selectedCatalogMachine = catalogMachines.find(m => m.id === machine.catalogCopyMachineId) || null;
		} else if (!isEditing || !machine?.catalogCopyMachineId) {
			selectedCatalogMachine = null;
		}
	});
	
	// Reset form when dialog closes
	$effect(() => {
		if (!open) {
			selectedCatalogMachine = null;
		}
	});

	$effect(() => {
		console.log(franchises, "ccc");
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
				<Label for="serialNumber">Número de Série *</Label>
				<Input
					id="serialNumber"
					bind:value={formData.serialNumber}
					placeholder="Ex: CN12345678"
					required
					disabled={createMutation.isPending || updateMutation.isPending}
				/>
			</div>

			<!-- Acquisition Type -->
			<div class="space-y-2">
				<Label for="acquisitionType">Tipo de Aquisição *</Label>
				<select
					id="acquisitionType"
					bind:value={formData.acquisitionType}
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
							id="catalogMachine"
							value={formData.catalogCopyMachineId?.toString() || ''}
							onchange={(e) => {
								console.log('Select changed, value:', e.currentTarget.value, 'type:', typeof e.currentTarget.value);
								handleCatalogMachineChange(e.currentTarget.value);
							}}
							required
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione uma máquina</option>
							{#each catalogMachines as machine}
								<option value={machine.id?.toString() || ''}>
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
						<Label for="externalManufacturer">Fabricante *</Label>
						<Input
							id="externalManufacturer"
							bind:value={formData.externalManufacturer}
							placeholder="Ex: HP, Canon, Xerox"
							required
							disabled={createMutation.isPending || updateMutation.isPending}
						/>
					</div>

					<div class="space-y-2">
						<Label for="externalModel">Modelo *</Label>
						<Input
							id="externalModel"
							bind:value={formData.externalModel}
							placeholder="Ex: LaserJet Pro M404dn"
							required
							disabled={createMutation.isPending || updateMutation.isPending}
						/>
					</div>

					<div class="space-y-2">
						<Label for="externalDescription">Descrição</Label>
						<textarea
							id="externalDescription"
							bind:value={formData.externalDescription}
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
							value={formData.franchiseId?.toString() || ''}
							onchange={(e) => formData.franchiseId = parseInt(e.currentTarget.value)}
							required
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione uma franquia</option>
							{#each franchises as franchise}
								<option value={franchise.id.toString()}>
									{franchise.period} - {franchise.paperType} 
									{franchise.color ? '(Colorida)' : '(P&B)'} - 
									{franchise.quantity} cópias - 
									R$ {Number(franchise.unitPrice || 0)?.toFixed(2)}/un
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
