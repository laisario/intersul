<script lang="ts">
	import { useServices, useDeleteService } from "$lib/hooks/queries/use-services.svelte.js";
	import { useCategories, useDeleteCategory } from "$lib/hooks/queries/use-categories.svelte.js";
	import { useClients } from "$lib/hooks/queries/use-clients.svelte.js";
	import { formatDate } from "$lib/utils/formatting.js";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table/index.js";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs/index.js";
	import { Select, SelectTrigger, SelectContent, SelectItem } from "$lib/components/ui/select/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Plus, Edit, Trash2, Wrench, FolderOpen, MoreVertical } from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import type { Service } from "$lib/api/types/service.types.js";
	import type { Category } from "$lib/api/types/service.types.js";
	import type { ServiceQueryParams } from "$lib/api/types/service.types.js";
	import type { City } from "$lib/api/types/address.types.js";
	import ConfirmationDialog from "$lib/components/confirmation-dialog.svelte";
	import CategoryFormDialog from "$lib/components/category-form-dialog.svelte";
	import CategoryPreviewDialog from "$lib/components/category-preview-dialog.svelte";
	import ServiceFormDialog from "$lib/components/service-form-dialog.svelte";
	import PaginationControls from "$lib/components/pagination-controls.svelte";
	import { showError, successToast } from "$lib/utils/toast.js";
	import { ACQUISITION_TYPE, PAGINATION, SERVICE_STATUS, SERVICE_PRIORITY, getServiceStatusLabel, getServiceStatusVariant } from "$lib/utils/constants.js";
	import type { AcquisitionType } from "$lib/api/types/copy-machine.types.js";
	import { goto } from "$app/navigation";
	import { canManageServices } from "$lib/stores/auth.svelte";

	// Services
	let serviceFilters = $state<ServiceQueryParams>({ page: 1, limit: PAGINATION.DEFAULT_PAGE_SIZE });
	const servicesQuery = useServices(() => serviceFilters);
	const servicesResponse = $derived(servicesQuery.data);
	const services = $derived(servicesResponse?.data ?? []);
	const totalServices = $derived(servicesResponse?.total ?? 0);
	const totalPages = $derived(servicesResponse?.totalPages ?? 1);
	const currentPage = $derived(serviceFilters.page ?? 1);
	const pageSize = $derived(serviceFilters.limit ?? PAGINATION.DEFAULT_PAGE_SIZE);
	const isLoadingServices = $derived(servicesQuery.isLoading);
	const isFetchingServices = $derived(servicesQuery.isFetching);
	
	// Categories
	const categoriesQuery = useCategories();
	const categories = $derived(categoriesQuery.data ?? []);
	const isLoadingCategories = $derived(categoriesQuery.isLoading);

	// Clients (for city filters)
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

	const acquisitionOptions = $derived(
		Object.entries(ACQUISITION_TYPE).map(([value, info]) => ({
			value: value as AcquisitionType,
			label: info.label
		}))
	);

	const selectedCategoryFilter = $derived(
		serviceFilters.category_id ? serviceFilters.category_id.toString() : ''
	);
	const selectedCityFilter = $derived(
		serviceFilters.city_id ? serviceFilters.city_id.toString() : ''
	);
	const selectedAcquisitionFilter = $derived(serviceFilters.acquisition_type ?? '');
	const selectedAcquisitionLabel = $derived(
		selectedAcquisitionFilter
			? ACQUISITION_TYPE[selectedAcquisitionFilter as AcquisitionType]?.label ?? 'Tipo'
			: 'Todos os tipos'
	);
	const pageSizeOptions = $derived([...(PAGINATION.PAGE_SIZE_OPTIONS ?? [10, 25, 50, 100])]);
	
	// Delete mutations
	const deleteServiceMutation = useDeleteService();
	const deleteCategoryMutation = useDeleteCategory();
	
	// Active tab
	let activeTab = $state('services');
	
	// Category form dialog
	let showCategoryFormDialog = $state(false);
	let editingCategory = $state<Category | null>(null);
	let showCategoryPreviewDialog = $state(false);
	let previewCategory = $state<Category | null>(null);

// Service form dialog
let showServiceFormDialog = $state(false);
let editingService = $state<Service | null>(null);
let editingServiceId = $state<number | null>(null);

// Permissions
let userCanManageServices = $state(false);
$effect(() => {
	const unsubscribe = canManageServices.subscribe((value) => {
		userCanManageServices = !!value;
	});
	return unsubscribe;
});

$effect(() => {
	if (!showServiceFormDialog) {
		editingService = null;
		editingServiceId = null;
	}
});
	
	// Delete confirmation states
	let showDeleteServiceConfirmation = $state(false);
	let serviceToDelete = $state<{ id: number; description: string } | null>(null);
	
	let showDeleteCategoryConfirmation = $state(false);
	let categoryToDelete = $state<{ id: number; name: string } | null>(null);

	function updateServiceFilters(
		newFilters: Partial<ServiceQueryParams>,
		options: { resetPage?: boolean } = {}
	) {
		const { resetPage = false } = options;
		const nextFilters = { ...serviceFilters, ...newFilters };

		serviceFilters = {
			...nextFilters,
			page: resetPage ? 1 : nextFilters.page ?? 1
		};
	}

	function resetServiceFilters() {
		serviceFilters = { page: 1, limit: PAGINATION.DEFAULT_PAGE_SIZE };
	}

	function handlePageChange(page: number) {
		const maxPage = servicesResponse?.totalPages ?? 1;
		if (page < 1 || page > maxPage) return;
		updateServiceFilters({ page }, { resetPage: false });
	}

	function nextPage() {
		handlePageChange(currentPage + 1);
	}

	function previousPage() {
		handlePageChange(currentPage - 1);
	}

	function handlePageSizeChange(size: number) {
		updateServiceFilters({ limit: size, page: 1 }, { resetPage: false });
	}

	function handleRowClick(serviceId: number) {
		goto(`/services/${serviceId}`);
	}

	function handleDeleteService(service: Service) {
		serviceToDelete = { id: service.id, description: service.description || `Serviço #${service.id}` };
		showDeleteServiceConfirmation = true;
	}

function handleCreateService() {
	editingService = null;
	editingServiceId = null;
	showServiceFormDialog = true;
}

function handleEditService(service: Service) {
	editingService = service;
	editingServiceId = service.id;
	showServiceFormDialog = true;
}

	function handleServiceSuccess() {
	showServiceFormDialog = false;
	editingService = null;
	editingServiceId = null;
	servicesQuery.refetch();
}

	async function confirmDeleteService() {
		if (!serviceToDelete) return;
		
		try {
			await deleteServiceMutation.mutateAsync(serviceToDelete.id);
			successToast.deleted('serviço');
			showDeleteServiceConfirmation = false;
			serviceToDelete = null;
		servicesQuery.refetch();
		} catch (error) {
			showError('Erro ao excluir serviço');
		}
	}

	function handleCreateCategory() {
		editingCategory = null;
		showCategoryFormDialog = true;
	}

	function handleEditCategory(category: Category) {
		editingCategory = category;
		showCategoryFormDialog = true;
	}

	function handleCategorySuccess() {
		showCategoryFormDialog = false;
		editingCategory = null;
		categoriesQuery.refetch();
	}

	function handleDeleteCategory(category: Category) {
		categoryToDelete = { id: category.id, name: category.name };
		showDeleteCategoryConfirmation = true;
	}

	function handlePreviewCategory(category: Category) {
		previewCategory = category;
		showCategoryPreviewDialog = true;
	}

	async function confirmDeleteCategory() {
		if (!categoryToDelete) return;
		
		try {
			await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
			successToast.deleted('categoria');
			showDeleteCategoryConfirmation = false;
			categoryToDelete = null;
		} catch (error: any) {
			const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao excluir categoria';
			showError(errorMessage);
		}
	}
</script>

<div class="flex flex-1 flex-col">
	<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
		<div class="px-4 lg:px-6">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
				Serviços e Categorias
			</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
				Gerencie seus serviços e categorias de serviços
			</p>
		</div>
		
		<Tabs bind:value={activeTab} class="px-4 lg:px-6">
			<TabsList>
				<TabsTrigger value="services">
					<Wrench class="w-4 h-4 mr-2" />
					Serviços
				</TabsTrigger>
				{#if userCanManageServices}
					<TabsTrigger value="categories">
						<FolderOpen class="w-4 h-4 mr-2" />
						Categorias
					</TabsTrigger>
				{/if}
			</TabsList>
			
			<!-- Services Tab -->
			<TabsContent value="services" class="mt-6">
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>Lista de Serviços</CardTitle>
								<CardDescription>
									Gerencie todos os serviços do sistema
								</CardDescription>
							</div>
							{#if userCanManageServices}
								<Button onclick={handleCreateService}>
									<Plus class="w-4 h-4 mr-2" />
									Novo Serviço
								</Button>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<div class="flex flex-col gap-4 mb-6">
							<div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
								<div class="flex flex-col gap-2 col-span-2 md:col-span-1">
									<Label>Categoria</Label>
									<Select
										type="single"
										value={selectedCategoryFilter}
										onValueChange={(value: string) =>
											updateServiceFilters(
												{
													category_id: value ? parseInt(value) : undefined
												},
												{ resetPage: true }
											)
										}
									>
										<SelectTrigger>
											{#if !selectedCategoryFilter}
												Todas as categorias
											{:else}
												{categories.find((category) => category.id.toString() === selectedCategoryFilter)?.name || 'Categoria'}
											{/if}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Todas as categorias</SelectItem>
											{#if isLoadingCategories}
												<SelectItem value="" disabled>Carregando...</SelectItem>
											{:else}
												{#each categories as category (category.id)}
													<SelectItem value={category.id.toString()}>{category.name}</SelectItem>
												{/each}
											{/if}
										</SelectContent>
									</Select>
								</div>
	
								<div class="flex flex-col gap-2 col-span-2 md:col-span-1">
									<Label>Cidade</Label>
									<Select
										type="single"
										value={selectedCityFilter}
										onValueChange={(value: string) =>
											updateServiceFilters(
												{
													city_id: value ? parseInt(value) : undefined
												},
												{ resetPage: true }
											)
										}
									>
										<SelectTrigger>
											{#if !selectedCityFilter}
												Todas as cidades
											{:else}
												{cityOptions.find((option) => option.id.toString() === selectedCityFilter)?.label || 'Cidade'}
											{/if}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Todas as cidades</SelectItem>
											{#if clientsQuery.isLoading}
												<SelectItem value="" disabled>Carregando...</SelectItem>
											{:else if !cityOptions.length}
												<SelectItem value="" disabled>Nenhuma cidade disponível</SelectItem>
											{:else}
												{#each cityOptions as option (option.id)}
													<SelectItem value={option.id.toString()}>{option.label}</SelectItem>
												{/each}
											{/if}
										</SelectContent>
									</Select>
								</div>
	
								<div class="flex flex-col gap-2 col-span-2 md:col-span-1">
									<Label>Tipo de aquisição</Label>
									<Select
										type="single"
										value={selectedAcquisitionFilter}
										onValueChange={(value: string) =>
											updateServiceFilters(
												{
													acquisition_type: value ? (value as AcquisitionType) : undefined
												},
												{ resetPage: true }
											)
										}
									>
										<SelectTrigger>
											{selectedAcquisitionLabel}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Todos os tipos</SelectItem>
											{#each acquisitionOptions as option (option.value)}
												<SelectItem value={option.value}>{option.label}</SelectItem>
											{/each}
										</SelectContent>
									</Select>
								</div>

								<div class="flex items-end justify-end gap-2 col-span-2 md:col-span-1">
									<Button type="button" variant="outline" size="sm" onclick={resetServiceFilters} class="w-full md:w-auto">
										Limpar filtros
									</Button>
									{#if isFetchingServices}
										<Skeleton class="h-8 w-16" />
									{/if}
								</div>
							</div>
						</div>

						{#if isLoadingServices}
							<div class="space-y-3">
								{#each Array(5) as _}
									<Skeleton class="h-16 w-full" />
								{/each}
							</div>
						{:else if services.length === 0}
							<div class="text-center py-12">
								<Wrench class="w-12 h-12 mx-auto text-muted-foreground mb-3" />
								<p class="text-sm text-muted-foreground font-medium">
									Nenhum serviço encontrado
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									Crie seu primeiro serviço para começar
								</p>
							</div>
						{:else}
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Cliente</TableHead>
										<TableHead>Cidade</TableHead>
										<TableHead>Categoria</TableHead>
										<TableHead>Prioridade</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Data de Criação</TableHead>
										{#if userCanManageServices}
											<TableHead class="w-[100px] text-center">Ações</TableHead>
										{/if}
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each services as service}
										<TableRow
											class="hover:bg-muted/50 cursor-pointer"
											onclick={() => handleRowClick(service.id)}
										>
											<TableCell class="font-medium">#{service.id}</TableCell>
											<TableCell>{service.client?.name || '-'}</TableCell>
											<TableCell class="font-medium">
												{service?.client?.address?.neighborhood?.city?.name || '-'}
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{service?.category?.name || '-'}
												</Badge>
											</TableCell>
											<TableCell>
												{#if service.priority}
													<Badge 
														variant={
															service.priority === 'URGENT' || service.priority === 'urgent' ? 'destructive' :
															service.priority === 'HIGH' || service.priority === 'high' ? 'default' :
															service.priority === 'MEDIUM' || service.priority === 'medium' ? 'secondary' :
															'outline'
														}
													>
														{SERVICE_PRIORITY[service.priority.toUpperCase() as keyof typeof SERVICE_PRIORITY]?.label || service.priority}
													</Badge>
												{:else}
													<span class="text-muted-foreground text-sm">-</span>
												{/if}
											</TableCell>
											<TableCell>
												{#if service.status}
													<Badge variant={getServiceStatusVariant(service.status)}>
														{getServiceStatusLabel(service.status)}
													</Badge>
												{:else}
													<span class="text-muted-foreground text-sm">-</span>
												{/if}
											</TableCell>
											<TableCell>{formatDate(service.created_at)}</TableCell>
											{#if userCanManageServices}
												<TableCell>
													<div class="flex items-center justify-center">
														<DropdownMenu.Root>
															<DropdownMenu.Trigger>
																<Button variant="ghost" size="sm" class="px-2">
																	<MoreVertical class="w-4 h-4" />
																</Button>
															</DropdownMenu.Trigger>
															<DropdownMenu.Content align="end">
																<DropdownMenu.Item onclick={(event) => {
																	event.stopPropagation();
																	handleEditService(service);
																}}>
																	<Edit class="w-4 h-4 mr-2" />
																	Editar
																</DropdownMenu.Item>
																<DropdownMenu.Separator />
																<DropdownMenu.Item
																	variant="destructive"
																	onclick={(event) => {
																		event.stopPropagation();
																		handleDeleteService(service);
																	}}
																	disabled={deleteServiceMutation.isPending}
																>
																	<Trash2 class="w-4 h-4 mr-2" />
																	Excluir
																</DropdownMenu.Item>
															</DropdownMenu.Content>
														</DropdownMenu.Root>
													</div>
												</TableCell>
											{/if}
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						{/if}
					</CardContent>
				</Card>

				<PaginationControls
					page={currentPage}
					totalPages={totalPages}
					totalItems={totalServices}
					pageSize={pageSize}
					label="serviços"
					pageSizeOptions={pageSizeOptions}
					onPrevious={() => previousPage()}
					onNext={() => nextPage()}
					onSelectPage={(page) => handlePageChange(page)}
					onPageSizeChange={(size) => handlePageSizeChange(size)}
				/>
			</TabsContent>
			
			{#if userCanManageServices}
				<!-- Categories Tab -->
				<TabsContent value="categories" class="mt-6">
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between">
								<div>
									<CardTitle>Lista de Categorias</CardTitle>
									<CardDescription>
										Gerencie as categorias de serviços e suas etapas template
									</CardDescription>
								</div>
								<Button onclick={handleCreateCategory}>
									<Plus class="w-4 h-4 mr-2" />
									Nova Categoria
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{#if isLoadingCategories}
								<div class="space-y-3">
									{#each Array(5) as _}
										<Skeleton class="h-16 w-full" />
									{/each}
								</div>
							{:else if categories.length === 0}
								<div class="text-center py-12">
									<FolderOpen class="w-12 h-12 mx-auto text-muted-foreground mb-3" />
									<p class="text-sm text-muted-foreground font-medium">
										Nenhuma categoria encontrada
									</p>
									<p class="text-xs text-muted-foreground mt-1">
										Crie sua primeira categoria para começar
									</p>
								</div>
							{:else}
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Nome</TableHead>
											<TableHead>Descrição</TableHead>
											<TableHead>Etapas</TableHead>
											<TableHead>Data de Criação</TableHead>
											<TableHead class="w-[100px]">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each categories as category}
											<TableRow
												class="hover:bg-muted/50 cursor-pointer"
												onclick={() => handlePreviewCategory(category)}
											>
												<TableCell class="font-medium">{category.name}</TableCell>
												<TableCell class="text-muted-foreground">
													{category.description || '-'}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{category.steps?.length || 0} {category.steps?.length === 1 ? 'etapa' : 'etapas'}
													</Badge>
												</TableCell>
												<TableCell>{formatDate(category.createdAt)}</TableCell>
												<TableCell>
													<div class="flex items-center gap-2">
														<Button
															variant="ghost" 
															size="sm"
															onclick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
														>
															<Edit class="w-4 h-4" />
														</Button>
														<Button
															variant="ghost" 
															size="sm"
															onclick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
														>
															<Trash2 class="w-4 h-4 text-red-600" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>
			{/if}
		</Tabs>
	</div>
</div>

{#if userCanManageServices}
	<!-- Delete Service Confirmation -->
	<ConfirmationDialog
		bind:open={showDeleteServiceConfirmation}
		title="Excluir Serviço"
		description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
		confirmText="Excluir"
		cancelText="Cancelar"
		variant="destructive"
		icon="trash"
		loading={deleteServiceMutation.isPending}
		onConfirm={confirmDeleteService}
		onCancel={() => {
			showDeleteServiceConfirmation = false;
			serviceToDelete = null;
		}}
	/>

	<!-- Service Form Dialog -->
	<ServiceFormDialog
		bind:open={showServiceFormDialog}
		service={editingService}
		serviceId={editingServiceId}
		onSuccess={handleServiceSuccess}
	/>

	<!-- Category Form Dialog -->
	<CategoryFormDialog
		bind:open={showCategoryFormDialog}
		category={editingCategory}
		onSuccess={handleCategorySuccess}
	/>

	<!-- Category Preview Dialog -->
	<CategoryPreviewDialog
		bind:open={showCategoryPreviewDialog}
		category={previewCategory}
		onClose={() => {
			showCategoryPreviewDialog = false;
			previewCategory = null;
		}}
	/>
{/if}

<!-- Delete Category Confirmation -->
<ConfirmationDialog
	bind:open={showDeleteCategoryConfirmation}
	title="Excluir Categoria"
	description="Tem certeza que deseja excluir a categoria '{categoryToDelete?.name}'? Esta ação não pode ser desfeita e pode afetar os serviços associados."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={deleteCategoryMutation.isPending}
	onConfirm={confirmDeleteCategory}
	onCancel={() => {
		showDeleteCategoryConfirmation = false;
		categoryToDelete = null;
	}}
/>
