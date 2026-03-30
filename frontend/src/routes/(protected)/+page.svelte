
<script lang="ts">
	import { useDashboardStats, useForceRecalculateStats } from '$lib/hooks/queries/use-dashboard.svelte.js';
	import { useMySteps } from '$lib/hooks/queries/use-steps.svelte.js';
	import { formatNumber } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import StepsTable from '$lib/components/tables/steps-table.svelte';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import {
		Users,
		Wrench,
		TrendingUp,
		Clock,
		CheckCircle,
		AlertCircle,
		Activity,
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { userRole } from '$lib/stores/auth.svelte';
	import { UserRole } from '$lib/api/types/auth.types.js';

	type FilterOption = 'all' | 'created_today' | 'expires_today' | 'expired';
	let filterOption = $state<FilterOption>('all');
	let currentPage = $state(1);
	let pageSize = $state(10);

	/** Admin-only: which home tab is active */
	let adminHomeTab = $state<'stats' | 'steps'>('stats');

	let currentUserRole = $state<UserRole | undefined>(undefined);
	$effect(() => {
		const unsubscribe = userRole.subscribe((role) => {
			currentUserRole = role;
		});
		return unsubscribe;
	});

	const isAdminView = $derived(() => currentUserRole === UserRole.ADMIN);

	const shouldFetchSteps = $derived(() => {
		if (currentUserRole === undefined) return false;
		if (currentUserRole !== UserRole.ADMIN) return true;
		return adminHomeTab === 'steps';
	});

	let hasFetchedStats = $state(false);

	const statsQuery = useDashboardStats();
	const forceRecalcQuery = useForceRecalculateStats();

	const stats = $derived(forceRecalcQuery.data ?? statsQuery.data);
	const statsLoading = $derived(forceRecalcQuery.isLoading || statsQuery.isLoading);

	async function handleRefreshStats() {
		await forceRecalcQuery.refetch();
		await statsQuery.refetch();
	}

	const myStepsQuery = useMySteps(
		() => (filterOption === 'all' ? undefined : filterOption),
		{ enabled: () => shouldFetchSteps() },
	);
	const mySteps = $derived(() => myStepsQuery.data ?? []);
	const stepsLoading = $derived(() => myStepsQuery.isLoading && !myStepsQuery.data);

	$effect(() => {
		if (!isAdminView()) {
			hasFetchedStats = false;
			return;
		}
		if (adminHomeTab === 'stats' && !hasFetchedStats) {
			hasFetchedStats = true;
			statsQuery.refetch();
		}
	});

	const paginatedSteps = $derived(() => {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		const steps = mySteps();
		return steps.slice(start, end);
	});

	const totalPages = $derived(() => Math.ceil((mySteps().length || 0) / pageSize));

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

	const pageTitle = $derived(() => {
		if (!isAdminView()) return 'Minhas Etapas';
		return adminHomeTab === 'stats' ? 'Página Inicial' : 'Minhas Etapas';
	});

	const pageSubtitle = $derived(() => {
		if (!isAdminView()) return 'Acompanhe suas etapas em andamento';
		return adminHomeTab === 'stats' ? 'Visão geral do sistema' : 'Acompanhe suas etapas em andamento';
	});

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
	<title>{pageTitle()} - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">{pageTitle()}</h1>
			<p class="text-muted-foreground">{pageSubtitle()}</p>
		</div>
		<div class="flex items-center space-x-2">
			{#if isAdminView() && adminHomeTab === 'stats'}
				<Button
					variant="outline"
					onclick={handleRefreshStats}
					disabled={statsLoading}
					class="w-full md:w-auto"
				>
					<Activity class="w-4 h-4 mr-2" />
					{statsLoading ? 'Atualizando...' : 'Atualizar'}
				</Button>
			{/if}
		</div>
	</div>

	{#snippet myStepsCard()}
		<Card>
			<CardHeader>
				<CardTitle>Sua parte do serviço</CardTitle>
				<CardDescription>Etapas do serviço que você está responsável</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
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
												: filterOption === 'expires_today'
													? 'Expiram hoje'
													: 'Tarefas expiradas'}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas as tarefas</SelectItem>
									<SelectItem value="created_today">Tarefas criadas hoje</SelectItem>
									<SelectItem value="expires_today">Tarefas que expiram hoje</SelectItem>
									<SelectItem value="expired">Tarefas expiradas</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<StepsTable
						steps={paginatedSteps()}
						isLoading={stepsLoading()}
						onRowClick={(step) => step.id && goto(`/steps/${step.id}?from=home`)}
					/>

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
	{/snippet}

	{#if isAdminView()}
		<Tabs bind:value={adminHomeTab} class="w-full">
			<TabsList class="grid w-full max-w-md grid-cols-2">
				<TabsTrigger value="stats">Estatísticas</TabsTrigger>
				<TabsTrigger value="steps">Minhas etapas</TabsTrigger>
			</TabsList>

			<TabsContent value="stats" class="mt-6 space-y-6">
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
			</TabsContent>

			<TabsContent value="steps" class="mt-6">
				{@render myStepsCard()}
			</TabsContent>
		</Tabs>
	{:else}
		{@render myStepsCard()}
	{/if}
</div>
