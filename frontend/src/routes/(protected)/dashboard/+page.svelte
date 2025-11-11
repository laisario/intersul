<!--
  Enhanced dashboard with real backend data and charts
-->

<script lang="ts">
	import { useDashboardStats, useDashboardActivity } from '$lib/hooks/queries/use-dashboard.svelte.js';
	import { useServices } from '$lib/hooks/queries/use-services.svelte.js';
	import { formatNumber, formatCurrency } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ServiceTable from '$lib/components/tables/service-table.svelte';
	import CreateServiceDialog from '$lib/components/dialogs/create-service-dialog.svelte';
	import Breadcrumbs from '$lib/components/layout/breadcrumbs.svelte';
	import { 
		Users, 
		Wrench, 
		Printer, 
		UserCheck, 
		TrendingUp, 
		Clock, 
		CheckCircle, 
		AlertCircle,
		Activity,
		Plus
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';

	// Fetch dashboard data
	const { data: stats, isLoading: statsLoading } = useDashboardStats();
	const { data: activity, isLoading: activityLoading } = useDashboardActivity();
	
	// Fetch recent services for the table
	const { data: servicesData, isLoading: servicesLoading, refetch: refetchServices } = useServices(() => ({
		limit: 10,
		page: 1
	}));

	let showCreateServiceDialog = $state(false);

	// Quick stats cards
	let quickStats = $derived([
		{
			title: 'Total de Clientes',
			value: stats?.clients?.total || 0,
			change: `+${stats?.clients?.newThisMonth || 0} este mês`,
			icon: Users,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
		},
		{
			title: 'Serviços Ativos',
			value: (stats?.services?.pending || 0) + (stats?.services?.inProgress || 0),
			change: `${stats?.services?.completed || 0} concluídos`,
			icon: Wrench,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50',
		},
		{
			title: 'Máquinas Ativas',
			value: stats?.copyMachines?.activeMachines || 0,
			change: `${stats?.copyMachines?.totalMachines || 0} total`,
			icon: Printer,
			color: 'text-green-600',
			bgColor: 'bg-green-50',
		},
		{
			title: 'Usuários Ativos',
			value: stats?.users?.active || 0,
			change: `${stats?.users?.total || 0} total`,
			icon: UserCheck,
			color: 'text-purple-600',
			bgColor: 'bg-purple-50',
		},
	]);
</script>

<svelte:head>
	<title>Dashboard - Intersul</title>
</svelte:head>

<div class="space-y-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs />

	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Dashboard</h1>
			<p class="text-muted-foreground">Visão geral do sistema</p>
		</div>
		<div class="flex items-center space-x-2">
			<Button variant="outline" on:click={() => refetchServices()}>
				<Activity class="w-4 h-4 mr-2" />
				Atualizar
			</Button>
			<Button on:click={() => (showCreateServiceDialog = true)}>
				<Plus class="w-4 h-4 mr-2" />
				Novo Serviço
			</Button>
		</div>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each quickStats as stat}
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">{stat.title}</p>
							{#if statsLoading}
								<Skeleton class="h-8 w-16 mt-2" />
							{:else}
								<p class="text-2xl font-bold">{formatNumber(stat.value)}</p>
							{/if}
							<p class="text-xs text-muted-foreground mt-1">{stat.change}</p>
						</div>
						<div class="h-12 w-12 rounded-lg {stat.bgColor} flex items-center justify-center">
							{#if stat.icon}
								{@const IconComponent = stat.icon}
								<IconComponent class="h-6 w-6 {stat.color}" />
							{/if}
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Services Overview -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle>Resumo de Serviços</CardTitle>
				<CardDescription>Status atual dos serviços</CardDescription>
			</CardHeader>
			<CardContent>
				{#if statsLoading}
					<div class="space-y-4">
						{#each Array(4) as _}
							<div class="flex items-center space-x-4">
								<Skeleton class="h-4 w-4" />
								<Skeleton class="h-4 w-[200px]" />
								<Skeleton class="h-4 w-[60px]" />
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<Clock class="h-4 w-4 text-yellow-600" />
								<span class="text-sm font-medium">Pendentes</span>
							</div>
							<Badge variant="outline">{stats?.services?.pending || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<TrendingUp class="h-4 w-4 text-blue-600" />
								<span class="text-sm font-medium">Em Andamento</span>
							</div>
							<Badge variant="outline">{stats?.services?.inProgress || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<CheckCircle class="h-4 w-4 text-green-600" />
								<span class="text-sm font-medium">Concluídos</span>
							</div>
							<Badge variant="outline">{stats?.services?.completed || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<AlertCircle class="h-4 w-4 text-red-600" />
								<span class="text-sm font-medium">Cancelados</span>
							</div>
							<Badge variant="outline">{stats?.services?.cancelled || 0}</Badge>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Recent Activity -->
		<Card>
			<CardHeader>
				<CardTitle>Atividade Recente</CardTitle>
				<CardDescription>Últimas ações no sistema</CardDescription>
			</CardHeader>
			<CardContent>
				{#if activityLoading}
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
				{:else}
					<div class="space-y-4">
						{#each activity || [] as item}
							<div class="flex items-start space-x-3">
								<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
									{#if item.type === 'client'}
										<Users class="h-4 w-4 text-primary" />
									{:else if item.type === 'service'}
										<Wrench class="h-4 w-4 text-primary" />
									{:else if item.type === 'user'}
										<UserCheck class="h-4 w-4 text-primary" />
									{:else}
										<Printer class="h-4 w-4 text-primary" />
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium">{item.description}</p>
									<p class="text-xs text-muted-foreground">
										{item.user} • {new Date(item.timestamp).toLocaleString('pt-BR')}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Additional Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Client Status -->
		<Card>
			<CardHeader>
				<CardTitle>Status dos Clientes</CardTitle>
			</CardHeader>
			<CardContent>
				{#if statsLoading}
					<div class="space-y-4">
						{#each Array(3) as _}
							<div class="flex items-center justify-between">
								<Skeleton class="h-4 w-[100px]" />
								<Skeleton class="h-4 w-[40px]" />
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Ativos</span>
							<Badge variant="default">{stats?.clients?.active || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Inativos</span>
							<Badge variant="secondary">{stats?.clients?.inactive || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Suspensos</span>
							<Badge variant="destructive">{stats?.clients?.suspended || 0}</Badge>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- System Health -->
		<Card>
			<CardHeader>
				<CardTitle>Saúde do Sistema</CardTitle>
			</CardHeader>
			<CardContent>
				{#if statsLoading}
					<div class="space-y-4">
						{#each Array(3) as _}
							<div class="flex items-center justify-between">
								<Skeleton class="h-4 w-[100px]" />
								<Skeleton class="h-4 w-[40px]" />
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Máquinas Ativas</span>
							<Badge variant="default">{stats?.copyMachines?.activeMachines || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Manutenção Necessária</span>
							<Badge variant="destructive">{stats?.copyMachines?.maintenanceRequired || 0}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Média por Cliente</span>
							<Badge variant="outline">{stats?.copyMachines?.averageMachinesPerClient || 0}</Badge>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Services Table -->
	<Card>
		<CardHeader>
			<CardTitle>Serviços Recentes</CardTitle>
			<CardDescription>Últimos serviços criados e atualizados</CardDescription>
		</CardHeader>
		<CardContent>
			<ServiceTable 
				services={servicesData?.data || []}
				isLoading={servicesLoading}
				onRowClick={(service) => goto(`/services/${service.id}`)}
				onEdit={(service) => goto(`/services/${service.id}/edit`)}
				onDelete={(service) => {
					// Handle delete
					console.log('Delete service:', service);
				}}
				showFilters={false}
			/>
		</CardContent>
	</Card>
</div>

<!-- Create Service Dialog -->
<CreateServiceDialog 
	bind:open={showCreateServiceDialog}
	onSuccess={() => {
		refetchServices();
		refetch();
	}}
/>
