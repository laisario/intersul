<script lang="ts">
	import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '$lib/hooks/queries/use-clients.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import { Plus, Edit, Trash2, Eye, Search, Loader2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { Client } from '$lib/api/types/client.types.js';
	import type { CreateAddressDto } from '$lib/api/types/address.types.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import AddressForm from '$lib/components/address-form.svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';

	let addressFormRef: any;

	let searchTerm = $state('');
	let showFormModal = $state(false);
	let editingClient = $state<Client | null>(null);
	let isSubmitting = $state(false);
	let currentPage = $state(1);
	let pageSize = $state(10);
	const pageSizeOptions = [10, 25, 50, 100];
	
	let showDeleteConfirmation = $state(false);
	let clientToDelete = $state<{ id: number; name: string } | null>(null);

	let formData = $state({
		name: '',
		cnpj: '',
		cpf: '',
		email: '',
		phone: '',
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
	const deleteClientMutation = useDeleteClient();
	
	let clients = $derived(clientsQuery.data || []);
	let clientsLoading = $derived(clientsQuery.isLoading);
	let clientsError = $derived(clientsQuery.error);
	let refetchClients = $derived(clientsQuery.refetch);

	let filteredClients = $derived(
		searchTerm
			? clients.filter(client =>
					client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					client.address?.neighborhood?.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					client.address?.neighborhood?.name?.toLowerCase().includes(searchTerm.toLowerCase())
			  )
			: clients
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
		currentPage = 1;
	});

	function openDeleteConfirmation(clientId: number, clientName: string) {
		clientToDelete = { id: clientId, name: clientName };
		showDeleteConfirmation = true;
	}

	async function handleDeleteClient() {
		if (!clientToDelete) return;

		try {
			await deleteClientMutation.mutateAsync(clientToDelete.id);
			successToast.deleted(`Cliente ${clientToDelete.name}`);
			closeDeleteConfirmation();
		} catch (err: any) {
			console.error('Error deleting client:', err);
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
		clientToDelete = null;
	}

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
</script>

<svelte:head>
	<title>Clientes - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Clientes</h1>
			<p class="text-muted-foreground">Gerencie os clientes</p>
		</div>
		<Button onclick={() => showFormModal = true}>
			<Plus class="w-4 h-4 mr-2" />
			Novo Cliente
		</Button>
	</div>

	<div class="flex items-center justify-between">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
			<Input
				type="text"
				placeholder="Buscar clientes..."
				bind:value={searchTerm}
				class="pl-10"
			/>
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
								<th class="text-left p-3 font-medium">Telefone</th>
								<th class="text-left p-3 font-medium">Email</th>
								<th class="text-left p-3 font-medium">Cidade</th>
								<th class="text-left p-3 font-medium">Bairro</th>
								<th class="text-center p-3 font-medium">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each getPaginatedClients() as client}
								<tr class="border-b hover:bg-gray-50">
							<td class="p-3">{client.name}</td>
							<td class="p-3">{client.phone || '-'}</td>
							<td class="p-3">{client.email}</td>
							<td class="p-3">{client.address?.neighborhood?.city?.name || '-'}</td>
							<td class="p-3">{client.address?.neighborhood?.name || '-'}</td>
									<td class="p-3">
										<div class="flex items-center justify-center space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleViewClient(client.id)}
											>
												<Eye class="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleOpenEditModal(client)}
											>
												<Edit class="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openDeleteConfirmation(client.id, client.name)}
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

<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Cliente"
	description="Tem certeza que deseja excluir o cliente '{clientToDelete?.name}'? Esta ação não pode ser desfeita."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={deleteClientMutation.isPending}
	onConfirm={handleDeleteClient}
	onCancel={closeDeleteConfirmation}
/>

