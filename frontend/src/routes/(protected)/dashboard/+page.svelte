
<script lang="ts">
	import { useDashboardStats, useDashboardActivity } from '$lib/hooks/queries/use-dashboard.svelte.js';
	import { useMySteps } from '$lib/hooks/queries/use-steps.svelte.js';
	import { formatNumber, formatCurrency } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import StepsTable from '$lib/components/tables/steps-table.svelte';
	import Breadcrumbs from '$lib/components/layout/breadcrumbs.svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
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
	import type { Step } from '$lib/api/types/service.types.js';

	// Fetch dashboard data
	const { data: stats, isLoading: statsLoading } = useDashboardStats();
	const { data: activity, isLoading: activityLoading } = useDashboardActivity();
	
	// Filter state
	type FilterOption = 'all' | 'created_today' | 'expires_today';
	let filterOption = $state<FilterOption>('all');
	let currentPage = $state(1);
	let pageSize = $state(10);

	// Get filter for API call (undefined if 'all')
	const apiFilter = $derived.by(() => filterOption === 'all' ? undefined : filterOption);

	// Fetch user's steps with filter
	const { data: mySteps, isLoading: stepsLoading, refetch: refetchSteps } = useMySteps(apiFilter);

	// Paginate steps (filtering is done in backend)
	const paginatedSteps = $derived(() => {
		if (!mySteps) return [];
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return mySteps.slice(start, end);
	});

	const totalPages = $derived(Math.ceil((mySteps?.length || 0) / pageSize));

	// Reset to page 1 when filter changes
	$effect(() => {
		filterOption;
		currentPage = 1;
	});

	function handlePreviousPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function handleNextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function handleSelectPage(page: number) {
		currentPage = page;
	}

	function handlePageSizeChange(size: number) {
		pageSize = size;
		currentPage = 1;
	}

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

<div class="space-y-6 px-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs />

	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Página Inicial</h1>
			<p class="text-muted-foreground">Visão geral do sistema</p>
		</div>
		<!-- <div class="flex items-center space-x-2">
			<Button variant="outline" onclick={() => refetchSteps()}>
				<Activity class="w-4 h-4 mr-2" />
				Atualizar
			</Button>
		</div> -->
	</div>


	<Card>
		<CardHeader>
			<CardTitle>Sua parte do serviço</CardTitle>
			<CardDescription>Etapas do serviço que você está responsável</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<!-- Filters -->
				<div class="flex items-center gap-4">
					<div class="w-[200px]">
						<Select
							type="single"
							value={filterOption}
							onValueChange={(value: string) => {
								filterOption = (value as FilterOption) ?? 'all';
							}}
						>
							<SelectTrigger class="w-full">
								<span class="block text-left text-sm">
									{filterOption === 'all' 
										? 'Todas as tarefas' 
										: filterOption === 'created_today' 
										? 'Criadas hoje' 
										: 'Expiram hoje'}
								</span>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas as tarefas</SelectItem>
								<SelectItem value="created_today">Tarefas criadas hoje</SelectItem>
								<SelectItem value="expires_today">Tarefas que expiram hoje</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<!-- Table -->
				<StepsTable 
					steps={paginatedSteps()}
					isLoading={stepsLoading}
					onRowClick={(step) => goto(`/steps/${step.id}`)}
				/>

				<!-- Pagination -->
				<PaginationControls
					page={currentPage}
					totalPages={totalPages}
					totalItems={mySteps?.length || 0}
					pageSize={pageSize}
					label="etapas"
					onPrevious={handlePreviousPage}
					onNext={handleNextPage}
					onSelectPage={handleSelectPage}
					onPageSizeChange={handlePageSizeChange}
				/>
			</div>
		</CardContent>
	</Card>
<!-- 
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
	</div> -->

<!-- 	
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
	</div> -->
<!-- 
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
	</div> -->

</div>
