<script lang="ts">
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from '$lib/components/ui/sheet/index.js';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Loader2, ClipboardList, Plus, Trash2, Check } from 'lucide-svelte';
	import { showError, successToast } from '$lib/utils/toast.js';
	import { useCreateService, useUpdateService, useService } from '$lib/hooks/queries/use-services.svelte.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { useCategories } from '$lib/hooks/queries/use-categories.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { useClientCopyMachines } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import type {
		Service,
		CreateServiceDto,
		CreateServiceStepDto,
		Step,
		Category
	} from '$lib/api/types/service.types.js';

	interface Props {
		open: boolean;
		service?: Service | null;
		serviceId?: number | null;
		onSuccess?: () => void;
	}

	type FormStep = {
		name: string;
		description: string;
		responsable_id?: number;
		source?: 'suggestion' | 'manual';
	};

	let { open = $bindable(false), service = null, serviceId = null, onSuccess }: Props = $props();

	const createMutation = useCreateService();
	const updateMutation = useUpdateService();
	const clientsQuery = useClients();
	const categoriesQuery = useCategories();
	const usersQuery = useUsers();
	const serviceDetailsQuery = $derived(serviceId ? useService(serviceId) : null);

	let initialized = $state(false);

	let formData = $state({
		client_id: 0,
		category_id: 0,
		client_copy_machine_id: undefined as number | undefined,
		description: ''
	});

	let steps = $state<FormStep[]>([]);

	let errors = $state<{ client_id?: string; category_id?: string; steps?: string }>({});

	const clients = $derived(clientsQuery.data ?? []);
	const categories = $derived(categoriesQuery.data ?? []);
	const users = $derived(usersQuery.data ?? []);
	const selectedCategory = $derived(categories.find((category) => category.id === formData.category_id) || null);
	const suggestionSteps = $derived(selectedCategory?.steps ?? []);
	const clientCopyMachinesQuery = $derived(formData.client_id ? useClientCopyMachines(formData.client_id) : null);
	const clientCopyMachines = $derived(clientCopyMachinesQuery?.data ?? []);
	const selectedClientCopyMachine = $derived(
		clientCopyMachines.find((machine) => machine.id === formData.client_copy_machine_id) || null
	);

	function resetForm() {
		formData = {
			client_id: 0,
			category_id: 0,
			client_copy_machine_id: undefined,
			description: ''
		};
		steps = [];
		errors = {};
	}

	function fillFromService(serviceData: Service) {
		formData.client_id = serviceData.client_id;
		formData.category_id = serviceData.category_id;
		formData.client_copy_machine_id = serviceData.client_copy_machine_id ?? undefined;
		formData.description = serviceData.description || '';
		steps = (serviceData.steps || []).map((step) => ({
			name: step.name,
			description: step.description,
			responsable_id: step.responsable_id,
			source: 'manual'
		}));
	}

	$effect(() => {
		if (!open) {
			resetForm();
			initialized = false;
			return;
		}

		if (initialized) return;

		const detailed = serviceDetailsQuery?.data;
		if (detailed) {
			fillFromService(detailed);
		} else if (service) {
			fillFromService(service);
		} else {
			resetForm();
		}

		initialized = true;
	});

	function addSuggestionStep(step: Step) {
		if (isSuggestionAdded(step)) return;

		steps = [
			...steps,
			{
				name: step.name,
				description: step.description,
				source: 'suggestion'
			}
		];
	}

	function addAllSuggestions() {
		suggestionSteps.forEach(addSuggestionStep);
	}

	function addManualStep() {
		steps = [
			...steps,
			{
				name: '',
				description: '',
				source: 'manual'
			}
		];
	}

	function removeStep(index: number) {
		steps = steps.filter((_, i) => i !== index);
	}

	function updateStepField(index: number, field: keyof FormStep, value: any) {
		steps = steps.map((step, i) => (i === index ? { ...step, [field]: value } : step));
	}

	function isSuggestionAdded(step: Step) {
		return steps.some(
			(existing) =>
				existing.name.trim().toLowerCase() === step.name.trim().toLowerCase() &&
				existing.description.trim().toLowerCase() === step.description.trim().toLowerCase()
		);
	}

	function validateForm() {
		errors = {};

		if (!formData.client_id) {
			errors.client_id = 'Selecione um cliente';
		}

		if (!formData.category_id) {
			errors.category_id = 'Selecione uma categoria';
		}

		const invalidStep = steps.some((step) => !step.name.trim() || !step.description.trim());
		if (invalidStep) {
			errors.steps = 'Todas as etapas devem ter nome e descrição preenchidos';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			showError('Por favor, corrija os erros no formulário');
			return;
		}

		const payload: CreateServiceDto = {
			client_id: formData.client_id,
			category_id: formData.category_id,
			client_copy_machine_id: formData.client_copy_machine_id || undefined,
			description: formData.description?.trim() || undefined,
			steps: steps.length
				? steps.map<CreateServiceStepDto>((step) => ({
					name: step.name.trim(),
					description: step.description.trim(),
					responsable_id: step.responsable_id
				}))
				: undefined
		};

		try {
			if (serviceId || service) {
				await updateMutation.mutateAsync({
					id: serviceId || service!.id,
					data: payload
				});
				successToast.updated('serviço');
			} else {
				await createMutation.mutateAsync(payload);
				successToast.created('serviço');
			}

			open = false;
			onSuccess?.();
		} catch (error: any) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				'Erro ao salvar serviço';
			showError(message);
		}
	}

	function closeDialog() {
		open = false;
	}
</script>

<Sheet bind:open on:close={closeDialog}>
	<SheetContent class="sm:max-w-[800px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle class="flex items-center gap-2">
				<ClipboardList class="w-5 h-5" />
				{serviceId || service ? 'Editar Serviço' : 'Novo Serviço'}
			</SheetTitle>
			<SheetDescription>
				Preencha as informações do serviço e personalize as etapas que serão executadas.
			</SheetDescription>
		</SheetHeader>

		<div class="space-y-6 mt-6 px-6 pb-6">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Informações do Serviço</CardTitle>
					<CardDescription>Defina o cliente, categoria e descrição do serviço.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label>Cliente *</Label>
							<Select
								value={formData.client_id ? formData.client_id.toString() : ''}
								onValueChange={(value) => {
									formData.client_id = value ? parseInt(value) : 0;
									formData.client_copy_machine_id = undefined;
								}}
							>
								<SelectTrigger class={errors.client_id ? 'border-red-500' : ''}>
									{formData.client_id
										? clients.find((client) => client.id === formData.client_id)?.name || 'Selecione um cliente'
										: 'Selecione um cliente'}
								</SelectTrigger>
								<SelectContent>
									{#if clientsQuery.isLoading}
										<SelectItem value="" disabled>Carregando clientes...</SelectItem>
									{:else if clientsQuery.error}
										<SelectItem value="" disabled>Erro ao carregar clientes</SelectItem>
									{:else}
										{#each clients as client (client.id)}
											<SelectItem value={client.id.toString()}>
												{client.name}
											</SelectItem>
										{/each}
									{/if}
								</SelectContent>
							</Select>
							{#if errors.client_id}
								<p class="text-sm text-red-500">{errors.client_id}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label>Categoria *</Label>
							<Select
								value={formData.category_id ? formData.category_id.toString() : ''}
								onValueChange={(value) => formData.category_id = value ? parseInt(value) : 0}
							>
								<SelectTrigger class={errors.category_id ? 'border-red-500' : ''}>
									{formData.category_id
										? categories.find((category) => category.id === formData.category_id)?.name || 'Selecione uma categoria'
										: 'Selecione uma categoria'}
								</SelectTrigger>
								<SelectContent>
									{#if categoriesQuery.isLoading}
										<SelectItem value="" disabled>Carregando categorias...</SelectItem>
									{:else if categoriesQuery.error}
										<SelectItem value="" disabled>Erro ao carregar categorias</SelectItem>
									{:else}
										{#each categories as category (category.id)}
											<SelectItem value={category.id.toString()}>
												{category.name}
											</SelectItem>
										{/each}
									{/if}
								</SelectContent>
							</Select>
							{#if errors.category_id}
								<p class="text-sm text-red-500">{errors.category_id}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label>Equipamento do Cliente</Label>
							<Select
								value={formData.client_copy_machine_id ? formData.client_copy_machine_id.toString() : ''}
								onValueChange={(value) => formData.client_copy_machine_id = value ? parseInt(value) : undefined}
								disabled={!formData.client_id}
							>
								<SelectTrigger class={!formData.client_id ? 'opacity-60 cursor-not-allowed' : ''}>
									{#if !formData.client_id}
										Selecione um cliente primeiro
									{:else if clientCopyMachinesQuery?.isLoading}
										Carregando equipamentos...
									{:else if clientCopyMachinesQuery?.error}
										Erro ao carregar equipamentos
									{:else if !clientCopyMachines.length}
										Nenhum equipamento cadastrado
									{:else if selectedClientCopyMachine}
										{selectedClientCopyMachine.catalogCopyMachine?.model ?? selectedClientCopyMachine.external_model ?? 'Equipamento'} - {selectedClientCopyMachine.serial_number}
									{:else}
										Selecione um equipamento
									{/if}
								</SelectTrigger>
								<SelectContent>
									{#if clientCopyMachinesQuery?.isLoading}
										<SelectItem value="" disabled>Carregando equipamentos...</SelectItem>
									{:else if clientCopyMachinesQuery?.error}
										<SelectItem value="" disabled>Erro ao carregar equipamentos</SelectItem>
									{:else if !clientCopyMachines.length}
										<SelectItem value="" disabled>Nenhum equipamento cadastrado</SelectItem>
									{:else}
										<SelectItem value="">
											<span class="text-muted-foreground">Sem equipamento</span>
										</SelectItem>
										{#each clientCopyMachines as machine (machine.id)}
											<SelectItem value={machine.id.toString()}>
												{machine.catalogCopyMachine?.model ?? machine.external_model ?? 'Equipamento'} - {machine.serial_number}
											</SelectItem>
										{/each}
									{/if}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div class="space-y-2">
						<Label>Descrição do Serviço</Label>
						<textarea
							value={formData.description}
							oninput={(e) => formData.description = e.currentTarget.value}
							rows="3"
							placeholder="Descreva o serviço em detalhes"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle class="text-lg">Etapas Sugeridas</CardTitle>
						<CardDescription>
							Selecione as etapas sugeridas pela categoria e personalize conforme necessário.
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={addAllSuggestions}
						disabled={!suggestionSteps.length}
					>
						<Plus class="w-4 h-4 mr-2" />
						Adicionar todas
					</Button>
				</CardHeader>
				<CardContent>
					{#if !selectedCategory}
						<p class="text-sm text-muted-foreground">Selecione uma categoria para visualizar as etapas sugeridas.</p>
					{:else if !suggestionSteps.length}
						<p class="text-sm text-muted-foreground">A categoria selecionada não possui etapas sugeridas.</p>
					{:else}
						<div class="space-y-3">
							{#each suggestionSteps as suggestion}
								<div class="border rounded-lg p-4 flex items-start justify-between gap-4">
									<div>
										<p class="font-medium text-sm">{suggestion.name}</p>
										<p class="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={() => addSuggestionStep(suggestion)}
										disabled={isSuggestionAdded(suggestion)}
									>
										{#if isSuggestionAdded(suggestion)}
											<Check class="w-4 h-4" />
										{:else}
											<Plus class="w-4 h-4" />
										{/if}
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle class="text-lg">Etapas do Serviço</CardTitle>
						<CardDescription>
							Adicione ou remova etapas conforme necessário.
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={addManualStep}
					>
						<Plus class="w-4 h-4 mr-2" />
						Adicionar Etapa
					</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if steps.length === 0}
						<p class="text-sm text-muted-foreground">Nenhuma etapa adicionada. Utilize as sugestões ou crie uma etapa manualmente.</p>
					{:else}
						<div class="space-y-4">
							{#each steps as step, index (index)}
								<div class="border rounded-lg p-4 space-y-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline">Etapa {index + 1}</Badge>
											{#if step.source === 'suggestion'}
												<span class="text-xs text-muted-foreground flex items-center gap-1">
													<Check class="w-3 h-3" />
													Sugerida pela categoria
												</span>
											{/if}
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="text-red-500"
											onclick={() => removeStep(index)}
										>
											<Trash2 class="w-4 h-4" />
										</Button>
									</div>

									<div class="space-y-2">
										<Label>Nome da etapa</Label>
										<Input
											value={step.name}
											oninput={(e) => updateStepField(index, 'name', e.currentTarget.value)}
											placeholder="Ex: Avaliação inicial"
										/>
									</div>

									<div class="space-y-2">
										<Label>Descrição</Label>
										<textarea
											value={step.description}
											oninput={(e) => updateStepField(index, 'description', e.currentTarget.value)}
											rows="3"
											placeholder="Descreva o que precisa ser feito nesta etapa"
											class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										/>
									</div>

									<div class="space-y-2">
										<Label>Responsável</Label>
										<Select
											value={step.responsable_id ? step.responsable_id.toString() : ''}
											onValueChange={(value) => updateStepField(index, 'responsable_id', value ? parseInt(value) : undefined)}
										>
											<SelectTrigger class="w-full md:w-[220px]">
												{step.responsable_id
													? users.find((user) => user.id === step.responsable_id)?.name || 'Selecione um responsável'
													: 'Selecione um responsável'}
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													<span class="text-muted-foreground">Sem responsável</span>
												</SelectItem>
												{#if usersQuery.isLoading}
													<SelectItem value="" disabled>Carregando usuários...</SelectItem>
												{:else if usersQuery.error}
													<SelectItem value="" disabled>Erro ao carregar usuários</SelectItem>
												{:else}
													{#each users as user (user.id)}
														<SelectItem value={user.id.toString()}>
															{user.name}
														</SelectItem>
													{/each}
												{/if}
											</SelectContent>
										</Select>
									</div>
								</div>
							{/each}
						</div>
					{/if}
					{#if errors.steps}
						<p class="text-sm text-red-500">{errors.steps}</p>
					{/if}
				</CardContent>
			</Card>
		</div>

		<SheetFooter class="px-6 pb-6 mt-6 flex gap-2 justify-end">
			<Button
				type="button"
				variant="outline"
				onclick={closeDialog}
				disabled={createMutation.isPending || updateMutation.isPending}
			>
				Cancelar
			</Button>
			<Button
				type="button"
				onclick={handleSubmit}
				disabled={createMutation.isPending || updateMutation.isPending}
			>
				{#if createMutation.isPending || updateMutation.isPending}
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
				{/if}
				{serviceId || service ? 'Salvar alterações' : 'Criar serviço'}
			</Button>
		</SheetFooter>
	</SheetContent>
</Sheet>
