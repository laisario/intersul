<script lang="ts">
	import { useClients, useCreateClient, useUpdateClient, useToggleClientActive } from '$lib/hooks/queries/use-clients.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { LoadingButton } from '$lib/components/ui/loading-button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Plus, Search, MoreVertical } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import type { Client, HowMetCompany } from '$lib/api/types/client.types.js';
	import type { CreateAddressDto } from '$lib/api/types/address.types.js';
	import AddressForm from '$lib/components/address-form.svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import { isAddressComplete, getAddressValidationMessage } from '$lib/utils/address-validation.js';
	import { normalizePostalCode } from '$lib/utils/postal-code.js';

	const HOW_MET_COMPANY_LABELS: Record<HowMetCompany, string> = {
		SOCIAL_MEDIA: 'Redes Sociais',
		REFERRAL: 'Indicação',
		GOOGLE_SEARCH: 'Busca no Google',
		WALK_IN: 'Visita',
		OTHER: 'Outro'
	};

	let addressFormRef: any;

	type StatusFilterOption = 'all' | 'active' | 'inactive';
	let searchTerm = $state('');
	let statusFilter = $state<StatusFilterOption>('all');
	let showFormModal = $state(false);
	let editingClient = $state<Client | null>(null);
	let isSubmitting = $state(false);
	let currentPage = $state(1);
	let pageSize = $state(10);
	const pageSizeOptions = [10, 25, 50, 100];

	let formData = $state({
		name: '',
		cnpj: '',
		cpf: '',
		email: '',
		phone: '',
		how_met_company: undefined as HowMetCompany | undefined,
		address: {
			postalCode: '',
			street: '',
			number: '',
			complement: '',
			neighborhoodId: undefined
		} as Partial<CreateAddressDto>
	});

	const clientsQuery = $derived(useClients());
	const createClientMutation = useCreateClient();
	const updateClientMutation = useUpdateClient();
	const { mutate: toggleActive, isPending: isToggling } = useToggleClientActive();
	
	let clients = $derived(clientsQuery.data || []);
	let clientsLoading = $derived(clientsQuery.isLoading);
	let clientsError = $derived(clientsQuery.error);
	let refetchClients = $derived(clientsQuery.refetch);

	let filteredClients = $derived(
		clients.filter(client => {
			// Status filter
			if (statusFilter !== 'all') {
				if (statusFilter === 'active' && !client.active) return false;
				if (statusFilter === 'inactive' && client.active) return false;
			}
			
			// Search filter
			if (searchTerm) {
				const searchLower = searchTerm.toLowerCase();
				return (
					client.name.toLowerCase().includes(searchLower) ||
					client.email?.toLowerCase().includes(searchLower) ||
					client.phone?.toLowerCase().includes(searchLower) ||
					client.address?.neighborhood?.city?.name?.toLowerCase().includes(searchLower) ||
					client.address?.neighborhood?.name?.toLowerCase().includes(searchLower)
				);
			}
			
			return true;
		})
	);
	
	function getPaginatedClients() {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return filteredClients.slice(start, end);
	}
	
	let totalPages = $derived(Math.ceil(filteredClients.length / pageSize));
	let totalItems = $derived(filteredClients.length);
	
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
		searchTerm;
		statusFilter;
		currentPage = 1;
	});

	// Check if address has any data (user started filling it)
	const hasAddressData = $derived(
		!!(formData.address.postalCode?.trim() || formData.address.street?.trim() || formData.address.number?.trim())
	);

	// Check if address is complete and valid
	const isAddressValid = $derived(isAddressComplete(formData.address));

		// Check if form is valid for submission
		const isFormValid = $derived(
			formData.name.trim() !== '' &&
			formData.phone.trim() !== '' &&
			(!hasAddressData || isAddressValid)
		);

	// Get address validation message for UI feedback
	const addressValidationMessage = $derived(
		hasAddressData && !isAddressValid ? getAddressValidationMessage(formData.address) : null
	);

	function closeModal() {
		showFormModal = false;
		editingClient = null;
		resetForm();
	}

	function resetForm() {
		formData = {
			name: '',
			cnpj: '',
			cpf: '',
			email: '',
			phone: '',
			how_met_company: undefined,
			address: {
				postalCode: '',
				street: '',
				number: '',
				complement: '',
				neighborhoodId: undefined
			}
		};
	}

	async function handleSubmit() {
		isSubmitting = true;
		
		try {
			// Validate required fields
			if (!formData.name.trim()) {
				showError('Nome é obrigatório');
				return;
			}
			if (!formData.phone.trim()) {
				showError('Telefone é obrigatório');
				return;
			}

			// If user started filling address, it must be complete
			if (hasAddressData) {
				if (!isAddressValid) {
					const message = getAddressValidationMessage(formData.address);
					showError(message || 'Preencha todos os campos do endereço');
					return;
				}

				// Process location data if needed (should have been done during CEP search, but retry if missing)
				// This is a fallback in case processLocationData failed during CEP lookup
				if (!formData.address.neighborhoodId && addressFormRef && addressFormRef.processLocationData) {
					const locationProcessed = await addressFormRef.processLocationData();
					if (!locationProcessed) {
						showError('Erro ao processar localização. Tente buscar o CEP novamente.');
						return;
					}
					// Re-check neighborhoodId after processing
					if (!formData.address.neighborhoodId) {
						showError('Erro ao processar localização. Tente buscar o CEP novamente.');
						return;
					}
				}
			}
		
			// Build payload (using camelCase - API client will convert to snake_case)
			const payload: any = {
				name: formData.name.trim(),
				email: formData.email?.trim() || undefined,
				cnpj: formData.cnpj?.trim() || undefined,
				cpf: formData.cpf?.trim() || undefined,
				phone: formData.phone.trim(),
				howMetCompany: formData.how_met_company || undefined,
			};

			// Add address if present (using camelCase - API client will convert)
			// Use normalized postal code for payload
			if (hasAddressData && isAddressValid) {
				payload.address = {
					postalCode: normalizePostalCode(formData.address.postalCode!),
					street: formData.address.street!.trim(),
					number: formData.address.number!.trim(),
					complement: formData.address.complement?.trim() || undefined,
					neighborhoodId: formData.address.neighborhoodId!,
				};
			}

			if (editingClient) {
				await updateClientMutation.mutateAsync({ id: editingClient.id, data: payload });
				successToast.updated(`Cliente ${formData.name}`);
			} else {
				await createClientMutation.mutateAsync(payload);
				successToast.created(`Cliente ${formData.name}`);
			}

			resetForm();
			closeModal();
		} catch (err: any) {
			console.error('Error saving client:', err);
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

	function handleOpenEditModal(client: Client) {
		editingClient = client;
		formData = {
			name: client.name,
			cnpj: client.cnpj || '',
			cpf: client.cpf || '',
			email: client.email,
			phone: client.phone || '',
			how_met_company: client.howMetCompany,
			address: client.address ? {
				postalCode: client.address.postalCode,
				street: client.address.street,
				number: client.address.number,
				complement: client.address.complement || '',
				neighborhoodId: client.address.neighborhoodId
			} : {
				postalCode: '',
				street: '',
				number: '',
				complement: '',
				neighborhoodId: undefined
			}
		};
		showFormModal = true;
	}

	function handleViewClient(clientId: number) {
		goto(`/clients/${clientId}`);
	}

	function handleToggleActive(client: Client) {
		toggleActive(client.id, {
			onSuccess: () => {
				successToast.updated(`Cliente ${client.name}`);
			},
			onError: () => {
				errorToast.update('Cliente');
			},
		});
	}
</script>

<svelte:head>
	<title>Clientes - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">Clientes</h1>
			<p class="text-muted-foreground">Gerencie os clientes</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => showFormModal = true} class="md:w-auto">
				<Plus class="w-4 h-4 mr-2" />
				Novo Cliente
			</Button>
		</div>
	</div>

	<div class="flex items-center gap-4">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
			<Input
				type="text"
				placeholder="Buscar clientes..."
				bind:value={searchTerm}
				class="pl-10"
			/>
		</div>
		<div class="w-[180px]">
			<Select
				type="single"
				value={statusFilter}
				onValueChange={(value: string) => {
					statusFilter = (value as StatusFilterOption) ?? 'all';
				}}
			>
				<SelectTrigger class="w-full">
					<span class="block text-left text-sm">
						{statusFilter === 'all' ? 'Todos os status' : statusFilter === 'active' ? 'Ativos' : 'Inativos'}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos os status</SelectItem>
					<SelectItem value="active">Ativos</SelectItem>
					<SelectItem value="inactive">Inativos</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Lista de Clientes</CardTitle>
		</CardHeader>
		<CardContent>
			{#if clientsLoading}
				<div class="space-y-3">
					{#each Array(5) as _}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			{:else if clientsError}
				<div class="text-center py-12">
					<div class="text-red-600">
						<p class="text-lg font-medium">Erro ao carregar clientes</p>
						<p class="text-sm">{clientsError.message || 'Tente novamente mais tarde.'}</p>
						<Button onclick={() => refetchClients?.()} class="mt-4">
							Tentar novamente
						</Button>
					</div>
				</div>
			{:else if !filteredClients?.length}
				<div class="text-center py-12">
					<div class="text-muted-foreground">
						<p class="text-lg font-medium">Nenhum cliente encontrado</p>
						<p class="text-sm">Comece adicionando um novo cliente.</p>
					</div>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left p-3 font-medium">Nome</th>
								<th class="text-left p-3 font-medium">Status</th>
								<th class="text-left p-3 font-medium">Telefone</th>
								<th class="text-left p-3 font-medium">Email</th>
								<th class="text-left p-3 font-medium">Cidade</th>
								<th class="text-left p-3 font-medium">Bairro</th>
								<th class="text-center p-3 font-medium">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each getPaginatedClients() as client}
								<tr 
									class="border-b hover:bg-gray-50 cursor-pointer" 
									onclick={() => handleViewClient(client.id)}
								>
									<td class="p-3">{client.name}</td>
									<td class="p-3">
										<Badge variant={client.active ? 'default' : 'secondary'}>
											{client.active ? 'Ativo' : 'Inativo'}
										</Badge>
									</td>
									<td class="p-3">{client.phone || '-'}</td>
									<td class="p-3">{client.email}</td>
									<td class="p-3">{client.address?.neighborhood?.city?.name || '-'}</td>
									<td class="p-3">{client.address?.neighborhood?.name || '-'}</td>
									<td class="p-3" onclick={(e) => e.stopPropagation()}>
										<div class="flex items-center justify-center">
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													<Button variant="ghost" size="sm" class="px-2">
														<MoreVertical class="w-4 h-4" />
													</Button>
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end">
													<DropdownMenu.Item
														onclick={() => handleToggleActive(client)}
														disabled={isToggling}
													>
														{client.active ? 'Desativar' : 'Ativar'}
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				
				{#if totalItems > 0}
					<PaginationControls
						page={currentPage}
						totalPages={totalPages}
						totalItems={totalItems}
						pageSize={pageSize}
						label="clientes"
						onPrevious={() => previousPage()}
						onNext={() => nextPage()}
						onSelectPage={(page) => goToPage(page)}
						pageSizeOptions={pageSizeOptions}
						onPageSizeChange={(size) => handlePageSizeChange(size)}
					/>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

<Sheet bind:open={showFormModal}>
	<SheetContent class="sm:max-w-[600px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
			<SheetDescription>
				{editingClient ? 'Atualize as informações do cliente.' : 'Adicione um novo cliente.'}
			</SheetDescription>
		</SheetHeader>
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 mt-6 px-6">
			<div class="space-y-2">
				<Label for="name">Nome *</Label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Nome do cliente"
					required
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="cnpj">CNPJ</Label>
					<Input
						id="cnpj"
						bind:value={formData.cnpj}
						placeholder="00.000.000/0000-00"
					/>
				</div>
				<div class="space-y-2">
					<Label for="cpf">CPF</Label>
					<Input
						id="cpf"
						bind:value={formData.cpf}
						placeholder="000.000.000-00"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="email@exemplo.com"
					/>
				</div>
				<div class="space-y-2">
					<Label for="phone">Telefone *</Label>
					<Input
						id="phone"
						bind:value={formData.phone}
						placeholder="(00) 00000-0000"
						required
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="how_met_company">Como conheceu a empresa?</Label>
				<Select
					type="single"
					value={formData.how_met_company || ''}
					onValueChange={(value: string) => {
						formData.how_met_company = value ? (value as HowMetCompany) : undefined;
					}}
				>
					<SelectTrigger>
						{formData.how_met_company 
							? HOW_MET_COMPANY_LABELS[formData.how_met_company] || formData.how_met_company
							: 'Selecione uma opção'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">Nenhuma</SelectItem>
						<SelectItem value="SOCIAL_MEDIA">Redes Sociais</SelectItem>
						<SelectItem value="REFERRAL">Indicação</SelectItem>
						<SelectItem value="GOOGLE_SEARCH">Busca no Google</SelectItem>
						<SelectItem value="WALK_IN">Visita</SelectItem>
						<SelectItem value="OTHER">Outro</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-medium">Endereço</h3>
				<AddressForm
					bind:this={addressFormRef}
					bind:address={formData.address}
					onChange={(addr) => formData.address = addr}
				/>
			</div>

			{#if addressValidationMessage}
				<div class="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
					{addressValidationMessage}
				</div>
			{/if}

			<div class="flex justify-end space-x-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => closeModal()}
					disabled={isSubmitting}
				>
					Cancelar
				</Button>
				<LoadingButton 
					type="submit" 
					loading={isSubmitting}
					disabled={!isFormValid || isSubmitting}
				>
					{editingClient ? 'Atualizar' : 'Criar'} Cliente
				</LoadingButton>
			</div>
		</form>
	</SheetContent>
</Sheet>

