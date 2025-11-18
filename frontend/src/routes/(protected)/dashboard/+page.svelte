
<script lang="ts">
	import { useDashboardStats, useForceRecalculateStats } from '$lib/hooks/queries/use-dashboard.svelte.js';
	import { useMySteps } from '$lib/hooks/queries/use-steps.svelte.js';
	import { formatNumber } from '$lib/utils/formatting.js';
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
		TrendingUp, 
		Clock, 
		CheckCircle, 
		AlertCircle,
		Activity
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { Step } from '$lib/api/types/service.types.js';
	import { userRole } from '$lib/stores/auth.svelte';
	import { UserRole } from '$lib/api/types/auth.types.js';

	// Fetch dashboard data
	const statsQuery = useDashboardStats();
	const forceRecalcQuery = useForceRecalculateStats();
	
	// Use force recalculation query data if available, otherwise use regular query
	const stats = $derived(forceRecalcQuery.data ?? statsQuery.data);
	const statsLoading = $derived(forceRecalcQuery.isLoading || statsQuery.isLoading);
	
	// Force recalculation handler - always forces recalculation from backend
	async function handleRefreshStats() {
		await forceRecalcQuery.refetch();
	}
	
	// Filter state
	type FilterOption = 'all' | 'created_today' | 'expires_today';
	let filterOption = $state<FilterOption>('all');
	let currentPage = $state(1);
	let pageSize = $state(10);

	// Track user role to tailor dashboard experience
	let currentUserRole = $state<UserRole | undefined>(undefined);
	$effect(() => {
		const unsubscribe = userRole.subscribe((role) => {
			currentUserRole = role;
		});
		return unsubscribe;
	});

	const isAdminView = $derived(() => currentUserRole === UserRole.ADMIN);
	const shouldFetchSteps = $derived(() => currentUserRole !== UserRole.ADMIN);

	// Fetch user's steps with filter (skip for admins)
	const myStepsQuery = useMySteps(() => 
		filterOption === 'all' ? undefined : filterOption,
		{ enabled: () => shouldFetchSteps() }
	);
	const mySteps = $derived(() => myStepsQuery.data ?? []);
	const stepsLoading = $derived(() => myStepsQuery.isLoading && !myStepsQuery.data);
	const refetchSteps = myStepsQuery.refetch;

	// Paginate steps (filtering is done in backend)
	const paginatedSteps = $derived(() => {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		const steps = mySteps();
		return steps.slice(start, end);
	});

const totalPages = $derived(() => Math.ceil((mySteps().length || 0) / pageSize));

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
		if (currentPage < totalPages()) {
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

	// Quick stats cards for admin dashboard
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
			title: 'Serviços Não Concluídos',
			value: (stats?.services?.pending || 0) + (stats?.services?.inProgress || 0),
			change: `${stats?.services?.pending || 0} pendentes • ${stats?.services?.inProgress || 0} em andamento`,
			icon: Wrench,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50',
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
		<div class="flex items-center space-x-2">
			{#if isAdminView()}
				<Button 
					variant="outline" 
					onclick={handleRefreshStats}
					disabled={statsLoading}
				>
					<Activity class="w-4 h-4 mr-2" />
					{statsLoading ? 'Atualizando...' : 'Atualizar'}
				</Button>
			{/if}
		</div>
	</div>

	{#if isAdminView()}
		<div class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each quickStats as stat (stat.title)}
					{@const Icon = stat.icon}
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
									<Icon class="h-6 w-6 {stat.color}" />
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<Card>
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
		</div>
	{:else}
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
						isLoading={stepsLoading()}
						onRowClick={(step) => goto(`/steps/${step.id}`)}
					/>

					<!-- Pagination -->
					<PaginationControls
						page={currentPage}
						totalPages={totalPages()}
						totalItems={mySteps().length || 0}
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
	{/if}

</div>
