
<script lang="ts">
	import { page } from '$app/stores';
	import { useService, useServices, useUpdateService } from '$lib/hooks/queries/use-services.svelte.js';
	import { formatDate, formatCurrency, getPaymentMethodLabel } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { ArrowLeft, CheckCircle, Clock, User, Printer, MapPin, Phone, Mail, Calendar, FileText, XCircle, Loader2, Copy } from 'lucide-svelte';
	import { copyToClipboard } from '$lib/utils/clipboard.js';
	import { goto } from '$app/navigation';
	import { ACQUISITION_TYPE, getServiceStatusLabel, getServiceStatusVariant, getServicePriorityLabel, getServicePriorityVariant } from '$lib/utils/constants.js';
	import { successToast, showError, getApiErrorMessage } from '$lib/utils/toast.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import type { AcquisitionType, ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';
	import type { Client } from '$lib/api/types/client.types.js';
	import type { ServiceQueryParams, Step } from '$lib/api/types/service.types.js';

	const serviceId = Number($page.params.id);
	const serviceQuery = useService(serviceId);
	const service = $derived(serviceQuery.data);
	const isLoading = $derived(serviceQuery.isLoading);
	const updateServiceMutation = useUpdateService();
	let machineHistoryFilters = $state<ServiceQueryParams | undefined>(undefined);
	let showCancelDialog = $state(false);
	let showConcludeDialog = $state(false);
	let cancelReason = $state('');
	let isConcluding = $state(false);
	let isCancelling = $state(false);

	const machineServicesQuery = useServices(() => machineHistoryFilters);
	const machineServices = $derived(
		(machineServicesQuery.data?.data ?? []).filter((item) => item.id !== service?.id)
	);
	const machineServicesLoading = $derived(machineServicesQuery.isLoading);

	const STEP_STATUS_LABELS: Record<string, string> = {
		// Backend format (uppercase)
		'PENDING': 'Pendente',
		'IN_PROGRESS': 'Em Andamento',
		'CONCLUDED': 'Concluído',
		'CANCELLED': 'Cancelado',
		// Frontend format (lowercase) - for compatibility
		'pending': 'Pendente',
		'in_progress': 'Em Andamento',
		'concluded': 'Concluído',
		'cancelled': 'Cancelado',
		// Legacy format
		'completed': 'Concluído',
		'skipped': 'Ignorado'
	};

	function goBack() {
		goto('/services');
	}

	function getStepStatusIcon(status: string) {
		const normalizedStatus = status.toUpperCase();
		switch (normalizedStatus) {
			case 'CONCLUDED':
			case 'COMPLETED':
				return CheckCircle;
			case 'IN_PROGRESS':
				return Clock;
			default:
				return Clock;
		}
	}

	function getStepStatusColor(status: string) {
		const normalizedStatus = status.toUpperCase();
		switch (normalizedStatus) {
			case 'CONCLUDED':
			case 'COMPLETED':
				return 'text-green-600';
			case 'IN_PROGRESS':
				return 'text-blue-600';
			default:
				return 'text-gray-600';
		}
	}

	function formatStepStatus(status?: string) {
		if (!status) return 'Pendente';
		// Try original format first
		if (STEP_STATUS_LABELS[status]) {
			return STEP_STATUS_LABELS[status];
		}
		// Try uppercase (backend format)
		const upperStatus = status.toUpperCase();
		if (STEP_STATUS_LABELS[upperStatus]) {
			return STEP_STATUS_LABELS[upperStatus];
		}
		// Try lowercase (frontend format)
		const lowerStatus = status.toLowerCase();
		if (STEP_STATUS_LABELS[lowerStatus]) {
			return STEP_STATUS_LABELS[lowerStatus];
		}
		return status;
	}

	function formatClientAddress(client?: Client) {
		const address = client?.address;
		if (!address) return 'Endereço não informado';

		const streetParts = [];
		if (address.street) streetParts.push(address.street);
		if (address.number) streetParts.push(address.number);
		if (address.complement) streetParts.push(address.complement);

		const locationParts = [];
		if (address.neighborhood?.name) locationParts.push(address.neighborhood.name);
		if (address.neighborhood?.city?.name) {
			let cityPart = address.neighborhood.city.name;
			if (address.neighborhood.city.state?.code) {
				cityPart = `${cityPart} - ${address.neighborhood.city.state.code}`;
			}
			locationParts.push(cityPart);
		}

		const formatted = [streetParts.join(', '), locationParts.join(' • ')].filter(Boolean).join(' • ');
		return formatted || 'Endereço não informado';
	}

	function formatAcquisitionType(type?: AcquisitionType) {
		if (!type) return 'Não informado';
		return ACQUISITION_TYPE[type]?.label ?? type;
	}

	function resolveMachineModel(machine: ClientCopyMachine | undefined) {
		if (!machine) return 'Não informado';
		return (
			machine.catalogCopyMachine?.model ??
			machine.externalModel ??
			'EQUIPAMENTO'
		);
	}

	function resolveMachineManufacturer(machine: ClientCopyMachine | undefined) {
		if (!machine) return 'Não informado';
		return (
			machine.catalogCopyMachine?.manufacturer ??
			machine.externalManufacturer ??
			'Não informado'
		);
	}

	$effect(() => {
		if (service?.clientCopyMachineId) {
			machineHistoryFilters = {
				clientCopyMachineId: service.clientCopyMachineId,
				page: 1,
				limit: 5
			};
		} else {
			machineHistoryFilters = undefined;
		}
	});

	function checkAllStepsConcluded(): boolean {
		if (!service?.steps || service.steps.length === 0) {
			return true; // No steps means we can conclude
		}
		// Check if all steps are concluded
		return service.steps.every(step => {
			const status = step.status?.toUpperCase();
			return status === 'CONCLUDED' || status === 'COMPLETED';
		});
	}

	function openConcludeDialog() {
		const allStepsConcluded = checkAllStepsConcluded();
		if (allStepsConcluded) {
			// If all steps are concluded, proceed directly
			handleConclude();
		} else {
			// If not all steps are concluded, show confirmation dialog
			showConcludeDialog = true;
		}
	}

	async function handleConclude() {
		if (!service) return;
		isConcluding = true;
		try {
			await updateServiceMutation.mutateAsync({
				id: service.id,
				data: { status: 'CONCLUDED' }
			});
			successToast.updated('serviço');
			showConcludeDialog = false;
			serviceQuery.refetch();
		} catch (error: any) {
			console.error('Error concluding service:', error);
			showError(getApiErrorMessage(error, 'Erro ao atualizar o serviço. Tente novamente.'));
		} finally {
			isConcluding = false;
		}
	}

	async function handleCancel() {
		if (!service) return;
		if (!cancelReason.trim()) {
			return; // Don't proceed if reason is empty
		}
		isCancelling = true;
		try {
			await updateServiceMutation.mutateAsync({
				id: service.id,
				data: {
					status: 'CANCELLED',
					reasonCancellament: cancelReason.trim()
				}
			});
			successToast.updated('serviço');
			showCancelDialog = false;
			cancelReason = '';
			serviceQuery.refetch();
		} catch (error: any) {
			console.error('Error cancelling service:', error);
			showError(getApiErrorMessage(error, 'Erro ao atualizar o serviço. Tente novamente.'));
		} finally {
			isCancelling = false;
		}
	}

	function closeCancelDialog() {
		showCancelDialog = false;
		cancelReason = '';
	}

	function copyStepLink(step: Step) {
		if (!step.id) return;

		const clientName = service?.client?.name?.trim() || 'Cliente não informado';
		const stepTitle = step.name?.trim() || 'Etapa sem título';
		const url = `${window.location.origin}/?stepId=${step.id}`;
		const message = `Cliente: ${clientName}\nEtapa: ${stepTitle}\nLink: ${url}`;

		copyToClipboard(message, 'Link copiado!');
	}
</script>

<svelte:head>
	<title>Serviço #{serviceId} - Intersul</title>
</svelte:head>

{#if isLoading}
	<div class="space-y-6">
		<!-- Header Skeleton -->
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<Skeleton class="h-10 w-10" />
				<div>
					<Skeleton class="h-8 w-48" />
					<Skeleton class="h-4 w-32 mt-2" />
				</div>
			</div>
			<Skeleton class="h-10 w-32" />
		</div>

		<!-- Content Skeleton -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-32" />
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each Array(3) as _}
								<div class="flex items-center space-x-3">
									<Skeleton class="h-8 w-8 rounded-full" />
									<div class="space-y-2">
										<Skeleton class="h-4 w-[200px]" />
										<Skeleton class="h-3 w-[100px]" />
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton class="h-4 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{:else if service}
	<div class="space-y-6 px-6">
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div class="flex items-center space-x-4">
				<Button variant="ghost" size="sm" onclick={goBack}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Voltar
				</Button>
				<div>
					<h1 class="text-3xl font-bold">Serviço #{service.id}</h1>
					<p class="text-muted-foreground">
						Cliente: {service.client?.name || '-'} • Categoria: {service.category?.name || '-'} • Criado em: {formatDate(service.createdAt)}
					</p>
				</div>
			</div>
			{#if service.status === 'CONCLUDED' || service.status === 'concluded' || service.status === 'COMPLETED' || service.status === 'completed'}
				<div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
					<div class="flex items-center gap-2">
						<CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
						<p class="text-sm font-medium text-green-800 dark:text-green-200">
							Este serviço já foi concluído
						</p>
					</div>
				</div>
			{:else if service.status === 'CANCELLED' || service.status === 'cancelled'}
				<div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
					<div class="flex items-center gap-2">
						<XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
						<p class="text-sm font-medium text-red-800 dark:text-red-200">
							Este serviço foi cancelado
						</p>
					</div>
				</div>
			{:else if service.status === 'IN_PROGRESS' || service.status === 'in_progress'}
				<div class="flex flex-col sm:flex-row gap-2">
					<Button
						variant="default"
						onclick={openConcludeDialog}
						disabled={isConcluding || isCancelling}
						class="w-full sm:w-auto"
					>
						{#if isConcluding}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						{:else}
							<CheckCircle class="w-4 h-4 mr-2" />
						{/if}
						Concluir Serviço
					</Button>
					<Button
						variant="destructive"
						onclick={() => showCancelDialog = true}
						disabled={isConcluding || isCancelling}
						class="w-full sm:w-auto"
					>
						<XCircle class="w-4 h-4 mr-2" />
						Cancelar Serviço
					</Button>
				</div>
			{/if}
		</div>

		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Service Steps -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<FileText class="w-5 h-5 mr-2" />
							Passos do Serviço
						</CardTitle>
					</CardHeader>
					<CardContent>
						{#if service.steps && service.steps.length > 0}
							<div class="space-y-4">
								{#each service.steps as step, index}
									{@const status = step?.status ?? 'PENDING'}
									{@const StatusIcon = getStepStatusIcon(status)}
									{@const normalizedStatus = status.toUpperCase()}
									<div 
										role="button"
										tabindex="0"
										class="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
										onclick={() => step.id && goto(`/steps/${step.id}?from=service&serviceId=${serviceId}`)}
										onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && step.id ? goto(`/steps/${step.id}?from=service&serviceId=${serviceId}`) : null}
									>
										<div class="flex-shrink-0">
											<div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
												<span class="text-sm font-medium">{index + 1}</span>
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between gap-2">
												<h4 class="font-medium">{step.name || `Passo ${index + 1}`}</h4>
												<div class="flex items-center gap-1.5">
													<StatusIcon class="w-4 h-4 {getStepStatusColor(status)}" />
													<Badge variant={
														normalizedStatus === 'CONCLUDED' || normalizedStatus === 'COMPLETED' ? 'default' :
														normalizedStatus === 'IN_PROGRESS' ? 'secondary' :
														normalizedStatus === 'CANCELLED' ? 'destructive' :
														'outline'
													}>
														{formatStepStatus(status)}
													</Badge>
													{#if step.id}
														<button
															type="button"
															onclick={(e) => { e.stopPropagation(); copyStepLink(step); }}
															class="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
															title="Copiar link desta etapa"
															aria-label="Copiar link desta etapa"
														>
															<Copy class="w-3.5 h-3.5" />
														</button>
													{/if}
												</div>
											</div>
											{#if step.description}
												<p class="text-sm text-muted-foreground mt-1">{step.description}</p>
											{/if}
											{#if step.responsable}
												<div class="flex items-center space-x-2 mt-2">
													<User class="w-4 h-4 text-muted-foreground" />
													<span class="text-sm text-muted-foreground">
														Responsável: {step.responsable.name}
													</span>
												</div>
											{/if}
											{#if step.datetimeConclusion}
												<div class="flex items-center space-x-2 mt-2">
													<Calendar class="w-4 h-4 text-muted-foreground" />
													<span class="text-sm text-muted-foreground">
														Concluído em: {formatDate(step.datetimeConclusion)}
													</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<FileText class="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p class="text-lg font-medium">Nenhum passo registrado</p>
								<p class="text-sm">Os passos configurados para a categoria serão exibidos aqui.</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				{#if service.clientCopyMachineId}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center">
								<Clock class="w-5 h-5 mr-2" />
								Histórico recente da máquina
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if machineServicesLoading}
								<div class="space-y-3">
									{#each Array(3) as _}
										<div class="flex items-center justify-between gap-3 rounded-lg border p-3">
											<div class="flex-1 space-y-2">
												<Skeleton class="h-4 w-3/4" />
												<Skeleton class="h-3 w-1/2" />
											</div>
											<Skeleton class="h-8 w-20" />
										</div>
									{/each}
								</div>
							{:else if machineServices.length === 0}
								<div class="text-sm text-muted-foreground">
									Nenhum histórico recente encontrado para este equipamento.
								</div>
							{:else}
								<div class="space-y-3">
									{#each machineServices as related}
										<div class="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
											<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
												<div>
													<p class="font-medium text-sm">
														Serviço #{related.id} • {related.category?.name || 'Sem categoria'}
													</p>
													<p class="text-xs text-muted-foreground">
														Criado em {related.createdAt ? formatDate(related.createdAt) : '-'}
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onclick={() => goto(`/services/${related.id}`)}
												>
													Ver detalhes
												</Button>
											</div>
											{#if related.description}
												<p class="text-sm text-muted-foreground line-clamp-2">
													{related.description}
												</p>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Service Info & Machine -->
			<div class="space-y-6">
				<!-- Service Info -->
				<Card>
					<CardHeader>
						<CardTitle>Informações do Serviço</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4 text-sm">
						<div>
							<span class="font-medium text-muted-foreground block">ID</span>
							<span class="mt-1 block">#{service.id}</span>
						</div>
						<div>
							<span class="font-medium text-muted-foreground block">Categoria</span>
							<span class="mt-1 block">{service.category?.name || 'Não informado'}</span>
						</div>
						{#if !service.isInternal && (service.amountToReceive || service.paymentMethod || service.isInvoiced !== undefined)}
							<div class="border-t pt-4 mt-4">
								<h4 class="font-semibold mb-3">Informações de Pagamento</h4>
								{#if service.amountToReceive}
									<div class="mb-2">
										<span class="font-medium text-muted-foreground block">Valor a Receber</span>
										<span class="mt-1 block font-semibold text-primary">{formatCurrency(service.amountToReceive)}</span>
									</div>
								{/if}
								{#if service.paymentMethod}
									<div class="mb-2">
										<span class="font-medium text-muted-foreground block">Método de Pagamento</span>
										<span class="mt-1 block">{getPaymentMethodLabel(service.paymentMethod)}</span>
									</div>
								{/if}
								{#if service.isInvoiced !== undefined}
									<div>
										<span class="font-medium text-muted-foreground block">Status do Pagamento</span>
										<span class="mt-1 block">
											<Badge variant={service.isInvoiced ? 'default' : 'outline'}>
												{service.isInvoiced ? 'Pago' : 'Pendente'}
											</Badge>
										</span>
									</div>
								{/if}
							</div>
						{/if}

						<div>
							<span class="font-medium text-muted-foreground block">Prioridade</span>
							<span class="mt-1 block">
								{#if service.priority}
									<Badge variant={getServicePriorityVariant(service.priority)}>
										{getServicePriorityLabel(service.priority)}
									</Badge>
								{:else}
									<span class="text-muted-foreground">Não informado</span>
								{/if}
							</span>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Status</span>
							<span class="mt-1 block">
								{#if service.status}
								<Badge
									variant={getServiceStatusVariant(service.status)}
								>
										{getServiceStatusLabel(service.status)}
									</Badge>
								{:else}
									<span class="text-muted-foreground">Não informado</span>
								{/if}
							</span>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Descrição</span>
							<p class="mt-1 text-sm whitespace-pre-line">
								{service.description || 'Nenhuma descrição fornecida.'}
							</p>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Criado em</span>
							<span class="mt-1 block">{formatDate(service.createdAt)}</span>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Atualizado em</span>
							<span class="mt-1 block">{formatDate(service.updatedAt)}</span>
						</div>
					</CardContent>
				</Card>

				<!-- Client Info (only if client exists) -->
				{#if service.client}
					<Card>
						<CardHeader>
							<CardTitle>Informações do Cliente</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4 text-sm">
							<div>
								<span class="font-medium text-muted-foreground block">Nome</span>
								<span class="mt-1 block">{service.client.name}</span>
							</div>

							{#if service.client.email}
								<div class="flex items-center gap-2">
									<Mail class="w-4 h-4 text-muted-foreground" />
									<span>{service.client.email}</span>
								</div>
							{/if}

							{#if service.client.phone}
								<div class="flex items-center gap-2">
									<Phone class="w-4 h-4 text-muted-foreground" />
									<span>{service.client.phone}</span>
								</div>
							{/if}

							<div class="flex items-start gap-2">
								<MapPin class="w-4 h-4 text-muted-foreground mt-1" />
								<span>{formatClientAddress(service.client)}</span>
							</div>

							{#if service.client.address?.postalCode}
								<div>
									<span class="font-medium text-muted-foreground block">CEP</span>
									<span class="mt-1 block">{service.client.address.postalCode}</span>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}

				<!-- Machine Info (only if linked) -->
				{#if service.clientCopyMachine}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center">
								<Printer class="w-5 h-5 mr-2" />
								Informações da Máquina
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4 text-sm">
							<div>
								<span class="font-medium text-muted-foreground block">Modelo</span>
								<span class="mt-1 block">{resolveMachineModel(service.clientCopyMachine)}</span>
							</div>
							<div>
								<span class="font-medium text-muted-foreground block">Fabricante</span>
								<span class="mt-1 block">{resolveMachineManufacturer(service.clientCopyMachine)}</span>
							</div>
							<div>
								<span class="font-medium text-muted-foreground block">Número de Série</span>
								<span class="mt-1 block">{service.clientCopyMachine.serialNumber}</span>
							</div>
							<div>
								<span class="font-medium text-muted-foreground block">Tipo de Aquisição</span>
								<span class="mt-1 block">{formatAcquisitionType(service.clientCopyMachine.acquisitionType)}</span>
							</div>
							{#if service.clientCopyMachine.value}
								<div>
									<span class="font-medium text-muted-foreground block">Valor</span>
									<span class="mt-1 block">{formatCurrency(service.clientCopyMachine.value)}</span>
								</div>
							{/if}
							{#if service.clientCopyMachine.externalDescription}
								<div>
									<span class="font-medium text-muted-foreground block">Descrição</span>
									<p class="mt-1 text-sm whitespace-pre-line">
										{service.clientCopyMachine.externalDescription}
									</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<div class="text-muted-foreground">
			<p class="text-lg font-medium">Serviço não encontrado</p>
			<p class="text-sm">O serviço solicitado não existe ou foi removido.</p>
			<Button variant="outline" class="mt-4" onclick={goBack}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar ao Dashboard
			</Button>
		</div>
	</div>
{/if}

<!-- Conclude Service Dialog -->
<ConfirmationDialog
	bind:open={showConcludeDialog}
	title="Concluir Serviço"
	description="Nem todas as etapas deste serviço foram concluídas. Deseja realmente concluir o serviço mesmo assim?"
	confirmText="Sim, Concluir Serviço"
	cancelText="Cancelar"
	variant="warning"
	icon="warning"
	loading={isConcluding}
	onConfirm={handleConclude}
	onCancel={() => showConcludeDialog = false}
>
	<div class="mt-4">
		<p class="text-sm text-muted-foreground mb-2">Etapas do serviço:</p>
		<ul class="list-disc list-inside space-y-1 text-sm">
			{#if service?.steps && service.steps.length > 0}
				{#each service.steps as step}
					{@const status = step.status?.toUpperCase()}
					{@const isConcluded = status === 'CONCLUDED' || status === 'COMPLETED'}
					<li class={isConcluded ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
						{step.name} - {isConcluded ? '✓ Concluída' : '⏳ ' + getServiceStatusLabel(step.status)}
					</li>
				{/each}
			{:else}
				<li class="text-muted-foreground">Nenhuma etapa cadastrada</li>
			{/if}
		</ul>
	</div>
</ConfirmationDialog>

<!-- Cancel Service Dialog -->
<ConfirmationDialog
	bind:open={showCancelDialog}
	title="Cancelar Serviço"
	description="Tem certeza que deseja cancelar este serviço? Esta ação requer um motivo."
	confirmText="Cancelar Serviço"
	cancelText="Voltar"
	variant="destructive"
	icon="warning"
	loading={isCancelling}
	onConfirm={handleCancel}
	onCancel={closeCancelDialog}
>
	<div class="space-y-2 mt-4">
		<label for="cancel-reason" class="text-sm font-medium">Motivo do cancelamento *</label>
		<textarea
			id="cancel-reason"
			bind:value={cancelReason}
			placeholder="Descreva o motivo do cancelamento..."
			rows="4"
			class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		></textarea>
		{#if !cancelReason.trim() && isCancelling}
			<p class="text-xs text-red-500">O motivo é obrigatório</p>
		{/if}
	</div>
</ConfirmationDialog>
