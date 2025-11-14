<script lang="ts">
	import { useStep, useUpdateStep, useStartStep, useConcludeStep, useCancelStep, useStepImages } from '$lib/hooks/queries/use-steps.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { ArrowLeft, Save, Play, CheckCircle, XCircle, ExternalLink, Loader2, Image as ImageIcon, X, User } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/components/layout/breadcrumbs.svelte';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import StepImagesUpload from '$lib/components/step-images-upload.svelte';
	import { queryClient } from '$lib/config/query-client.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Edit } from 'lucide-svelte';
	import { env } from '$lib/config/env.js';
	import type { Image } from '$lib/api/types/service.types.js';
	import { user } from '$lib/stores/auth.svelte.js';

	const props = $props<{ data: { id: string } }>();
	const stepId = Number.parseInt(props.data.id, 10);
	const currentUser = $derived($user);

	const stepQuery = $derived(useStep(stepId));
	const step = $derived(stepQuery.data);
	const isLoading = $derived(stepQuery.isLoading);
	const isError = $derived(stepQuery.isError);

	const imagesQuery = $derived(useStepImages(stepId));
	const images = $derived(imagesQuery.data || []);
	const isLoadingImages = $derived(imagesQuery.isLoading);

	const { mutate: updateStep, isPending: isUpdating } = useUpdateStep();
	const { mutate: startStep, isPending: isStarting } = useStartStep();
	const { mutate: concludeStep, isPending: isConcluding } = useConcludeStep();
	const { mutate: cancelStep, isPending: isCancelling } = useCancelStep();

	let observation = $state('');
	let responsableClient = $state('');
	let cancelReason = $state('');
	let showCancelDialog = $state(false);
	let isSaving = $state(false);
	let isEditMode = $state(false);
	let selectedImage = $state<Image | null>(null);
	let showImagePreview = $state(false);

	// Form is only enabled when step status is IN_PROGRESS
	const isFormEnabled = $derived(step?.status === 'IN_PROGRESS');
	
	// Check if current user is the responsable for this step
	const isResponsable = $derived(
		currentUser?.id !== undefined && 
		step?.responsable_id !== undefined && 
		currentUser.id === step.responsable_id
	);

	$effect(() => {
		if (step) {
			observation = step.observation || '';
			responsableClient = step.responsable_client || '';
			
			// Start in preview mode if there's saved data, otherwise start in edit mode
			// Only if form is enabled (IN_PROGRESS status)
			if (isFormEnabled) {
				const hasSavedData = (step.observation && step.observation.trim()) || (step.responsable_client && step.responsable_client.trim());
				isEditMode = !hasSavedData;
			} else {
				isEditMode = false; // Always preview mode for non-editable steps
			}
		}
	});

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'outline';
			case 'IN_PROGRESS':
				return 'secondary';
			case 'CONCLUDED':
				return 'default';
			case 'CANCELLED':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getStatusLabel(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'Pendente';
			case 'IN_PROGRESS':
				return 'Em Andamento';
			case 'CONCLUDED':
				return 'Concluído';
			case 'CANCELLED':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}

	async function handleSave() {
		if (!step) return;
		
		isSaving = true;
		try {
			updateStep(
				{
					id: step.id,
					data: {
						observation: observation.trim() || undefined,
						responsable_client: responsableClient.trim() || undefined,
					},
				},
				{
					onSuccess: () => {
						successToast.updated('Etapa');
						isEditMode = false; // Switch to preview mode
					},
					onError: () => {
						errorToast.update('Etapa');
					},
				},
			);
		} finally {
			isSaving = false;
		}
	}

	function handleEdit() {
		isEditMode = true;
	}

	function handleCancelEdit() {
		// Restore original values from step
		if (step) {
			observation = step.observation || '';
			responsableClient = step.responsable_client || '';
		}
		isEditMode = false;
	}

	function handleImageClick(image: Image) {
		selectedImage = image;
		showImagePreview = true;
	}

	function closeImagePreview() {
		showImagePreview = false;
		selectedImage = null;
	}

	function handleStart() {
		if (!step) return;
		
		startStep(step.id, {
			onSuccess: () => {
				successToast.updated('Etapa iniciada');
			},
			onError: () => {
				errorToast.update('Etapa');
			},
		});
	}

	function handleConclude() {
		if (!step) return;
		
		concludeStep(step.id, {
			onSuccess: () => {
				successToast.updated('Etapa concluída');
			},
			onError: () => {
				errorToast.update('Etapa');
			},
		});
	}

	function handleCancel() {
		if (!step) return;
		
		if (!cancelReason.trim()) {
			showError('Por favor, informe o motivo do cancelamento');
			return;
		}
		
		cancelStep(
			{
				id: step.id,
				reason: cancelReason.trim(),
			},
			{
				onSuccess: () => {
					successToast.updated('Etapa cancelada');
					showCancelDialog = false;
					cancelReason = '';
				},
				onError: () => {
					errorToast.update('Etapa');
				},
			},
		);
	}

	function openCancelDialog() {
		showCancelDialog = true;
		cancelReason = '';
	}

	function closeCancelDialog() {
		showCancelDialog = false;
		cancelReason = '';
	}

	function goToService() {
		if (step?.service_id) {
			goto(`/services/${step.service_id}`);
		}
	}

	function goToClient() {
		if (step?.service?.client_id) {
			goto(`/clients/${step.service.client_id}`);
		} else if (step?.service?.client?.id) {
			goto(`/clients/${step.service.client.id}`);
		}
	}
</script>

<svelte:head>
	<title>Etapa - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<Breadcrumbs />

	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar
			</Button>
			<div>
				<h1 class="text-3xl font-bold">Detalhes da Etapa</h1>
				<p class="text-muted-foreground">Gerencie os detalhes da etapa</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if step?.service?.client_id || step?.service?.client?.id}
				<Button variant="outline" onclick={goToClient}>
					<User class="w-4 h-4 mr-2" />
					Ver Cliente
				</Button>
			{/if}
			{#if step?.service_id}
				<Button variant="outline" onclick={goToService}>
					<ExternalLink class="w-4 h-4 mr-2" />
					Ver Serviço
				</Button>
			{/if}
		</div>
	</div>

	{#if isLoading}
		<Card>
			<CardContent class="p-6">
				<div class="space-y-4">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-32 w-full" />
				</div>
			</CardContent>
		</Card>
	{:else if isError || !step}
		<Card>
			<CardContent class="p-6">
				<div class="text-center">
					<p class="text-lg font-medium text-red-600">Erro ao carregar etapa</p>
					<p class="text-sm text-muted-foreground mt-2">
						{stepQuery.error?.message || 'Etapa não encontrada ou você não tem permissão para visualizá-la.'}
					</p>
					<Button onclick={() => goto('/dashboard')} class="mt-4">
						Voltar ao Dashboard
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Step Info -->
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>{step.name}</CardTitle>
								<CardDescription>{step.description}</CardDescription>
							</div>
							<Badge variant={getStatusBadgeVariant(step.status)}>
								{getStatusLabel(step.status)}
							</Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						{#if !isFormEnabled}
							<div class="bg-muted/50 border border-muted rounded-lg p-4">
								<p class="text-sm text-muted-foreground">
									{#if step.status === 'PENDING'}
										Para preencher este formulário, você precisa iniciar a etapa clicando no botão "Iniciar Etapa" ao lado.
									{:else if step.status === 'CONCLUDED'}
										Esta etapa já foi concluída e não pode mais ser editada.
									{:else if step.status === 'CANCELLED'}
										Esta etapa foi cancelada e não pode mais ser editada.
									{:else}
										O formulário está desabilitado.
									{/if}
								</p>
							</div>
						{/if}

						{#if isEditMode && isFormEnabled}
							<!-- Edit Mode: Form -->
							<!-- Observation -->
							<div class="space-y-2">
								<Label for="observation">Observação</Label>
								<textarea
									id="observation"
									placeholder="Adicione observações sobre esta etapa..."
									bind:value={observation}
									rows="4"
									disabled={!isFormEnabled}
									class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<!-- Responsable Client -->
							<div class="space-y-2">
								<Label for="responsable-client">Responsável no Cliente</Label>
								<Input
									id="responsable-client"
									type="text"
									placeholder="Nome do responsável no local do cliente"
									bind:value={responsableClient}
									disabled={!isFormEnabled}
								/>
							</div>

							<!-- Images Section -->
							<StepImagesUpload
								stepId={stepId}
								images={images}
								disabled={!isFormEnabled}
								onImageUploaded={() => {
									queryClient.invalidateQueries({ queryKey: ['steps', stepId, 'images'] });
								}}
								onImageDeleted={() => {
									queryClient.invalidateQueries({ queryKey: ['steps', stepId, 'images'] });
								}}
								onImageClick={handleImageClick}
							/>

							<!-- Save and Cancel Buttons -->
							<div class="flex justify-end gap-2">
								<Button 
									variant="outline" 
									onclick={handleCancelEdit} 
									disabled={isSaving || isUpdating}
								>
									<X class="w-4 h-4 mr-2" />
									Cancelar
								</Button>
								<Button onclick={handleSave} disabled={!isFormEnabled || isSaving || isUpdating}>
									{#if isSaving || isUpdating}
										<Loader2 class="w-4 h-4 mr-2 animate-spin" />
									{:else}
										<Save class="w-4 h-4 mr-2" />
									{/if}
									Salvar Alterações
								</Button>
							</div>
						{:else if isFormEnabled}
							<!-- Preview Mode: Read-only display -->
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<h3 class="text-lg font-semibold">Informações da Etapa</h3>
									<Button variant="outline" size="sm" onclick={handleEdit}>
										<Edit class="w-4 h-4 mr-2" />
										Editar
									</Button>
								</div>

								<!-- Observation Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Observação</Label>
									<div class="min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
										{#if observation}
											{observation}
										{:else}
											<span class="text-muted-foreground italic">Nenhuma observação adicionada</span>
										{/if}
									</div>
								</div>

								<!-- Responsable Client Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Responsável no Cliente</Label>
									<div class="min-h-[40px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
										{#if responsableClient}
											{responsableClient}
										{:else}
											<span class="text-muted-foreground italic">Não informado</span>
										{/if}
									</div>
								</div>

								<!-- Images Preview -->
								<div class="space-y-2">
									<Label class="text-sm font-medium text-muted-foreground">Imagens</Label>
									{#if images && images.length > 0}
										<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
											{#each images as image (image.id)}
												<div 
													class="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
													onclick={() => handleImageClick(image)}
												>
													<img
														src={image.path.startsWith('http') ? image.path : `${env.API_URL}${image.path}`}
														alt="Imagem da etapa"
														class="w-full h-full object-cover"
													/>
												</div>
											{/each}
										</div>
									{:else}
										<div class="border-2 border-dashed rounded-lg p-8 text-center">
											<ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
											<p class="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<!-- View Mode for non-editable steps -->
							<!-- Observation -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Observação</Label>
								<div class="min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
									{#if observation}
										{observation}
									{:else}
										<span class="text-muted-foreground italic">Nenhuma observação adicionada</span>
									{/if}
								</div>
							</div>

							<!-- Responsable Client -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Responsável no Cliente</Label>
								<div class="min-h-[40px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
									{#if responsableClient}
										{responsableClient}
									{:else}
										<span class="text-muted-foreground italic">Não informado</span>
									{/if}
								</div>
							</div>

							<!-- Images -->
							<div class="space-y-2">
								<Label class="text-sm font-medium text-muted-foreground">Imagens</Label>
								{#if images && images.length > 0}
									<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{#each images as image (image.id)}
											<div 
												class="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
												onclick={() => handleImageClick(image)}
											>
													<img
														src={image.path.startsWith('http') ? image.path : `${env.API_URL}${image.path}`}
														alt="Imagem da etapa"
														class="w-full h-full object-cover"
													/>
											</div>
										{/each}
									</div>
								{:else}
									<div class="border-2 border-dashed rounded-lg p-8 text-center">
										<ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
										<p class="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
									</div>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Cancel Reason (if cancelled) -->
				{#if step.status === 'CANCELLED' && step.reason_cancellament}
					<Card>
						<CardHeader>
							<CardTitle>Motivo do Cancelamento</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-sm">{step.reason_cancellament}</p>
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Step Details -->
				<Card>
					<CardHeader>
						<CardTitle>Informações</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Serviço</p>
							<p class="text-sm">
								{#if step.service}
									Serviço #{step.service.id}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Cliente</p>
							<p class="text-sm">
								{#if step.service?.client}
									{step.service.client.name}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Responsável</p>
							<div class="text-sm">
								{#if step.responsable}
									<div class="flex items-center gap-2">
										<User class="w-4 h-4 text-muted-foreground" />
										<span>{step.responsable.name}</span>
										{#if step.responsable.email}
											<span class="text-xs text-muted-foreground">({step.responsable.email})</span>
										{/if}
									</div>
								{:else}
									<span class="text-muted-foreground">Não atribuído</span>
								{/if}
							</div>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Início</p>
							<p class="text-sm">
								{#if step.datetime_start}
									{formatDate(step.datetime_start)}
								{:else}
									<span class="text-muted-foreground">Não iniciado</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
							<p class="text-sm">
								{#if step.datetime_conclusion}
									{formatDate(step.datetime_conclusion)}
								{:else}
									<span class="text-muted-foreground">Não concluído</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Expiração</p>
							<p class="text-sm">
								{#if step.datetime_expiration}
									{formatDate(step.datetime_expiration)}
								{:else}
									<span class="text-muted-foreground">Sem expiração</span>
								{/if}
							</p>
						</div>
					</CardContent>
				</Card>

				<!-- Actions -->
				<Card>
					<CardHeader>
						<CardTitle>Ações</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						{#if !isResponsable}
							<div class="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
								<div class="flex items-center gap-2">
									<User class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
									<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
										Você não é o responsável por esta etapa. Apenas o responsável pode iniciar, concluir ou cancelar.
									</p>
								</div>
							</div>
						{:else if step.status === 'PENDING'}
							<Button
								class="w-full"
								onclick={handleStart}
								disabled={isStarting}
							>
								{#if isStarting}
									<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								{:else}
									<Play class="w-4 h-4 mr-2" />
								{/if}
								Iniciar Etapa
							</Button>
						{:else if step.status === 'IN_PROGRESS'}
							<Button
								class="w-full"
								variant="default"
								onclick={handleConclude}
								disabled={isConcluding}
							>
								{#if isConcluding}
									<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								{:else}
									<CheckCircle class="w-4 h-4 mr-2" />
								{/if}
								Concluir Etapa
							</Button>
							<Button
								class="w-full"
								variant="destructive"
								onclick={openCancelDialog}
								disabled={isCancelling}
							>
								<XCircle class="w-4 h-4 mr-2" />
								Cancelar Etapa
							</Button>
						{:else if step.status === 'CONCLUDED'}
							<div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
								<div class="flex items-center gap-2">
									<CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
									<p class="text-sm font-medium text-green-800 dark:text-green-200">
										Esta etapa já foi concluída
									</p>
								</div>
							</div>
						{:else if step.status === 'CANCELLED'}
							<div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
								<div class="flex items-center gap-2">
									<XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
									<p class="text-sm font-medium text-red-800 dark:text-red-200">
										Esta etapa foi cancelada
									</p>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>

<!-- Image Preview Dialog -->
<Dialog.Root bind:open={showImagePreview}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] p-0">
		{#if selectedImage}
			<div class="relative w-full h-full">
				<img
					src={selectedImage.path.startsWith('http') ? selectedImage.path : `${env.API_URL}${selectedImage.path}`}
					alt="Preview da imagem"
					class="w-full h-auto max-h-[85vh] object-contain"
				/>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<ConfirmationDialog
	bind:open={showCancelDialog}
	title="Cancelar Etapa"
	description="Tem certeza que deseja cancelar esta etapa? Esta ação requer um motivo."
	confirmText="Cancelar Etapa"
	cancelText="Voltar"
	variant="destructive"
	icon="warning"
	loading={isCancelling}
	onConfirm={handleCancel}
	onCancel={closeCancelDialog}
>
	<div class="space-y-2 mt-4">
		<Label for="cancel-reason">Motivo do Cancelamento *</Label>
		<textarea
			id="cancel-reason"
			placeholder="Informe o motivo do cancelamento..."
			bind:value={cancelReason}
			rows="3"
			required
			class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
	</div>
</ConfirmationDialog>

