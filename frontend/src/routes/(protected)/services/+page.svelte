<script lang="ts">
	import { onDestroy } from "svelte";
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
	import { Popover } from "bits-ui";
	import { Plus, Edit, Trash2, Wrench, FolderOpen, MoreVertical, ListFilter } from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import type { Service } from "$lib/api/types/service.types.js";
	import type { Category } from "$lib/api/types/service.types.js";
	import type { ServiceQueryParams } from "$lib/api/types/service.types.js";
	import type { City } from "$lib/api/types/address.types.js";
	import ConfirmationDialog from "$lib/components/confirmation-dialog.svelte";
	import CategoryFormDialog from "$lib/components/category-form-dialog.svelte";
	import CategoryPreviewDialog from "$lib/components/category-preview-dialog.svelte";
	import ServiceFormDialog from "$lib/components/service-form-dialog.svelte";
	import ServiceStepsOverviewPopover from "$lib/components/service-steps-overview-popover.svelte";
	import PaginationControls from "$lib/components/pagination-controls.svelte";
	import { showError, successToast } from "$lib/utils/toast.js";
	import { Input } from "$lib/components/ui/input/index.js";
    import {
		ACQUISITION_TYPE,
		PAGINATION,
		getServicePriorityLabel,
		getServicePriorityVariant,
	} from "$lib/utils/constants.js";
	import type { AcquisitionType } from "$lib/api/types/copy-machine.types.js";
	import { goto } from "$app/navigation";
	import { canManageServices } from "$lib/stores/auth.svelte";

	/** Preview length in the table; longer text opens a popover on click. */
	const DESCRIPTION_TABLE_PREVIEW_MAX = 28;

	function serviceDescriptionPreview(text: string): { preview: string; isTruncated: boolean } {
		const d = text.trim();
		if (d.length <= DESCRIPTION_TABLE_PREVIEW_MAX) {
			return { preview: d, isTruncated: false };
		}
		return {
			preview: `${d.slice(0, DESCRIPTION_TABLE_PREVIEW_MAX)}...`,
			isTruncated: true,
		};
	}

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
		serviceFilters.categoryId ? serviceFilters.categoryId.toString() : ''
	);
	const selectedCityFilter = $derived(
		serviceFilters.cityId ? serviceFilters.cityId.toString() : ''
	);
	const selectedAcquisitionFilter = $derived(serviceFilters.acquisitionType ?? '');
	const selectedAcquisitionLabel = $derived(
		selectedAcquisitionFilter
			? ACQUISITION_TYPE[selectedAcquisitionFilter as AcquisitionType]?.label ?? 'Tipo'
			: 'Todos os tipos'
	);
	const hasClientSearch = $derived(Boolean(serviceFilters.search?.trim()));
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
		clientSearchInput = "";
		if (clientSearchDebounce) {
			clearTimeout(clientSearchDebounce);
			clientSearchDebounce = null;
		}
		serviceFilters = { page: 1, limit: PAGINATION.DEFAULT_PAGE_SIZE };
	}

	/** Local input value; debounced into serviceFilters.search */
	let clientSearchInput = $state("");
	let clientSearchDebounce: ReturnType<typeof setTimeout> | null = null;

	function scheduleClientSearchCommit() {
		if (clientSearchDebounce) clearTimeout(clientSearchDebounce);
		clientSearchDebounce = setTimeout(() => {
			clientSearchDebounce = null;
			const q = clientSearchInput.trim();
			updateServiceFilters(
				{
					search: q || undefined,
				},
				{ resetPage: true }
			);
		}, 300);
	}

	function onClientSearchInput(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		clientSearchInput = v;
		scheduleClientSearchCommit();
	}

	const sortOptionValue = $derived.by(() => {
		const sb = serviceFilters.sortBy ?? "created_at";
		const so = serviceFilters.sortOrder ?? "desc";
		return `${sb}:${so}`;
	});

	const sortOptions = [
		{ value: "created_at:desc", label: "Data (mais recentes)" },
		{ value: "created_at:asc", label: "Data (mais antigos)" },
		{ value: "priority:asc", label: "Prioridade (A → Z)" },
		{ value: "priority:desc", label: "Prioridade (Z → A)" },
		{ value: "status:asc", label: "Status (A → Z)" },
		{ value: "status:desc", label: "Status (Z → A)" },
	] as const;

	function onSortChange(value: string) {
		const [sortBy, sortOrder] = value.split(":") as ["priority" | "status" | "created_at", "asc" | "desc"];
		updateServiceFilters({ sortBy, sortOrder }, { resetPage: true });
	}

	/** Separate open-state per layout: portals escape CSS, so sharing state causes both to open. */
	let mobileStatusPopoverId = $state<number | null>(null);
	let desktopStatusPopoverId = $state<number | null>(null);

	/** On small screens filters are collapsed until the user opens them. */
	let mobileServicesFiltersOpen = $state(false);

	function uniqueStepResponsibleNames(service: Service): string {
		const steps = service.steps ?? [];
		const names = new Set<string>();
		for (const s of steps) {
			const n = s.responsable?.name?.trim();
			if (n) names.add(n);
		}
		if (names.size === 0) return "";
		return [...names].sort((a, b) => a.localeCompare(b, "pt-BR")).join(", ");
	}

	onDestroy(() => {
		if (clientSearchDebounce) clearTimeout(clientSearchDebounce);
	});

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
						<div class="flex items-center justify-between gap-4 md:gap-2">
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
						<div class="mb-6 flex flex-col gap-4">
							<div class="flex md:hidden">
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="w-full justify-center gap-2"
									aria-expanded={mobileServicesFiltersOpen}
									aria-controls="services-filters-panel"
									onclick={() => (mobileServicesFiltersOpen = !mobileServicesFiltersOpen)}
								>
									<ListFilter class="h-4 w-4 shrink-0" />
									{mobileServicesFiltersOpen ? "Fechar filtros" : "Abrir filtros"}
								</Button>
							</div>

							<div
								id="services-filters-panel"
								class="flex-col gap-4 {mobileServicesFiltersOpen ? 'flex' : 'hidden md:flex'}"
							>
								<div
									class="flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-4"
								>
								<!-- Busca por cliente (primeiro) -->
								<div class="flex w-full min-w-0 flex-col gap-2 xl:max-w-sm xl:shrink-0">
									<Label for="service-client-search">Buscar por cliente</Label>
									<Input
										id="service-client-search"
										type="search"
										placeholder="Nome do cliente…"
										value={clientSearchInput}
										oninput={onClientSearchInput}
										autocomplete="off"
									/>
									{#if hasClientSearch}
										<p class="text-xs text-muted-foreground">
											Ordenação manual desativada: resultados ordenados por nome do cliente e data.
										</p>
									{/if}
								</div>

								<!-- Demais filtros agrupados -->
								<div
									class="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
								>
									<div class="flex flex-col gap-2">
										<Label>Categoria</Label>
										<Select
											type="single"
											value={selectedCategoryFilter}
											onValueChange={(value: string) =>
												updateServiceFilters(
													{
														categoryId: value ? parseInt(value) : undefined
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

									<div class="flex flex-col gap-2">
										<Label>Cidade</Label>
										<Select
											type="single"
											value={selectedCityFilter}
											onValueChange={(value: string) =>
												updateServiceFilters(
													{
														cityId: value ? parseInt(value) : undefined
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

									<div class="flex flex-col gap-2">
										<Label>Tipo de aquisição</Label>
										<Select
											type="single"
											value={selectedAcquisitionFilter}
											onValueChange={(value: string) =>
												updateServiceFilters(
													{
														acquisitionType: value ? (value as AcquisitionType) : undefined
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

									<div class="flex flex-col gap-2">
										<Label>Ordenar por</Label>
										<Select
											type="single"
											value={sortOptionValue}
											onValueChange={(value: string) => value && onSortChange(value)}
											disabled={hasClientSearch}
										>
											<SelectTrigger>
												{sortOptions.find((o) => o.value === sortOptionValue)?.label ?? "Ordenação"}
											</SelectTrigger>
											<SelectContent>
												{#each sortOptions as opt (opt.value)}
													<SelectItem value={opt.value}>{opt.label}</SelectItem>
												{/each}
											</SelectContent>
										</Select>
									</div>
								</div>

								<!-- Limpar filtros por último -->
								<div class="flex shrink-0 flex-row items-end justify-end gap-2">
									<Button type="button" variant="outline" size="sm" onclick={resetServiceFilters}>
										Limpar filtros
									</Button>
									{#if isFetchingServices}
										<Skeleton class="h-9 w-16 shrink-0" />
									{/if}
								</div>
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
							<!-- Mobile cards -->
							<div class="md:hidden space-y-3">
								{#each services as service (service.id)}
									{@const responsibles = uniqueStepResponsibleNames(service)}
									<div
										class="bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
										onclick={() => handleRowClick(service.id)}
										role="button"
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && handleRowClick(service.id)}
									>
										<div class="p-4 pb-3 border-b">
											<div class="flex items-start justify-between gap-3">
												<div class="flex-1 min-w-0">
													<p class="text-xs text-muted-foreground">#{service.id}</p>
													<h3 class="font-semibold text-base mt-0.5 leading-tight">{service.client?.name || '-'}</h3>
												</div>
												{#if service.priority}
													<Badge variant={getServicePriorityVariant(service.priority)} class="shrink-0">
														{getServicePriorityLabel(service.priority)}
													</Badge>
												{/if}
											</div>
										</div>
										<div class="p-4 space-y-2.5">
											<div class="flex items-center justify-between gap-2">
												<div onclick={(e) => e.stopPropagation()} role="presentation">
													<ServiceStepsOverviewPopover
														{service}
														open={mobileStatusPopoverId === service.id}
														onOpenChange={(open) => {
															mobileStatusPopoverId = open ? service.id : null;
														}}
													/>
												</div>
												<Badge variant="outline" class="text-xs shrink-0">{service?.category?.name || '-'}</Badge>
											</div>
											{#if service.description?.trim()}
												<p class="text-sm text-muted-foreground line-clamp-2">{service.description.trim()}</p>
											{/if}
											<div class="flex items-center justify-between text-xs text-muted-foreground">
												<span>{service?.client?.address?.neighborhood?.city?.name || '-'}</span>
												<span>{formatDate(service.createdAt)}</span>
											</div>
										</div>
										{#if userCanManageServices}
											<div class="p-3 border-t bg-muted/20 flex justify-end" onclick={(e) => e.stopPropagation()} role="presentation">
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
										{/if}
									</div>
								{/each}
							</div>

							<!-- Desktop table -->
							<div class="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Cliente</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Prioridade</TableHead>
										<TableHead>Categoria</TableHead>
										<TableHead class="w-[10rem] max-w-[10rem]">Descrição</TableHead>
										<TableHead class="min-w-[10rem]">Funcionários responsáveis</TableHead>
										<TableHead>Cidade</TableHead>
										<TableHead>Data de Criação</TableHead>
										{#if userCanManageServices}
											<TableHead class="w-[100px] text-center">Ações</TableHead>
										{/if}
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each services as service (service.id)}
										{@const responsibles = uniqueStepResponsibleNames(service)}
										<TableRow
											class="hover:bg-muted/50 cursor-pointer"
											onclick={() => handleRowClick(service.id)}
										>
											<TableCell class="font-medium">#{service.id}</TableCell>
											<TableCell>{service.client?.name || '-'}</TableCell>
											<TableCell class="align-top" onclick={(e) => e.stopPropagation()}>
												<ServiceStepsOverviewPopover
													{service}
													open={desktopStatusPopoverId === service.id}
													onOpenChange={(open) => {
														desktopStatusPopoverId = open ? service.id : null;
													}}
												/>
											</TableCell>
											<TableCell>
									{#if service.priority}
										<Badge variant={getServicePriorityVariant(service.priority)}>
											{getServicePriorityLabel(service.priority)}
										</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">-</span>
									{/if}
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{service?.category?.name || '-'}
												</Badge>
											</TableCell>
											<TableCell
												class="w-[10rem] max-w-[10rem] align-top text-sm"
												onclick={(e) => e.stopPropagation()}
											>
												{#if service.description?.trim()}
													{@const desc = service.description.trim()}
													{@const { preview, isTruncated } = serviceDescriptionPreview(desc)}
													{#if isTruncated}
														<Popover.Root>
															<Popover.Trigger
																class="block max-w-full cursor-pointer truncate rounded border-0 bg-transparent p-0 text-left text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
																type="button"
															>
																{preview}
															</Popover.Trigger>
															<Popover.Portal>
																<Popover.Content
																	class="bg-popover text-popover-foreground z-50 w-[min(100vw-2rem,28rem)] max-w-[28rem] rounded-md border p-3 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
																	side="bottom"
																	align="start"
																	sideOffset={6}
																	onclick={(e) => e.stopPropagation()}
																>
																	<p class="whitespace-pre-wrap break-words text-sm">{desc}</p>
																</Popover.Content>
															</Popover.Portal>
														</Popover.Root>
													{:else}
														<span class="block max-w-full truncate text-foreground">{preview}</span>
													{/if}
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</TableCell>
											<TableCell class="max-w-[14rem] text-sm align-top">
												{#if responsibles}
													<span class="line-clamp-3" title={responsibles}>
														{responsibles}
													</span>
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</TableCell>
											<TableCell class="font-medium">
												{service?.client?.address?.neighborhood?.city?.name || '-'}
											</TableCell>
											<TableCell>{formatDate(service.createdAt)}</TableCell>
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
							</div><!-- end hidden md:block -->
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

	<ServiceFormDialog
		bind:open={showServiceFormDialog}
		service={editingService}
		serviceId={editingServiceId}
		onSuccess={handleServiceSuccess}
	/>

	<CategoryFormDialog
		bind:open={showCategoryFormDialog}
		category={editingCategory}
		onSuccess={handleCategorySuccess}
	/>

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
