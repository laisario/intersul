<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { useClient } from '$lib/hooks/queries/use-clients.svelte.js';
	import { errorToast } from '$lib/utils/toast.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
	import { ACQUISITION_TYPE, getServiceStatusLabel, getServiceStatusVariant } from '$lib/utils/constants.js';
	import { AcquisitionType } from '$lib/api/types/copy-machine.types.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { 
		ArrowLeft, 
		Edit, 
		Phone, 
		Mail, 
		MapPin, 
		Printer, 
		Wrench,
		Calendar,
		User,
		Trash2,
		MoreVertical,
		Info,
		DollarSign,
		FileText,
		Clock,
		History
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import CopyMachineFormDialog from '$lib/components/copymachine-form-dialog.svelte';
	import { useClientCopyMachines, useDeleteClientCopyMachine, useClientCopyMachine } from '$lib/hooks/queries/use-copy-machines.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import { showError, successToast } from '$lib/utils/toast.js';
	import type { ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import type { Service } from '$lib/api/types/service.types.js';
	import { SERVICE_STATUS } from '$lib/utils/constants.js';
	import { ServiceStatus } from '$lib/api/types/service.types.js';
	import { useClientServiceHistory } from '$lib/hooks/queries/use-services.svelte.js';

	let clientId = $derived(Number($page.params.id));
	let showCreateCopyMachineModal = $state(false);
	let showEditCopyMachineModal = $state(false);
	let showViewMachineModal = $state(false);
	let editingMachine = $state<ClientCopyMachine | null>(null);
	let viewingMachineId = $state<number | null>(null);
	let currentPage = $state(1);
	let pageSize = $state(10);
	const pageSizeOptions = [10, 25, 50, 100];
	
	let showDeleteConfirmation = $state(false);
	let machineToDelete = $state<{ id: number; serial: string } | null>(null);

	const { data: client, isLoading, refetch } = $derived(useClient(clientId));
	const {data: clientMachines, isLoading: isLoadingClientCopyMachines, refetch: refetchClientCopyMachines} = $derived(useClientCopyMachines(clientId));
	const deleteMutation = useDeleteClientCopyMachine();
	
	const viewingMachineQuery = $derived(
		viewingMachineId ? useClientCopyMachine(viewingMachineId) : null
	);
	const viewingMachine = $derived(viewingMachineQuery?.data ?? null);
	const isLoadingViewingMachine = $derived(viewingMachineQuery?.isLoading ?? false);
	
	const machineServices = $derived(viewingMachine?.services ?? []);
	const isLoadingMachineServices = $derived(isLoadingViewingMachine);

	
	$effect(() => {
		console.log(viewingMachine);
	});
	
	function getPaginatedMachines() {
		if (!clientMachines || clientMachines.length === 0) return [];
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return clientMachines.slice(start, end);
	}
	
	let totalPages = $derived(clientMachines && clientMachines.length > 0 ? Math.ceil(clientMachines.length / pageSize) : 0);
	
	let totalItems = $derived(clientMachines?.length || 0);
	
	$effect(() => {
		if (clientMachines && clientMachines.length > 0) {
			const maxPage = Math.ceil(clientMachines.length / pageSize);
			if (currentPage > maxPage) {
				currentPage = Math.max(1, maxPage);
			}
		}
	});
	
	function handleCopyMachineCreated() {
		refetch();
		refetchClientCopyMachines();
		showCreateCopyMachineModal = false;
		showEditCopyMachineModal = false;
		editingMachine = null;
	}
	
	function handleEditMachine(machine: ClientCopyMachine) {
		editingMachine = machine;
		showEditCopyMachineModal = true;
	}
	
	function handleViewMachine(machine: ClientCopyMachine) {
		viewingMachineId = machine.id;
		showViewMachineModal = true;
	}
	
	function handleDeleteMachine(machine: ClientCopyMachine) {
		machineToDelete = { id: machine.id, serial: machine.serial_number };
		showDeleteConfirmation = true;
	}
	
	function closeViewModal() {
		showViewMachineModal = false;
		viewingMachineId = null;
	}
	
	async function confirmDelete() {
		if (!machineToDelete) return;
		
		try {
			await deleteMutation.mutateAsync(machineToDelete.id);
			successToast.deleted(`Máquina ${machineToDelete.serial}`);
			refetchClientCopyMachines();
			closeDeleteConfirmation();
		} catch (err: any) {
			console.error('Error deleting machine:', err);
			if (err.response?.data?.message) {
				showError(err.response.data.message);
			} else {
				showError('Erro ao excluir máquina');
			}
		}
	}
	
	function closeDeleteConfirmation() {
		showDeleteConfirmation = false;
		machineToDelete = null;
	}
	
	function openCreateModal() {
		editingMachine = null;
		showCreateCopyMachineModal = true;
	}
	
	function closeCreateModal() {
		showCreateCopyMachineModal = false;
	}
	
	function closeEditModal() {
		showEditCopyMachineModal = false;
		editingMachine = null;
	}
	
	function goToPage(page: number) {
		const pages = totalPages;
		if (page >= 1 && page <= pages) {
			currentPage = page;
		}
	}
	
	function nextPage() {
		const pages = totalPages;
		if (currentPage < pages) {
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

	function goBack() {
		goto('/clients');
	}

	function openCreateCopyMachineModal() {
		showCreateCopyMachineModal = true;
	}

	function closeCreateCopyMachineModal() {
		showCreateCopyMachineModal = false;
	}

	function formatAddress(address: any): string {
		if (!address) return '-';
		
		const parts = [];
		
		if (address.street) {
			parts.push(address.street);
		}
		if (address.number) {
			parts.push(address.number);
		}
		
		if (address.complement) {
			parts.push(`(${address.complement})`);
		}
		
		if (address.neighborhood?.name) {
			parts.push(`- ${address.neighborhood.name}`);
		}
		
		const cityState = [];
		if (address.neighborhood?.city?.name) {
			cityState.push(address.neighborhood.city.name);
		}
		if (address.neighborhood?.city?.state?.code) {
			cityState.push(address.neighborhood.city.state.code);
		}
		if (cityState.length > 0) {
			parts.push(`- ${cityState.join('/')}`);
		}
		
		if (address.postal_code) {
			parts.push(`- CEP: ${address.postal_code}`);
		}
		
		return parts.join(' ');
	}

  
const serviceHistoryQuery = $derived(useClientServiceHistory(clientId, { limit: 5 }));
const serviceHistory = $derived(serviceHistoryQuery.data?.data ?? []);
const isLoadingServiceHistory = $derived(serviceHistoryQuery.isLoading);
</script>

<svelte:head>
	<title>Cliente {client?.name || 'Carregando...'} - Intersul</title>
</svelte:head>

{#if isLoading}
	<div class="space-y-6 px-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<Skeleton class="h-10 w-10" />
				<div>
					<Skeleton class="h-8 w-48" />
					<Skeleton class="h-4 w-32 mt-2" />
				</div>
			</div>
			<Skeleton class="h-10 w-32" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-32" />
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each Array(3) as _}
								<Skeleton class="h-4 w-full" />
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton class="h-4 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{:else if client}
	<div class="space-y-6 px-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<Button variant="ghost" size="sm" onclick={goBack}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Voltar
				</Button>
				<div>
					<h1 class="text-3xl font-bold">{client.name}</h1>
					<p class="text-muted-foreground">
						Cliente desde {formatDate(client.createdAt)}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Button onclick={openCreateModal}>
					<Printer class="w-4 h-4 mr-2" />
					Cadastrar Máquina
				</Button>
				<Button onclick={() => goto('/services/new')}>
					<Wrench class="w-4 h-4 mr-2" />
					Novo Serviço
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Informações do Cliente</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if client.email}
							<div class="flex items-center space-x-3">
								<Mail class="w-4 h-4 text-muted-foreground" />
								<span class="text-sm">{client.email}</span>
							</div>
						{/if}
						
						{#if client.phone}
							<div class="flex items-center space-x-3">
								<Phone class="w-4 h-4 text-muted-foreground" />
								<span class="text-sm">{client.phone}</span>
							</div>
						{/if}
						
						{#if client.address}
							<div class="flex items-start space-x-3">
								<MapPin class="w-4 h-4 text-muted-foreground mt-0.5" />
								<span class="text-sm">{formatAddress(client.address)}</span>
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<Printer class="w-5 h-5 mr-2" />
							Máquinas do Cliente
						</CardTitle>
						<CardDescription>
							Máquinas adquiridas pelo cliente
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if !!clientMachines?.length}
							<div class="space-y-4">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Modelo</TableHead>
											<TableHead>Fabricante</TableHead>
											<TableHead>Nº Série</TableHead>
											<TableHead>Último Serviço</TableHead>
											<TableHead>Aquisição</TableHead>
											<TableHead class="w-[100px]">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each getPaginatedMachines() as machine}
											<TableRow 
												class="hover:bg-muted/50 cursor-pointer"
												onclick={() => handleViewMachine(machine)}
											>
												<TableCell class="font-medium">{machine?.external_model || machine?.catalogCopyMachine?.model}</TableCell>
												<TableCell>{machine?.external_manufacturer || machine?.catalogCopyMachine?.manufacturer}</TableCell>
												<TableCell>{machine?.serial_number}</TableCell>
												<!-- TODO: Add last service date -->
												<TableCell>{formatDate(machine.createdAt)}</TableCell>
												<TableCell>
													<Badge variant="secondary">
														{ACQUISITION_TYPE[machine?.acquisition_type]?.label || machine?.acquisition_type}
													</Badge>
												</TableCell>
												<TableCell onclick={(e) => e.stopPropagation()}>
													<DropdownMenu.Root>
														<DropdownMenu.Trigger>
															<Button variant="ghost" size="sm">
																<MoreVertical class="w-4 h-4" />
															</Button>
														</DropdownMenu.Trigger>
														<DropdownMenu.Content>
															<DropdownMenu.Item onclick={() => handleEditMachine(machine)}>
																<Edit class="w-4 h-4 mr-2" />
																Editar
															</DropdownMenu.Item>
															<DropdownMenu.Separator />
															<DropdownMenu.Item onclick={() => handleDeleteMachine(machine)} class="text-red-600">
																<Trash2 class="w-4 h-4 mr-2" />
																Excluir
															</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Root>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
								
								{#if totalItems > 0}
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
								{/if}
							</div>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<Printer class="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p class="text-lg font-medium">Nenhuma máquina associada</p>
								<p class="text-sm">Este cliente ainda não possui máquinas cadastradas</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<Wrench class="w-5 h-5 mr-2" />
							Histórico de Serviços
						</CardTitle>
						<CardDescription>
							Últimos serviços realizados para este cliente
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if isLoadingServiceHistory}
							<div class="space-y-4">
								{#each Array(3) as _}
									<div class="flex items-start space-x-3 p-4 border rounded-lg">
										<div class="flex-shrink-0">
											<Skeleton class="w-8 h-8 rounded-full" />
										</div>
										<div class="flex-1 space-y-2">
											<Skeleton class="h-4 w-1/2" />
											<Skeleton class="h-4 w-1/3" />
											<Skeleton class="h-3 w-1/4" />
										</div>
									</div>
								{/each}
							</div>
						{:else if serviceHistory.length > 0}
							<div class="space-y-4">
								{#each serviceHistory as service}
									<div class="flex items-start space-x-3 p-4 border rounded-lg">
										<div class="flex-shrink-0">
											<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
												<Wrench class="w-4 h-4 text-primary" />
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<h4 class="font-medium">{service.description || service.category?.name || `Serviço #${service.id}`}</h4>
												<Badge variant={getServiceStatusVariant(service.status)}>
													{getServiceStatusLabel(service.status)}
												</Badge>
											</div>
											<p class="text-sm text-muted-foreground mt-1">
												{service.description || 'Sem descrição'}
											</p>
											<div class="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
												<div class="flex items-center space-x-1">
													<Calendar class="w-3 h-3" />
													<span>{service.created_at ? formatDate(service.created_at) : 'Sem data'}</span>
												</div>
												{#if service.clientCopyMachine}
													<div class="flex items-center space-x-1">
														<Printer class="w-3 h-3" />
														<span>{service.clientCopyMachine.catalogCopyMachine?.model || service.clientCopyMachine.external_model || 'Máquina'}</span>
													</div>
												{/if}
											</div>
										</div>
										<Button variant="ghost" size="sm" onclick={() => goto(`/services/${service.id}`)}>
											Ver Detalhes
										</Button>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<Wrench class="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p class="text-lg font-medium">Nenhum serviço realizado</p>
								<p class="text-sm">Este cliente ainda não possui histórico de serviços</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Estatísticas</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Total de Máquinas</span>
							<span class="text-2xl font-bold">{clientMachines?.length}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Serviços Realizados</span>
							<span class="text-2xl font-bold">{serviceHistory?.length || 0}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Último Serviço</span>
							<span class="text-sm text-muted-foreground">
								{serviceHistory.length > 0
									? formatDate(serviceHistory[0].created_at || serviceHistory[0].createdAt || '')
									: 'N/A'}
							</span>
						</div>
					</CardContent>
				</Card>

			</div>
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<div class="text-muted-foreground">
			<p class="text-lg font-medium">Cliente não encontrado</p>
			<p class="text-sm">O cliente solicitado não existe ou foi removido.</p>
			<Button variant="outline" class="mt-4" onclick={goBack}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar aos Clientes
			</Button>
		</div>
	</div>
{/if}

<CopyMachineFormDialog 
	bind:open={showCreateCopyMachineModal} 
	clientId={clientId}
	machine={undefined}
	onSuccess={handleCopyMachineCreated}
/>

<CopyMachineFormDialog 
	bind:open={showEditCopyMachineModal} 
	clientId={clientId}
	machine={editingMachine}
	onSuccess={handleCopyMachineCreated}
/>

<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Máquina"
	description="Tem certeza que deseja excluir a máquina com número de série '{machineToDelete?.serial}'? Esta ação não pode ser desfeita."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={deleteMutation.isPending}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirmation}
/>

<Sheet bind:open={showViewMachineModal}>
	<SheetContent class="sm:max-w-[700px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle class="flex items-center gap-2">
				<Printer class="w-5 h-5" />
				Informações da Máquina
			</SheetTitle>
			<SheetDescription>
				Detalhes completos da máquina copiadora
			</SheetDescription>
		</SheetHeader>

		{#if viewingMachine}
			<div class="space-y-6 px-6 pb-6 mt-6">
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Informações Básicas</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground">Número de Série</Label>
								<p class="text-sm font-medium">{viewingMachine.serial_number}</p>
							</div>
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground">Tipo de Aquisição</Label>
								<div>
									<Badge variant="secondary">
										{ACQUISITION_TYPE[viewingMachine.acquisition_type]?.label || viewingMachine.acquisition_type}
									</Badge>
								</div>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground">Fabricante</Label>
								<p class="text-sm font-medium">
									{viewingMachine.external_manufacturer || viewingMachine.catalogCopyMachine?.manufacturer || '-'}
								</p>
							</div>
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground">Modelo</Label>
								<p class="text-sm font-medium">
									{viewingMachine.external_model || viewingMachine.catalogCopyMachine?.model || '-'}
								</p>
							</div>
						</div>

						{#if viewingMachine.external_description}
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground">Descrição</Label>
								<p class="text-sm">{viewingMachine.external_description}</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				{#if viewingMachine.catalogCopyMachine}
					<Card>
						<CardHeader>
							<CardTitle class="text-lg">Informações do Catálogo</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if viewingMachine.catalogCopyMachine.description}
								<div class="space-y-1">
									<Label class="text-sm text-muted-foreground">Descrição</Label>
									<p class="text-sm">{viewingMachine.catalogCopyMachine.description}</p>
								</div>
							{/if}

							{#if viewingMachine.catalogCopyMachine.features && viewingMachine.catalogCopyMachine.features.length > 0}
								<div class="space-y-2">
									<Label class="text-sm text-muted-foreground">Características</Label>
									<div class="flex flex-wrap gap-2">
										{#each viewingMachine.catalogCopyMachine.features as feature}
											<Badge variant="outline" class="text-xs">{feature}</Badge>
										{/each}
									</div>
								</div>
							{/if}

							{#if viewingMachine.catalogCopyMachine.price != null}
								<div class="space-y-1">
									<Label class="text-sm text-muted-foreground">Preço do Catálogo</Label>
									<p class="text-sm font-medium">{formatCurrency(viewingMachine.catalogCopyMachine.price)}</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}

				{#if viewingMachine.acquisition_type !== AcquisitionType.OWNED}
					<Card>
						<CardHeader>
							<CardTitle class="text-lg">Detalhes da Aquisição</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if viewingMachine.acquisition_type === AcquisitionType.SOLD && viewingMachine.value != null}
								<div class="space-y-1">
									<Label class="text-sm text-muted-foreground flex items-center gap-2">
										<DollarSign class="w-4 h-4" />
										Valor da Venda
									</Label>
									<p class="text-lg font-bold text-green-600">{formatCurrency(viewingMachine.value)}</p>
								</div>
							{/if}

							{#if viewingMachine.acquisition_type === AcquisitionType.RENT}
								{#if viewingMachine.franchise}
									<div class="space-y-3">
										<Label class="text-sm text-muted-foreground">Plano de Franquia</Label>
										<div class="space-y-2 p-4 border rounded-lg bg-muted/50">
											<div class="grid grid-cols-2 gap-4 text-sm">
												<div>
													<span class="text-muted-foreground">Período:</span>
													<p class="font-medium">{viewingMachine.franchise.period}</p>
												</div>
												<div>
													<span class="text-muted-foreground">Tipo de Papel:</span>
													<p class="font-medium">{viewingMachine.franchise.paper_type}</p>
												</div>
												<div>
													<span class="text-muted-foreground">Cor:</span>
													<p class="font-medium">{viewingMachine.franchise.color ? 'Colorida' : 'Preto e Branco'}</p>
												</div>
												<div>
													<span class="text-muted-foreground">Quantidade:</span>
													<p class="font-medium">{viewingMachine.franchise.quantity} cópias</p>
												</div>
												<div class="col-span-2">
													<span class="text-muted-foreground">Preço Unitário:</span>
													<p class="font-medium">{formatCurrency(viewingMachine.franchise.unitPrice)}</p>
												</div>
											</div>
										</div>
									</div>
								{:else}
									<div class="p-4 border rounded-lg bg-muted/50">
										<p class="text-sm text-muted-foreground">
											Nenhum plano de franquia associado a esta máquina alugada.
										</p>
									</div>
								{/if}
							{/if}
						</CardContent>
					</Card>
				{/if}
				<Card>
					<CardHeader>
						<CardTitle class="text-lg flex items-center gap-2">
							<History class="w-5 h-5" />
							Histórico de Serviços
						</CardTitle>
					</CardHeader>
					<CardContent>
						{#if isLoadingViewingMachine || isLoadingMachineServices}
							<div class="space-y-3">
								{#each Array(3) as _}
									<Skeleton class="h-16 w-full" />
								{/each}
							</div>
						{:else if machineServices && machineServices.length > 0}
							<div class="space-y-3">
								{#each machineServices as service}
									<div class="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-2">
												<div class="flex items-center gap-2">
													<Wrench class="w-4 h-4 text-muted-foreground" />
													<h4 class="font-medium text-sm">
														{service.description || service.category?.name || `Serviço #${service.id}`}
													</h4>
												</div>
												{#if service.description}
													<p class="text-sm text-muted-foreground line-clamp-2">
														{service.description}
													</p>
												{/if}
												<div class="flex items-center gap-4 text-xs text-muted-foreground">
													<div class="flex items-center gap-1">
														<Calendar class="w-3 h-3" />
														<span>{formatDate(service.createdAt)}</span>
													</div>
													{#if service.category}
														<div class="flex items-center gap-1">
															<span>•</span>
															<span>{service.category.name}</span>
														</div>
													{/if}
												</div>
											</div>
											<div class="flex items-center gap-2">
												<Badge variant={getServiceStatusVariant(service.status)}>
													{getServiceStatusLabel(service.status)}
												</Badge>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8">
								<Clock class="w-12 h-12 mx-auto text-muted-foreground mb-3" />
								<p class="text-sm text-muted-foreground font-medium">
									Nenhum serviço registrado ainda
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									O histórico de serviços aparecerá aqui quando houver serviços associados a esta máquina.
								</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Datas</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-1">
								<Label class="text-sm text-muted-foreground flex items-center gap-2">
									<Calendar class="w-4 h-4" />
									Data de Cadastro
								</Label>
								<p class="text-sm">{formatDate(viewingMachine.createdAt)}</p>
							</div>
							{#if viewingMachine.updatedAt && viewingMachine.updatedAt !== viewingMachine.createdAt}
								<div class="space-y-1">
									<Label class="text-sm text-muted-foreground flex items-center gap-2">
										<Calendar class="w-4 h-4" />
										Última Atualização
									</Label>
									<p class="text-sm">{formatDate(viewingMachine.updatedAt)}</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<div class="flex justify-end gap-2 pt-4 border-t">
					<Button variant="outline" onclick={closeViewModal}>
						Fechar
					</Button>
					{#if viewingMachine}
						<Button onclick={() => { 
							if (viewingMachine) {
								closeViewModal(); 
								handleEditMachine(viewingMachine); 
							}
						}}>
							<Edit class="w-4 h-4 mr-2" />
							Editar
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</SheetContent>
</Sheet>
