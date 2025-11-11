<!--
  Category form component with step templates editor
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { errorToast, successToast } from '$lib/utils/toast.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Plus, Trash2, GripVertical, Palette } from 'lucide-svelte';
	import type { CreateCategoryDto, UpdateCategoryDto, Category } from '$lib/api/types/service.types.js';
	import type { User } from '$lib/api/types/auth.types.js';

	let {
		category = null as Category | null,
		onSubmit = () => {},
		onCancel = () => {},
		isLoading = false
	} = $props<{
		category?: Category | null;
		onSubmit?: (data: CreateCategoryDto | UpdateCategoryDto) => void;
		onCancel?: () => void;
		isLoading?: boolean;
	}>();

	// Form data
	let formData = $state({
		name: category?.name || '',
		description: category?.description || '',
		color: category?.color || '#3b82f6',
		active: category?.active ?? true,
		stepTemplates: category?.stepTemplates || [] as Array<{
			title: string;
			description?: string;
			suggestedRole?: string;
		}>
	});

	// Available users for role suggestions
	const { data: users } = useUsers();

	// Predefined color options
	let colorOptions = [
		{ name: 'Azul', value: '#3b82f6' },
		{ name: 'Verde', value: '#10b981' },
		{ name: 'Vermelho', value: '#ef4444' },
		{ name: 'Amarelo', value: '#f59e0b' },
		{ name: 'Roxo', value: '#8b5cf6' },
		{ name: 'Rosa', value: '#ec4899' },
		{ name: 'Cinza', value: '#6b7280' },
		{ name: 'Laranja', value: '#f97316' }
	];

	function handleSubmit() {
		if (!formData.name.trim()) {
			errorToast.validation('Nome da categoria é obrigatório');
			return;
		}

		const data = {
			name: formData.name.trim(),
			description: formData.description.trim() || undefined,
			color: formData.color,
			active: formData.active,
			stepTemplates: formData.stepTemplates.filter(step => step.title.trim())
		};

		onSubmit(data);
	}

	function addStepTemplate() {
		formData.stepTemplates = [...formData.stepTemplates, {
			title: '',
			description: '',
			suggestedRole: ''
		}];
	}

	function removeStepTemplate(index: number) {
		formData.stepTemplates = formData.stepTemplates.filter((_, i) => i !== index);
	}

	function updateStepTemplate(index: number, field: string, value: string) {
		formData.stepTemplates = formData.stepTemplates.map((step, i) => 
			i === index ? { ...step, [field]: value } : step
		);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<!-- Basic Information -->
	<Card>
		<CardHeader>
			<CardTitle>Informações Básicas</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<Label for="name">Nome *</Label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Digite o nome da categoria"
					required
				/>
			</div>

			<div>
				<Label for="description">Descrição</Label>
				<Input
					id="description"
					bind:value={formData.description}
					placeholder="Descreva a categoria (opcional)"
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="color">Cor</Label>
					<div class="flex items-center space-x-2">
						<div class="flex space-x-1">
							{#each colorOptions as color}
				<button
					type="button"
					class="w-8 h-8 rounded-full border-2 {formData.color === color.value ? 'border-gray-400' : 'border-gray-200'}"
					style="background-color: {color.value}"
					onclick={() => (formData.color = color.value)}
					title={color.name}
				></button>
							{/each}
						</div>
						<Input
							id="color"
							bind:value={formData.color}
							class="w-20"
							placeholder="#3b82f6"
						/>
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="active"
						bind:checked={formData.active}
						class="rounded"
					/>
					<Label for="active">Categoria ativa</Label>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Step Templates -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Passos Sugeridos</CardTitle>
					<CardDescription>
						Defina passos que serão sugeridos ao criar serviços desta categoria
					</CardDescription>
				</div>
				<Button type="button" variant="outline" size="sm" on:click={addStepTemplate}>
					<Plus class="w-4 h-4 mr-2" />
					Adicionar Passo
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if formData.stepTemplates.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					<p class="text-lg font-medium">Nenhum passo sugerido</p>
					<p class="text-sm">Adicione passos que serão sugeridos para novos serviços</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each formData.stepTemplates as step, index}
						<div class="flex items-start space-x-3 p-4 border rounded-lg">
							<div class="flex-shrink-0 mt-2">
								<GripVertical class="w-4 h-4 text-muted-foreground" />
							</div>
							<div class="flex-1 space-y-3">
								<div>
									<Label for="step-title-{index}">Título do Passo *</Label>
									<Input
										id="step-title-{index}"
										bind:value={step.title}
										on:input={(e) => updateStepTemplate(index, 'title', e.target.value)}
										placeholder="Digite o título do passo"
										required
									/>
								</div>
								<div>
									<Label for="step-description-{index}">Descrição</Label>
									<Input
										id="step-description-{index}"
										bind:value={step.description}
										on:input={(e) => updateStepTemplate(index, 'description', e.target.value)}
										placeholder="Descreva o passo (opcional)"
									/>
								</div>
								<div>
									<Label for="step-role-{index}">Papel Sugerido</Label>
									<Select bind:value={step.suggestedRole}>
										<SelectTrigger>
											<span class="text-muted-foreground">Selecione um papel</span>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Nenhum papel específico</SelectItem>
											<SelectItem value="admin">Administrador</SelectItem>
											<SelectItem value="manager">Gerente</SelectItem>
											<SelectItem value="technician">Técnico</SelectItem>
											<SelectItem value="commercial">Comercial</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								on:click={() => removeStepTemplate(index)}
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

	<!-- Actions -->
	<div class="flex items-center justify-end space-x-2">
		<Button type="button" variant="outline" on:click={onCancel}>
			Cancelar
		</Button>
		<Button type="submit" disabled={isLoading}>
			{isLoading ? 'Salvando...' : category ? 'Atualizar Categoria' : 'Criar Categoria'}
		</Button>
	</div>
</form>
