<!--
  Step form component for service steps
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
	import { Save, X } from 'lucide-svelte';
	import type { ServiceStep, ServiceStepStatus } from '$lib/api/types/service.types.js';
	import type { User } from '$lib/api/types/auth.types.js';

	let {
		step = null as ServiceStep | null,
		onSubmit = () => {},
		onCancel = () => {},
		isLoading = false
	} = $props<{
		step?: ServiceStep | null;
		onSubmit?: (data: { title: string; description?: string; assignedUserId?: number; status?: ServiceStepStatus }) => void;
		onCancel?: () => void;
		isLoading?: boolean;
	}>();

	// Form data
	let formData = $state({
		title: step?.title || '',
		description: step?.description || '',
		assignedUserId: step?.assignedUserId || 0,
		status: step?.status || 'pending' as ServiceStepStatus
	});

	// Available users
	const { data: users } = useUsers();

	// Status options
	let statusOptions = [
		{ value: 'pending', label: 'Pendente', color: 'gray' },
		{ value: 'in_progress', label: 'Em Andamento', color: 'blue' },
		{ value: 'completed', label: 'Concluído', color: 'green' },
		{ value: 'skipped', label: 'Pulado', color: 'orange' }
	];

	function handleSubmit() {
		if (!formData.title.trim()) {
			errorToast.validation('Título do passo é obrigatório');
			return;
		}

		const data = {
			title: formData.title.trim(),
			description: formData.description.trim() || undefined,
			assignedUserId: formData.assignedUserId || undefined,
			status: formData.status
		};

		onSubmit(data);
	}

	function getStatusColor(status: ServiceStepStatus) {
		const option = statusOptions.find(opt => opt.value === status);
		return option?.color || 'gray';
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<Card>
		<CardHeader>
			<CardTitle>{step ? 'Editar Passo' : 'Novo Passo'}</CardTitle>
			<CardDescription>
				{step ? 'Edite os detalhes do passo' : 'Adicione um novo passo ao serviço'}
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<Label for="title">Título *</Label>
				<Input
					id="title"
					bind:value={formData.title}
					placeholder="Digite o título do passo"
					required
				/>
			</div>

			<div>
				<Label for="description">Descrição</Label>
				<Input
					id="description"
					bind:value={formData.description}
					placeholder="Descreva o passo (opcional)"
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="assignedUser">Responsável</Label>
					<Select bind:value={formData.assignedUserId}>
						<SelectTrigger>
							<span class="text-muted-foreground">
								{users?.isLoading ? 'Carregando...' : 'Selecione um responsável'}
							</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={0}>Não atribuído</SelectItem>
							{#each users?.data || [] as user}
								<SelectItem value={user.id}>{user.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label for="status">Status</Label>
					<Select bind:value={formData.status}>
						<SelectTrigger>
							<span class="text-muted-foreground">Selecione o status</span>
						</SelectTrigger>
						<SelectContent>
							{#each statusOptions as option}
								<SelectItem value={option.value}>
									<div class="flex items-center space-x-2">
										<Badge variant="outline" class="text-xs">
											{option.label}
										</Badge>
									</div>
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Actions -->
	<div class="flex items-center justify-end space-x-2">
		<Button type="button" variant="outline" on:click={onCancel}>
			<X class="w-4 h-4 mr-2" />
			Cancelar
		</Button>
		<Button type="submit" disabled={isLoading}>
			<Save class="w-4 h-4 mr-2" />
			{isLoading ? 'Salvando...' : step ? 'Atualizar Passo' : 'Criar Passo'}
		</Button>
	</div>
</form>
