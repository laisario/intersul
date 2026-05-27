<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Step, StepChecklist } from '$lib/api/types/service.types.js';
	import { daysUntilExpiration, getExpirationBadgeClasses } from '$lib/utils/formatting';
	import { getServicePriorityLabel, getServicePriorityVariant } from '$lib/utils/constants.js';
	import { useToggleChecklist, useStartStep } from '$lib/hooks/queries/use-steps.svelte.js';
	import { successToast, showError } from '$lib/utils/toast.js';
	import { user } from '$lib/stores/auth.svelte.js';
	import { Play, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, ClipboardList, User, Calendar, AlertTriangle } from 'lucide-svelte';

	let {
		step,
		isLoading = false,
		highlighted = false,
		layout = 'stack',
		onStart = () => {},
		onFillForm = () => {},
		onComplete = () => {},
		onCancel = () => {},
		onCardClick = () => {},
	} = $props<{
		step?: Step;
		isLoading?: boolean;
		highlighted?: boolean;
		layout?: 'stack' | 'horizontal';
		onStart?: (step: Step) => void;
		onFillForm?: (step: Step) => void;
		onComplete?: (step: Step) => void;
		onCancel?: (step: Step) => void;
		onCardClick?: (step: Step) => void;
	}>();

	const { mutate: toggleChecklist, isPending: isTogglingChecklist } = useToggleChecklist();
	const { mutate: startStep, isPending: isStarting } = useStartStep();
	let expandedChecklist = $state(false);

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'pending';
			case 'IN_PROGRESS':
				return 'in-progress';
			case 'CONCLUDED':
			case 'COMPLETED':
				return 'concluded';
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

	function getDays(stepDatetimeExpiration: string): number {
		return daysUntilExpiration(stepDatetimeExpiration);
	}

	function handleToggleChecklist(checklist: StepChecklist) {
		if (!step || !isResponsable) return;

		if (step.status === 'PENDING') {
			startStep(step.id, {
				onSuccess: () => {
					successToast.updated('Etapa iniciada');
					toggleChecklist(checklist.id, {
						onError: () => showError('Erro ao atualizar checklist'),
					});
				},
				onError: (error: any) => {
					const message =
						error?.response?.data?.errors?.[0]?.message ||
						error?.response?.data?.message ||
						'Erro ao iniciar etapa';
					showError(message);
				},
			});
		} else if (step.status === 'IN_PROGRESS') {
			toggleChecklist(checklist.id, {
				onError: () => showError('Erro ao atualizar checklist'),
			});
		}
	}

	const isPending = $derived(step?.status === 'PENDING');
	const isInProgress = $derived(step?.status === 'IN_PROGRESS');
	const isCompleted = $derived(step?.status === 'CONCLUDED' || step?.status === 'COMPLETED');
	const isCancelled = $derived(step?.status === 'CANCELLED');
	const isActionable = $derived(isPending || isInProgress);
	const currentUser = $derived($user);
	const isResponsable = $derived(
		currentUser?.id !== undefined &&
		step?.responsable?.id !== undefined &&
		currentUser.id === step.responsable.id
	);
	const serviceDescription = $derived(step?.service?.description?.trim());
</script>

{#if isLoading}
	<div class="bg-card rounded-lg border p-4 space-y-4">
		<div class="flex items-start justify-between">
			<div class="space-y-2 flex-1">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-4 w-48" />
			</div>
			<Skeleton class="h-6 w-20" />
		</div>
		<Skeleton class="h-4 w-full" />
		<Skeleton class="h-10 w-full" />
	</div>
{:else if step}
	<div
		class="bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow {highlighted ? 'ring-2 ring-primary ring-offset-2' : ''}"
		onclick={() => onCardClick(step)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && onCardClick(step)}
	>
		<!-- Header -->
		<div class="p-4 pb-3 border-b">
			<div class="flex items-start justify-between gap-3">
				<div class="flex-1 min-w-0">
					{#if step.service?.client}
						<p class="text-sm text-muted-foreground">{step.service.client.name}</p>
					{/if}
					<h3 class="font-semibold text-base mt-1">{step.name}</h3>
				</div>
				<Badge variant={getStatusBadgeVariant(step.status)} class="shrink-0">
					{getStatusLabel(step.status)}
				</Badge>
			</div>
		</div>

		<!-- Body -->
		<div class="p-4 space-y-3">
			<!-- Service and Priority -->
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">
					{#if step.service}
						Serviço #{step.service.id}
					{:else}
						-
					{/if}
				</span>
				{#if step.service?.priority}
					<Badge variant={getServicePriorityVariant(step.service.priority)} class="text-xs">
						{getServicePriorityLabel(step.service.priority)}
					</Badge>
				{/if}
			</div>

			<!-- Expiration -->
			{#if step.datetimeExpiration}
				{@const days = getDays(step.datetimeExpiration)}
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Vencimento</span>
					<span
						class={`px-2 py-1 rounded-md text-xs font-medium ${getExpirationBadgeClasses(days)}`}
					>
						{days} dia{days > 1 ? 's' : ''}
					</span>
				</div>
			{/if}

			<!-- Description (Additional Information) -->
			{#if step.description}
				<div class="text-sm text-muted-foreground pt-2 border-t">
					<p>{step.description}</p>
				</div>
			{/if}

			<!-- Checklist -->
			{#if step.checklists && step.checklists.length > 0}
				<div class="border-t pt-3" onclick={(e) => { e.stopPropagation(); expandedChecklist = !expandedChecklist; }}>
					<button
						type="button"
						class="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							expandedChecklist = !expandedChecklist;
						}}
					>
						<span>
							Checklist ({step.checklists.filter((c) => c.completed).length}/{step.checklists.length})
						</span>
						{#if expandedChecklist}
							<ChevronUp class="w-4 h-4" />
						{:else}
							<ChevronDown class="w-4 h-4" />
						{/if}
					</button>

					{#if expandedChecklist}
						<div class="mt-2 space-y-2" role="presentation" onclick={(e) => e.stopPropagation()}>
							{#each step.checklists as checklist (checklist.id)}
								<label class="flex items-start gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={checklist.completed}
										disabled={!isActionable || isStarting || isTogglingChecklist}
										onchange={() => handleToggleChecklist(checklist)}
										class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
									/>
									<span
										class={`text-sm ${
											checklist.completed ? 'line-through text-muted-foreground' : ''
										}`}
									>
										{checklist.description}
									</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Form info -->
			{#if serviceDescription || step.responsableClient || step.observation}
				<div class="border-t pt-3 space-y-2">
					{#if serviceDescription}
						<div>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">DESCRIÇÃO DO SERVIÇO</p>
							<p class="text-sm mt-0.5 whitespace-pre-wrap">{serviceDescription}</p>
						</div>
					{/if}
					{#if step.responsableClient}
						<div>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resp. no cliente</p>
							<p class="text-sm mt-0.5">{step.responsableClient}</p>
						</div>
					{/if}
					{#if step.observation}
						<div>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observação</p>
							<p class="text-sm mt-0.5 whitespace-pre-wrap">{step.observation}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Actions Footer -->
		{#if isActionable}
			<div class="p-3 border-t bg-muted/20">
				{#if isPending}
					<Button
						disabled={isStarting}
						onclick={(e) => {
							e.stopPropagation();
							onStart(step);
						}}
						class="w-full"
						size="sm"
						title="Iniciar Etapa"
					>
						<Play class="w-4 h-4" />
					</Button>
				{:else if isInProgress}
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								onFillForm(step);
							}}
							title="Preencher Formulário"
							class="flex-1"
						>
							<FileText class="w-4 h-4" />
						</Button>
						<Button
							variant="default"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								onComplete(step);
							}}
							title="Concluir Etapa"
							class="flex-1"
						>
							<CheckCircle class="w-4 h-4" />
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								onCancel(step);
							}}
							title="Cancelar Etapa"
						>
							<XCircle class="w-4 h-4" />
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else if step && layout === 'horizontal'}
	<div
		class="bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow {highlighted ? 'ring-2 ring-primary ring-offset-2' : ''}"
		onclick={() => onCardClick(step)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && onCardClick(step)}
	>
		<!-- Desktop Horizontal Layout: Left | Middle | Right -->
		<div class="flex flex-col lg:flex-row">
			<!-- Left Section: Main Info -->
			<div class="flex-1 p-4 border-b lg:border-b-0 lg:border-r space-y-3 min-w-0">
				<!-- Client & Step Name -->
				<div>
					{#if step.service?.client}
						<p class="text-sm text-muted-foreground">{step.service.client.name}</p>
					{/if}
					<h3 class="font-semibold text-base mt-1">{step.name}</h3>
				</div>

				<!-- Service & Priority -->
				<div class="flex items-center gap-3 text-sm">
					<span class="text-muted-foreground">
						{#if step.service}
							Serviço #{step.service.id}
						{:else}
							-
						{/if}
					</span>
					{#if step.service?.priority}
						<Badge variant={getServicePriorityVariant(step.service.priority)} class="text-xs">
							{getServicePriorityLabel(step.service.priority)}
						</Badge>
					{/if}
					<Badge variant={getStatusBadgeVariant(step.status)} class="text-xs">
						{getStatusLabel(step.status)}
					</Badge>
				</div>

				<!-- Description -->
				{#if step.description}
					<p class="text-sm text-muted-foreground line-clamp-2">{step.description}</p>
				{/if}

				<!-- Expiration & Metadata -->
				<div class="flex flex-wrap items-center gap-4 text-sm">
					{#if step.datetimeExpiration}
						{@const days = getDays(step.datetimeExpiration)}
						<div class="flex items-center gap-1">
							<Calendar class="w-4 h-4 text-muted-foreground" />
							<span class="text-muted-foreground">Venc:</span>
							<span class={`px-2 py-0.5 rounded text-xs font-medium ${getExpirationBadgeClasses(days)}`}>
								{days} dia{days > 1 ? 's' : ''}
							</span>
						</div>
					{/if}
					{#if step.responsableClient}
						<div class="flex items-center gap-1">
							<User class="w-4 h-4 text-muted-foreground" />
							<span class="text-muted-foreground">Resp:</span>
							<span class="truncate">{step.responsableClient}</span>
						</div>
					{/if}
				</div>

				<!-- Observation (compact) -->
				{#if step.observation}
					<div class="text-xs text-muted-foreground line-clamp-1 bg-muted/30 rounded px-2 py-1">
						{step.observation}
					</div>
				{/if}
			</div>

			<!-- Middle Section: Checklist -->
			<div class="w-full lg:w-64 border-b lg:border-b-0 lg:border-r p-4 shrink-0" onclick={(e) => e.stopPropagation()}>
				{#if step.checklists && step.checklists.length > 0}
					<button
						type="button"
						class="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							expandedChecklist = !expandedChecklist;
						}}
					>
						<span class="flex items-center gap-2">
							<ClipboardList class="w-4 h-4" />
							Checklist ({step.checklists.filter((c) => c.completed).length}/{step.checklists.length})
						</span>
						{#if expandedChecklist}
							<ChevronUp class="w-4 h-4" />
						{:else}
							<ChevronDown class="w-4 h-4" />
						{/if}
					</button>

					{#if expandedChecklist}
						<div class="mt-2 space-y-2 max-h-48 overflow-y-auto" role="presentation" onclick={(e) => e.stopPropagation()}>
							{#each step.checklists as checklist (checklist.id)}
								<label class="flex items-start gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={checklist.completed}
										disabled={!isActionable || isStarting || isTogglingChecklist}
										onchange={() => handleToggleChecklist(checklist)}
										class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
									/>
									<span
										class={`text-sm ${
											checklist.completed ? 'line-through text-muted-foreground' : ''
										}`}
									>
										{checklist.description}
									</span>
								</label>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="text-sm text-muted-foreground italic">
						Sem itens de checklist
					</div>
				{/if}
			</div>

			<!-- Right Section: Actions -->
			<div class="w-full lg:w-auto p-4 shrink-0 lg:flex lg:flex-col lg:justify-center">
				{#if isActionable}
					{#if isPending}
						<Button
							disabled={isStarting}
							onclick={(e) => {
								e.stopPropagation();
								onStart(step);
							}}
							class="w-full lg:w-auto"
							size="sm"
							title="Iniciar Etapa"
						>
							<Play class="w-4 h-4 mr-2" />
							Iniciar
						</Button>
					{:else if isInProgress}
						<div class="flex flex-col gap-2 lg:flex-row lg:items-stretch">
							<Button
								variant="outline"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									onFillForm(step);
								}}
								title="Preencher Formulário"
							>
								<FileText class="w-4 h-4 mr-2" />
								Form
							</Button>
							<Button
								variant="default"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									onComplete(step);
								}}
								title="Concluir Etapa"
							>
								<CheckCircle class="w-4 h-4 mr-2" />
								Concluir
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									onCancel(step);
								}}
								title="Cancelar Etapa"
							>
								<XCircle class="w-4 h-4" />
							</Button>
						</div>
					{/if}
				{:else}
					<div class="text-sm text-muted-foreground">
						{getStatusLabel(step.status)}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
