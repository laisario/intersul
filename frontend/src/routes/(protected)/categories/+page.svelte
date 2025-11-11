<!--
  Categories management page
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { useCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from '$lib/hooks/queries/use-categories.svelte.js';
	import { errorToast, successToast } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import LoadingSkeleton from '$lib/components/ui/loading-skeleton.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import { Plus, Edit, Trash2, Eye } from 'lucide-svelte';
	import CategoryForm from '$lib/components/forms/category-form.svelte';
	import type { Category, CreateCategoryDto, UpdateCategoryDto } from '$lib/api/types/service.types.js';

	let searchTerm = $state('');
	let showNewCategoryModal = $state(false);
	let showEditCategoryModal = $state(false);
	let selectedCategory = $state<Category | null>(null);

	const { data: categories, isLoading, refetch } = useCategories();
	const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();
	const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
	const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

	// Filter categories based on search
	let filteredCategories = $derived(
		categories?.filter(category => 
			category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			category.description?.toLowerCase().includes(searchTerm.toLowerCase())
		) || []
	);

	function handleSearch() {
		// Search is handled reactively
	}

	async function handleDeleteCategory(categoryId: number, categoryName: string) {
		if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
			return;
		}

		deleteCategory(categoryId, {
			onSuccess: () => {
				successToast.categoryDeleted(categoryName);
				refetch();
			},
			onError: (err: any) => {
				console.error('Error deleting category:', err);
				errorToast.unknown();
			},
		});
	}

	function openEditModal(category: Category) {
		selectedCategory = category;
		showEditCategoryModal = true;
	}

	function closeModals() {
		showNewCategoryModal = false;
		showEditCategoryModal = false;
		selectedCategory = null;
		refetch();
	}

	function handleCreateCategory(data: CreateCategoryDto) {
		createCategory(data, {
			onSuccess: () => {
				successToast.categoryCreated();
				closeModals();
			},
			onError: (error) => {
				console.error('Error creating category:', error);
				errorToast.unknown();
			}
		});
	}

	function handleUpdateCategory(data: UpdateCategoryDto) {
		if (!selectedCategory) return;
		
		updateCategory({ id: selectedCategory.id, data }, {
			onSuccess: () => {
				successToast.categoryUpdated();
				closeModals();
			},
			onError: (error) => {
				console.error('Error updating category:', error);
				errorToast.unknown();
			}
		});
	}
</script>

<svelte:head>
	<title>Categorias - Intersul</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Categorias</h1>
			<p class="text-muted-foreground">Gerencie as categorias de serviços</p>
		</div>
		<Button on:click={() => (showNewCategoryModal = true)}>
			<Plus class="w-4 h-4 mr-2" />
			Nova Categoria
		</Button>
	</div>

	<!-- Search -->
	<div class="flex items-center space-x-2">
		<Input
			type="text"
			placeholder="Buscar categorias..."
			bind:value={searchTerm}
			on:input={handleSearch}
			class="max-w-sm"
		/>
	</div>

	<!-- Categories Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#if isLoading}
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
		{:else if filteredCategories.length === 0}
			<div class="col-span-full text-center py-12">
				<div class="text-muted-foreground">
					<p class="text-lg font-medium">Nenhuma categoria encontrada</p>
					<p class="text-sm">Comece criando uma nova categoria.</p>
				</div>
			</div>
		{:else}
			{#each filteredCategories as category}
				<Card class="hover:shadow-md transition-shadow">
					<CardHeader>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<div class="w-4 h-4 rounded-full" style="background-color: {category.color || '#3b82f6'}"></div>
								<CardTitle class="text-lg">{category.name}</CardTitle>
							</div>
							<Badge variant={category.active ? 'default' : 'secondary'}>
								{category.active ? 'Ativa' : 'Inativa'}
							</Badge>
						</div>
						{#if category.description}
							<CardDescription>{category.description}</CardDescription>
						{/if}
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Passos sugeridos:</span>
								<span class="font-medium">{category.stepTemplates?.length || 0}</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Criada em:</span>
								<span>{formatDate(category.createdAt)}</span>
							</div>
						</div>
						<div class="flex items-center justify-end space-x-2 mt-4">
							<Button
								variant="ghost"
								size="sm"
								on:click={() => openEditModal(category)}
							>
								<Edit class="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								on:click={() => handleDeleteCategory(category.id, category.name)}
								disabled={isDeleting}
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
</div>

<!-- New Category Modal -->
<Sheet bind:open={showNewCategoryModal}>
	<SheetContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
		<SheetHeader>
			<SheetTitle>Nova Categoria</SheetTitle>
			<SheetDescription>
				Crie uma nova categoria de serviço com passos sugeridos.
			</SheetDescription>
		</SheetHeader>
		<CategoryForm 
			onSubmit={handleCreateCategory}
			onCancel={() => (showNewCategoryModal = false)}
			isLoading={isCreating}
		/>
	</SheetContent>
</Sheet>

<!-- Edit Category Modal -->
<Sheet bind:open={showEditCategoryModal}>
	<SheetContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
		<SheetHeader>
			<SheetTitle>Editar Categoria</SheetTitle>
			<SheetDescription>
				Edite os detalhes da categoria e seus passos sugeridos.
			</SheetDescription>
		</SheetHeader>
		<CategoryForm 
			category={selectedCategory}
			onSubmit={handleUpdateCategory}
			onCancel={() => (showEditCategoryModal = false)}
			isLoading={isUpdating}
		/>
	</SheetContent>
</Sheet>
