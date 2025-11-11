<script lang="ts">
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	// Textarea component - using Input with rows for now
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { useCreateCategory, useUpdateCategory } from '$lib/hooks/queries/use-categories.svelte.js';
	import { showError, successToast } from '$lib/utils/toast.js';
	import { Plus, Trash2, X } from 'lucide-svelte';
	import type { Category, StepTemplate } from '$lib/api/types/service.types.js';

	interface Props {
		open: boolean;
		category?: Category | null;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), category = null, onSuccess }: Props = $props();

	const createMutation = useCreateCategory();
	const updateMutation = useUpdateCategory();

	const isEditing = $derived(!!category);

	// Form data
	let formData = $state({
		name: '',
		description: ''
	});

	// Step templates
	let stepTemplates = $state<StepTemplate[]>([]);

	// Reset form
	function resetForm() {
		formData = {
			name: '',
			description: ''
		};
		stepTemplates = [];
	}

	// Load category data when editing
	$effect(() => {
		if (isEditing && open && category) {
			formData.name = category.name || '';
			formData.description = category.description || '';
			// Load existing steps as templates
			stepTemplates = (category.steps || []).map(step => ({
				name: step.name || '',
				description: step.description || ''
			}));
		} else if (!isEditing && open) {
			resetForm();
		}
	});

	// Reset when dialog closes
	$effect(() => {
		if (!open) {
			resetForm();
		}
	});

	// Add new step template
	function addStepTemplate() {
		stepTemplates = [...stepTemplates, { name: '', description: '' }];
	}

	// Remove step template
	function removeStepTemplate(index: number) {
		stepTemplates = stepTemplates.filter((_, i) => i !== index);
	}

	// Update step template
	function updateStepTemplate(index: number, field: 'name' | 'description', value: string) {
		stepTemplates = stepTemplates.map((step, i) => 
			i === index ? { ...step, [field]: value } : step
		);
	}

	// Handle form submission
	async function handleSubmit() {
		// Validate
		if (!formData.name.trim()) {
			showError('O nome da categoria é obrigatório');
			return;
		}

		// Validate step templates
		for (let i = 0; i < stepTemplates.length; i++) {
			const step = stepTemplates[i];
			if (!step.name.trim() || !step.description.trim()) {
				showError(`A etapa ${i + 1} precisa ter nome e descrição preenchidos`);
				return;
			}
		}

		try {
			const data = {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				steps: stepTemplates.length > 0 ? stepTemplates.map(step => ({
					name: step.name.trim(),
					description: step.description.trim()
				})) : undefined
			};

			if (isEditing && category) {
				await updateMutation.mutateAsync({ id: category.id, data });
				successToast.updated('categoria');
			} else {
				await createMutation.mutateAsync(data);
				successToast.created('categoria');
			}

			open = false;
			onSuccess?.();
		} catch (error: any) {
			showError(error?.response?.data?.message || 'Erro ao salvar categoria');
		}
	}
</script>

<Sheet bind:open>
	<SheetContent class="sm:max-w-[700px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle>
				{isEditing ? 'Editar Categoria' : 'Nova Categoria'}
			</SheetTitle>
			<SheetDescription>
				{isEditing ? 'Edite as informações da categoria e suas etapas template' : 'Crie uma nova categoria de serviços com suas etapas template'}
			</SheetDescription>
		</SheetHeader>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 mt-6 px-6 pb-6">
			<!-- Category Info -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Informações da Categoria</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Nome *</Label>
						<Input
							id="name"
							value={formData.name}
							oninput={(e) => formData.name = e.currentTarget.value}
							placeholder="Ex: Manutenção Preventiva"
							required
							disabled={createMutation.isPending || updateMutation.isPending}
						/>
					</div>

					<div class="space-y-2">
						<Label for="description">Descrição</Label>
						<textarea
							id="description"
							value={formData.description}
							oninput={(e) => formData.description = e.currentTarget.value}
							placeholder="Descreva a categoria de serviços..."
							rows="3"
							disabled={createMutation.isPending || updateMutation.isPending}
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>
				</CardContent>
			</Card>

			<!-- Step Templates -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="text-lg">Etapas Template</CardTitle>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addStepTemplate}
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							<Plus class="w-4 h-4 mr-2" />
							Adicionar Etapa
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{#if stepTemplates.length === 0}
						<div class="text-center py-8 text-sm text-muted-foreground">
							<p>Nenhuma etapa template adicionada ainda.</p>
							<p class="mt-1">Clique em "Adicionar Etapa" para criar um template de etapa.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each stepTemplates as step, index}
								<div class="p-4 border rounded-lg space-y-4">
									<div class="flex items-center justify-between">
										<h4 class="font-medium text-sm">Etapa {index + 1}</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removeStepTemplate(index)}
											disabled={createMutation.isPending || updateMutation.isPending}
										>
											<Trash2 class="w-4 h-4 text-red-600" />
										</Button>
									</div>

									<div class="space-y-2">
										<Label for="step-name-{index}">Nome da Etapa *</Label>
										<Input
											id="step-name-{index}"
											value={step.name}
											oninput={(e) => updateStepTemplate(index, 'name', e.currentTarget.value)}
											placeholder="Ex: Avaliação Inicial"
											required
											disabled={createMutation.isPending || updateMutation.isPending}
										/>
									</div>

									<div class="space-y-2">
										<Label for="step-description-{index}">Descrição da Etapa *</Label>
										<textarea
											id="step-description-{index}"
											value={step.description}
											oninput={(e) => updateStepTemplate(index, 'description', e.currentTarget.value)}
											placeholder="Descreva o que deve ser feito nesta etapa..."
											rows="3"
											required
											disabled={createMutation.isPending || updateMutation.isPending}
											class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										></textarea>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onclick={() => open = false}
					disabled={createMutation.isPending || updateMutation.isPending}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending || updateMutation.isPending}
				>
					{createMutation.isPending || updateMutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
				</Button>
			</div>
		</form>
	</SheetContent>
</Sheet>

