<!--
  Service creation dialog with category step templates
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { useCategories } from '$lib/hooks/queries/use-categories.svelte.js';
	import { useCreateService } from '$lib/hooks/queries/use-services.svelte.js';
	import { useCopyMachines } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { errorToast, successToast } from '$lib/utils/toast.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '$lib/components/ui/sheet/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Plus, Trash2, GripVertical, User } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { CreateServiceDto } from '$lib/api/types/service.types.js';
	import type { Client } from '$lib/api/types/client.types.js';
	import type { Category } from '$lib/api/types/service.types.js';
	import type { CopyMachineCatalog } from '$lib/api/types/copy-machine.types.js';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	} = $props<{
		open?: boolean;
		onSuccess?: () => void;
	}>();

	// Form data
	let formData = $state({
		title: '',
		description: '',
		clientId: 0,
		categoryId: 0,
		clientCopyMachineId: 0,
		loadStepTemplates: false,
		steps: [] as Array<{ title: string; description?: string; assignedUserId?: number }>
	});

	// API data
	const { data: clients, isLoading: clientsLoading } = useClients();
	const { data: categories, isLoading: categoriesLoading } = useCategories();
	const { data: copyMachines, isLoading: machinesLoading } = useCopyMachines();
	const { mutate: createService, isPending: isCreating } = useCreateService();

	// Filtered machines based on selected client
	let filteredMachines = $derived(
		copyMachines?.filter(machine => 
			formData.clientId === 0 || machine.clientId === formData.clientId
		) || []
	);

	// Selected category for step templates
	let selectedCategory = $derived(
		categories?.find(cat => cat.id === formData.categoryId)
	);

	// Load step templates when category changes and checkbox is checked
	$effect(() => {
		if (formData.loadStepTemplates && selectedCategory?.stepTemplates) {
			formData.steps = selectedCategory.stepTemplates.map(template => ({
				title: template.title,
				description: template.description || '',
				assignedUserId: undefined
			}));
		}
	});

	function resetForm() {
		formData = {
			title: '',
			description: '',
			clientId: 0,
			categoryId: 0,
			clientCopyMachineId: 0,
			loadStepTemplates: false,
			steps: []
		};
	}

	function handleSubmit() {
		if (!formData.title || !formData.clientId || !formData.categoryId) {
			errorToast.validation('Preencha todos os campos obrigatórios');
			return;
		}

		const serviceData: CreateServiceDto = {
			title: formData.title,
			description: formData.description || undefined,
			clientId: formData.clientId,
			categoryId: formData.categoryId,
			clientCopyMachineId: formData.clientCopyMachineId || undefined,
			steps: formData.steps.length > 0 ? formData.steps : undefined
		};

		createService(serviceData, {
			onSuccess: (newService) => {
				successToast.serviceCreated();
				resetForm();
				open = false;
				onSuccess();
				goto(`/services/${newService.id}`);
			},
			onError: (error) => {
				console.error('Error creating service:', error);
				errorToast.unknown();
			}
		});
	}

	function addStep() {
		formData.steps = [...formData.steps, { title: '', description: '', assignedUserId: undefined }];
	}

	function removeStep(index: number) {
		formData.steps = formData.steps.filter((_, i) => i !== index);
	}

	function updateStep(index: number, field: string, value: any) {
		formData.steps = formData.steps.map((step, i) => 
			i === index ? { ...step, [field]: value } : step
		);
	}
</script>

<Sheet bind:open>
	<SheetContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
		<SheetHeader>
			<SheetTitle>Novo Serviço</SheetTitle>
			<SheetDescription>
				Crie um novo serviço com passos sugeridos da categoria.
			</SheetDescription>
		</SheetHeader>

		<div class="space-y-6">
			<!-- Basic Information -->
			<Card>
				<CardHeader>
					<CardTitle>Informações Básicas</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<Label for="title">Título *</Label>
						<Input
							id="title"
							bind:value={formData.title}
							placeholder="Digite o título do serviço"
							required
						/>
					</div>

					<div>
						<Label for="description">Descrição</Label>
						<Input
							id="description"
							bind:value={formData.description}
							placeholder="Descreva o serviço (opcional)"
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label for="client">Cliente *</Label>
							<Select bind:value={formData.clientId}>
								<SelectTrigger>
									<span class="text-muted-foreground">
										{clientsLoading ? 'Carregando...' : 'Selecione um cliente'}
									</span>
								</SelectTrigger>
								<SelectContent>
									{#each clients?.data || [] as client}
										<SelectItem value={client.id}>{client.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label for="category">Categoria *</Label>
							<Select bind:value={formData.categoryId}>
								<SelectTrigger>
									<span class="text-muted-foreground">
										{categoriesLoading ? 'Carregando...' : 'Selecione uma categoria'}
									</span>
								</SelectTrigger>
								<SelectContent>
									{#each categories || [] as category}
										<SelectItem value={category.id}>
											<div class="flex items-center space-x-2">
												<div class="w-3 h-3 rounded-full" style="background-color: {category.color || '#3b82f6'}"></div>
												<span>{category.name}</span>
											</div>
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label for="machine">Máquina (Opcional)</Label>
						<Select bind:value={formData.clientCopyMachineId}>
							<SelectTrigger>
								<span class="text-muted-foreground">
									{machinesLoading ? 'Carregando...' : 'Selecione uma máquina'}
								</span>
							</SelectTrigger>
							<SelectContent>
								{#each filteredMachines as machine}
									<SelectItem value={machine.id}>{machine.model}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<!-- Step Templates -->
			{#if selectedCategory}
				<Card>
					<CardHeader>
						<CardTitle>Passos Sugeridos</CardTitle>
						<CardDescription>
							Esta categoria possui {selectedCategory.stepTemplates?.length || 0} passos sugeridos
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="flex items-center space-x-2">
							<Checkbox 
								bind:checked={formData.loadStepTemplates}
								id="loadTemplates"
							/>
							<Label for="loadTemplates">
								Carregar passos sugeridos da categoria
							</Label>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Service Steps -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<div>
							<CardTitle>Passos do Serviço</CardTitle>
							<CardDescription>
								Defina os passos que serão executados neste serviço
							</CardDescription>
						</div>
						<Button variant="outline" size="sm" on:click={addStep}>
							<Plus class="w-4 h-4 mr-2" />
							Adicionar Passo
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{#if formData.steps.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<p class="text-lg font-medium">Nenhum passo definido</p>
							<p class="text-sm">Adicione passos para organizar o serviço</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each formData.steps as step, index}
								<div class="flex items-start space-x-3 p-4 border rounded-lg">
									<div class="flex-shrink-0 mt-2">
										<GripVertical class="w-4 h-4 text-muted-foreground" />
									</div>
									<div class="flex-1 space-y-3">
										<div>
											<Label for="step-title-{index}">Título do Passo</Label>
											<Input
												id="step-title-{index}"
												bind:value={step.title}
												on:input={(e) => updateStep(index, 'title', e.target.value)}
												placeholder="Digite o título do passo"
											/>
										</div>
								<div>
									<Label for="step-description-{index}">Descrição</Label>
									<Input
										id="step-description-{index}"
										bind:value={step.description}
										on:input={(e) => updateStep(index, 'description', e.target.value)}
										placeholder="Descreva o passo (opcional)"
									/>
								</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										on:click={() => removeStep(index)}
										class="text-red-600 hover:text-red-700"
									>
										<Trash2 class="w-4 h-4" />
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<SheetFooter>
			<Button variant="outline" on:click={() => (open = false)}>
				Cancelar
			</Button>
			<Button on:click={handleSubmit} disabled={isCreating}>
				{isCreating ? 'Criando...' : 'Criar Serviço'}
			</Button>
		</SheetFooter>
	</SheetContent>
</Sheet>
