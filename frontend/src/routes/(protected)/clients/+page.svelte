<script lang="ts">
	import { useClients, useCreateClient, useUpdateClient, useToggleClientActive } from '$lib/hooks/queries/use-clients.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Plus, Edit, Search, Loader2, MoreVertical } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import type { Client, HowMetCompany } from '$lib/api/types/client.types.js';
	import type { CreateAddressDto } from '$lib/api/types/address.types.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import AddressForm from '$lib/components/address-form.svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import CityBillingDialog from '$lib/components/city-billing-dialog.svelte';
import BillingResponsablesDialog from '$lib/components/billing-responsables-dialog.svelte';
import { useGenerateBillingsByCity, useDeleteBilling } from '$lib/hooks/queries/use-billings.svelte.js';

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
	
	let showCityBillingDialog = $state(false);
	let showConfirmationDialog = $state(false);
	let showResponsablesDialog = $state(false);
	let selectedCityId = $state<number | null>(null);
	const generateBillingsMutation = useGenerateBillingsByCity();
	const deleteBillingMutation = useDeleteBilling();
	let createdBillingIds = $state<number[]>([]);

	let formData = $state({
		name: '',
		cnpj: '',
		cpf: '',
		email: '',
		phone: '',
		how_met_company: undefined as HowMetCompany | undefined,
		address: {
			postal_code: '',
			street: '',
			number: '',
			complement: '',
			neighborhood_id: undefined
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
				postal_code: '',
				street: '',
				number: '',
				complement: '',
				neighborhood_id: undefined
			}
		};
	}

	async function handleSubmit() {
		isSubmitting = true;
		
		try {
			if (!formData.name.trim()) {
				showError('Nome é obrigatório');
				return;
			}
			if (!formData.email.trim()) {
				showError('Email é obrigatório');
				return;
			}

		const hasAddress = formData.address.postal_code && formData.address.postal_code.trim();
		
		if (hasAddress) {
			if (!formData.address.street?.trim()) {
				showError('Rua é obrigatória');
				return;
			}
			if (!formData.address.number?.trim()) {
				showError('Número é obrigatório');
				return;
			}

			if (addressFormRef && addressFormRef.processLocationData) {
				const locationProcessed = await addressFormRef.processLocationData();
				if (!locationProcessed) {
					return;
				}
			}

			if (!formData.address.neighborhood_id) {
				showError('Erro ao processar localização. Busque o CEP para preencher automaticamente.');
				return;
			}
		}
		
		const payload: any = {
			name: formData.name.trim(),
			email: formData.email.trim(),
			cnpj: formData.cnpj?.trim() || undefined,
			cpf: formData.cpf?.trim() || undefined,
			phone: formData.phone?.trim() || undefined,
			how_met_company: formData.how_met_company || undefined,
		};

		if (hasAddress) {
			payload.address = {
				postal_code: formData.address.postal_code!.trim(),
				street: formData.address.street!.trim(),
				number: formData.address.number!.trim(),
				complement: formData.address.complement?.trim() || undefined,
				neighborhood_id: formData.address.neighborhood_id!,
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
			how_met_company: client.how_met_company,
			address: client.address ? {
				postal_code: client.address.postal_code,
				street: client.address.street,
				number: client.address.number,
				complement: client.address.complement || '',
				neighborhood_id: client.address.neighborhood_id
			} : {
				postal_code: '',
				street: '',
				number: '',
				complement: '',
				neighborhood_id: undefined
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
				city_id: selectedCityId,
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
			<Button variant="outline" onclick={() => showCityBillingDialog = true} class="md:w-auto">
				Fazer fechamento
			</Button>
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
													<DropdownMenu.Item onclick={() => handleOpenEditModal(client)}>
														<Edit class="w-4 h-4 mr-2" />
														Editar
													</DropdownMenu.Item>
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
					<Label for="email">Email *</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="email@exemplo.com"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="phone">Telefone</Label>
					<Input
						id="phone"
						bind:value={formData.phone}
						placeholder="(00) 00000-0000"
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
					{editingClient ? 'Atualizar' : 'Criar'} Cliente
				</Button>
			</div>
		</form>
	</SheetContent>
</Sheet>

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
	onConfirm={handleResponsablesSelected}
	onCancel={handleCancelBilling}
/>

