
<script lang="ts">
	import { page } from '$app/stores';
	import { useService, useServices } from '$lib/hooks/queries/use-services.svelte.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { ArrowLeft, CheckCircle, Clock, User, Printer, MapPin, Phone, Mail, Calendar, FileText } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { ACQUISITION_TYPE } from '$lib/utils/constants.js';
	import type { AcquisitionType, ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';
	import type { Client } from '$lib/api/types/client.types.js';
	import type { ServiceQueryParams } from '$lib/api/types/service.types.js';

	const serviceId = Number($page.params.id);
	const serviceQuery = useService(serviceId);
	const service = $derived(serviceQuery.data);
	const isLoading = $derived(serviceQuery.isLoading);
	let machineHistoryFilters = $state<ServiceQueryParams | undefined>(undefined);

	const machineServicesQuery = useServices(() => machineHistoryFilters);
	const machineServices = $derived(
		(machineServicesQuery.data?.data ?? []).filter((item) => item.id !== service?.id)
	);
	const machineServicesLoading = $derived(machineServicesQuery.isLoading);

	const STEP_STATUS_LABELS: Record<string, string> = {
		pending: 'Pendente',
		in_progress: 'Em andamento',
		completed: 'Concluído',
		skipped: 'Ignorado'
	};

	function goBack() {
		goto('/services');
	}

	function getStepStatusIcon(status: string) {
		switch (status) {
			case 'completed':
				return CheckCircle;
			case 'in_progress':
				return Clock;
			default:
				return Clock;
		}
	}

	function getStepStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'text-green-600';
			case 'in_progress':
				return 'text-blue-600';
			default:
				return 'text-gray-600';
		}
	}

	function formatStepStatus(status?: string) {
		if (!status) return 'Pendente';
		return STEP_STATUS_LABELS[status] ?? status;
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
			machine.external_model ??
			'EQUIPAMENTO'
		);
	}

	function resolveMachineManufacturer(machine: ClientCopyMachine | undefined) {
		if (!machine) return 'Não informado';
		return (
			machine.catalogCopyMachine?.manufacturer ??
			machine.external_manufacturer ??
			'Não informado'
		);
	}

	$effect(() => {
		if (service?.client_copy_machine_id) {
			machineHistoryFilters = {
				client_copy_machine_id: service.client_copy_machine_id,
				page: 1,
				limit: 5
			};
		} else {
			machineHistoryFilters = undefined;
		}
	});
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
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
		<div class="flex items-center justify-between">
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
			<div class="flex items-center space-x-2"></div>
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
									{@const status = step?.status ?? 'pending'}
									{@const StatusIcon = getStepStatusIcon(status)}
									<div class="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
										<div class="flex-shrink-0">
											<div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
												<span class="text-sm font-medium">{index + 1}</span>
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<h4 class="font-medium">{step.name || `Passo ${index + 1}`}</h4>
												<div class="flex items-center space-x-2">
													<StatusIcon class="w-4 h-4 {getStepStatusColor(status)}" />
													<Badge variant={status === 'completed' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline'}>
														{formatStepStatus(status)}
													</Badge>
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
											{#if step.datetime_conclusion}
												<div class="flex items-center space-x-2 mt-2">
													<Calendar class="w-4 h-4 text-muted-foreground" />
													<span class="text-sm text-muted-foreground">
														Concluído em: {formatDate(step.datetime_conclusion)}
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

				{#if service.client_copy_machine_id}
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

						<div>
							<span class="font-medium text-muted-foreground block">Descrição</span>
							<p class="mt-1 text-sm whitespace-pre-line">
								{service.description || 'Nenhuma descrição fornecida.'}
							</p>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Criado em</span>
							<span class="mt-1 block">{service.createdAt ? formatDate(service.createdAt) : '-'}</span>
						</div>

						<div>
							<span class="font-medium text-muted-foreground block">Atualizado em</span>
							<span class="mt-1 block">{service.updatedAt ? formatDate(service.updatedAt) : '-'}</span>
						</div>
					</CardContent>
				</Card>

				<!-- Client Info -->
				<Card>
					<CardHeader>
						<CardTitle>Informações do Cliente</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4 text-sm">
						<div>
							<span class="font-medium text-muted-foreground block">Nome</span>
							<span class="mt-1 block">{service.client?.name || 'Não informado'}</span>
						</div>

						{#if service.client?.email}
							<div class="flex items-center gap-2">
								<Mail class="w-4 h-4 text-muted-foreground" />
								<span>{service.client.email}</span>
							</div>
						{/if}

						{#if service.client?.phone}
							<div class="flex items-center gap-2">
								<Phone class="w-4 h-4 text-muted-foreground" />
								<span>{service.client.phone}</span>
							</div>
						{/if}

						<div class="flex items-start gap-2">
							<MapPin class="w-4 h-4 text-muted-foreground mt-1" />
							<span>{formatClientAddress(service.client)}</span>
						</div>

						{#if service.client?.address?.postal_code}
							<div>
								<span class="font-medium text-muted-foreground block">CEP</span>
								<span class="mt-1 block">{service.client.address.postal_code}</span>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Machine Info (if linked) -->
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
								<span class="mt-1 block">{service.clientCopyMachine.serial_number}</span>
							</div>
							<div>
								<span class="font-medium text-muted-foreground block">Tipo de Aquisição</span>
								<span class="mt-1 block">{formatAcquisitionType(service.clientCopyMachine.acquisition_type)}</span>
							</div>
							{#if service.clientCopyMachine.value}
								<div>
									<span class="font-medium text-muted-foreground block">Valor</span>
									<span class="mt-1 block">{formatCurrency(service.clientCopyMachine.value)}</span>
								</div>
							{/if}
							{#if service.clientCopyMachine.external_description}
								<div>
									<span class="font-medium text-muted-foreground block">Descrição</span>
									<p class="mt-1 text-sm whitespace-pre-line">
										{service.clientCopyMachine.external_description}
									</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				{:else}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center">
								<Printer class="w-5 h-5 mr-2" />
								Máquina Associada
							</CardTitle>
						</CardHeader>
						<CardContent class="text-sm text-muted-foreground">
							Nenhum equipamento associado a este serviço.
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

