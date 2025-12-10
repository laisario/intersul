<script lang="ts">
	import { page } from '$app/stores';
	import { useUser } from '$lib/hooks/queries/use-users.svelte.js';
	import { useStepsByUserId } from '$lib/hooks/queries/use-steps.svelte.js';
	import { formatDate, formatDateTime } from '$lib/utils/formatting.js';
	import { USER_ROLES } from '$lib/utils/constants.js';
	import { UserRole } from '$lib/api/types/auth.types.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { 
		ArrowLeft, 
		Mail, 
		User as UserIcon,
		Calendar,
		CheckCircle,
		Clock,
		XCircle,
		Circle,
		ExternalLink,
		MoreVertical,
		Trash2,
		Edit
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { Step } from '$lib/api/types/service.types.js';
	import { useToggleUserActive, useDeleteUser } from '$lib/hooks/queries/use-users.svelte.js';
	import { successToast, errorToast } from '$lib/utils/toast.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';

	let userId = $derived(Number($page.params.id));
	let statusFilter = $state<'all' | 'PENDING' | 'IN_PROGRESS' | 'CONCLUDED' | 'CANCELLED'>('all');

	const userQuery = $derived(useUser(userId));
	const user = $derived(userQuery.data);
	const isLoadingUser = $derived(userQuery.isLoading);
	const isErrorUser = $derived(userQuery.isError);

	const stepsQuery = $derived(useStepsByUserId(userId));
	const allSteps = $derived(stepsQuery.data ?? []);
	const isLoadingSteps = $derived(stepsQuery.isLoading);
	const isErrorSteps = $derived(stepsQuery.isError);

	// Filter steps by status - normalize status to uppercase for comparison
	const filteredSteps = $derived(
		statusFilter === 'all'
			? allSteps
			: allSteps.filter(step => {
				const stepStatus = step.status?.toUpperCase();
				return stepStatus === statusFilter;
			})
	);

	function getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'destructive' | 'outline' {
		const color = USER_ROLES[role]?.color;
		switch (color) {
			case 'red':
				return 'destructive';
			case 'green':
				return 'default';
			case 'blue':
				return 'secondary';
			case 'purple':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'outline';
			case 'IN_PROGRESS':
				return 'secondary';
			case 'CONCLUDED':
			case 'COMPLETED':
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
			case 'COMPLETED':
				return 'Concluído';
			case 'CANCELLED':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}

	function getStatusIcon(status?: string) {
		switch (status) {
			case 'PENDING':
				return Circle;
			case 'IN_PROGRESS':
				return Clock;
			case 'CONCLUDED':
			case 'COMPLETED':
				return CheckCircle;
			case 'CANCELLED':
				return XCircle;
			default:
				return Circle;
		}
	}

	function handleStepClick(step: Step) {
		if (step.id) {
			goto(`/steps/${step.id}`);
		}
	}

	const stats = $derived({
		total: allSteps.length,
		pending: allSteps.filter(s => (s.status?.toUpperCase()) === 'PENDING').length,
		inProgress: allSteps.filter(s => (s.status?.toUpperCase()) === 'IN_PROGRESS').length,
		concluded: allSteps.filter(s => {
			const status = s.status?.toUpperCase();
			return status === 'CONCLUDED' || status === 'COMPLETED';
		}).length,
		cancelled: allSteps.filter(s => (s.status?.toUpperCase()) === 'CANCELLED').length,
	});

	// User actions
	const { mutate: toggleActive, isPending: isToggling } = useToggleUserActive();
	const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
	let showDeleteConfirmation = $state(false);

	function handleToggleActive() {
		if (!user) return;
		toggleActive(user.id, {
			onSuccess: () => {
				successToast.updated('Usuário');
			},
			onError: () => {
				errorToast.update('Usuário');
			},
		});
	}

	function requestDeleteUser() {
		showDeleteConfirmation = true;
	}

	function closeDeleteDialog() {
		showDeleteConfirmation = false;
	}

	async function confirmDeleteUser() {
		if (!user) {
			closeDeleteDialog();
			return;
		}

		const userId = user.id;
		return new Promise<void>((resolve, reject) => {
			deleteUser(userId, {
				onSuccess: () => {
					successToast.deleted('Usuário');
					closeDeleteDialog();
					goto('/admin/users');
					resolve();
				},
				onError: () => {
					errorToast.delete('Usuário');
					reject(new Error('delete-user-failed'));
				},
			});
		});
	}
</script>

<svelte:head>
	<title>Detalhes do Funcionário - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/admin/users')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar
			</Button>
			<div>
				<h1 class="text-3xl font-bold">Detalhes do Funcionário</h1>
				<p class="text-muted-foreground">Visualize informações e etapas do funcionário</p>
			</div>
		</div>
	</div>

	{#if isLoadingUser}
		<Card>
			<CardContent class="p-6">
				<div class="space-y-4">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-32 w-full" />
				</div>
			</CardContent>
		</Card>
	{:else if isErrorUser || !user}
		<Card>
			<CardContent class="p-6">
				<div class="text-center">
					<p class="text-lg font-medium text-red-600">Erro ao carregar funcionário</p>
					<p class="text-sm text-muted-foreground mt-2">
						{userQuery.error?.message || 'Funcionário não encontrado ou você não tem permissão para visualizá-lo.'}
					</p>
					<Button onclick={() => goto('/admin/users')} class="mt-4">
						Voltar para Funcionários
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-6">
			<!-- User Information -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<div>
							<CardTitle>{user.name}</CardTitle>
							<CardDescription>{user.email}</CardDescription>
						</div>
						<div class="flex items-center gap-3">
							<Badge variant={getRoleBadgeVariant(user.role)}>
								{USER_ROLES[user.role]?.label ?? user.role}
							</Badge>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button variant="ghost" size="sm" class="px-2">
										<MoreVertical class="w-4 h-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item
										onclick={handleToggleActive}
										disabled={isToggling}
									>
										{user.active ? 'Desativar' : 'Ativar'}
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item
										variant="destructive"
										onclick={requestDeleteUser}
										disabled={isDeleting}
									>
										<Trash2 class="w-4 h-4" />
										Excluir
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p class="text-sm font-medium text-muted-foreground">Status</p>
							<Badge variant={user.active ? 'default' : 'secondary'} class="mt-1">
								{user.active ? 'Ativo' : 'Inativo'}
							</Badge>
						</div>
						{#if user.position}
							<div>
								<p class="text-sm font-medium text-muted-foreground">Cargo</p>
								<p class="text-sm mt-1">{user.position}</p>
							</div>
						{/if}
						{#if user.phone}
							<div>
								<p class="text-sm font-medium text-muted-foreground">Telefone</p>
								<p class="text-sm mt-1">{user.phone}</p>
							</div>
						{/if}
						<div>
							<p class="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
							<p class="text-sm mt-1">{formatDate((user as any).created_at)}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Steps Statistics -->
			<Card>
				<CardHeader>
					<CardTitle>Estatísticas de Etapas</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
						<div class="text-center">
							<p class="text-2xl font-bold">{stats.total}</p>
							<p class="text-sm text-muted-foreground">Total</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-yellow-600">{stats.pending}</p>
							<p class="text-sm text-muted-foreground">Pendentes</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
							<p class="text-sm text-muted-foreground">Em Andamento</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-green-600">{stats.concluded}</p>
							<p class="text-sm text-muted-foreground">Concluídas</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-red-600">{stats.cancelled}</p>
							<p class="text-sm text-muted-foreground">Canceladas</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Steps List -->
			<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>Etapas</CardTitle>
								<CardDescription>Etapas atribuídas a este funcionário</CardDescription>
							</div>
							<div class="flex gap-2">
								<Button
									variant={statusFilter === 'all' ? 'default' : 'outline'}
									size="sm"
									onclick={() => statusFilter = 'all'}
								>
									Todas ({stats.total})
								</Button>
								<Button
									variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
									size="sm"
									onclick={() => statusFilter = 'PENDING'}
								>
									Pendentes ({stats.pending})
								</Button>
								<Button
									variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
									size="sm"
									onclick={() => statusFilter = 'IN_PROGRESS'}
								>
									Em Andamento ({stats.inProgress})
								</Button>
								<Button
									variant={statusFilter === 'CONCLUDED' ? 'default' : 'outline'}
									size="sm"
									onclick={() => statusFilter = 'CONCLUDED'}
								>
									Concluídas ({stats.concluded})
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{#if isLoadingSteps}
							<div class="space-y-3">
								{#each Array(5) as _}
									<Skeleton class="h-16 w-full" />
								{/each}
							</div>
						{:else if isErrorSteps}
							<div class="text-center py-12">
								<UserIcon class="mx-auto h-12 w-12 text-red-500" />
								<h3 class="mt-2 text-sm font-medium text-red-600">Erro ao carregar etapas</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									{stepsQuery.error?.message || 'Ocorreu um erro ao carregar as etapas do funcionário.'}
								</p>
							</div>
						{:else if filteredSteps.length === 0}
							<div class="text-center py-12">
								<UserIcon class="mx-auto h-12 w-12 text-muted-foreground" />
								<h3 class="mt-2 text-sm font-medium">Nenhuma etapa encontrada</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									{statusFilter === 'all' 
										? 'Este funcionário não possui etapas atribuídas.'
										: `Nenhuma etapa com status "${getStatusLabel(statusFilter)}" encontrada.`}
								</p>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Etapa</TableHead>
											<TableHead>Serviço</TableHead>
											<TableHead>Cliente</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Data de Início</TableHead>
											<TableHead>Data de Conclusão</TableHead>
											<TableHead>Vencimento</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each filteredSteps as step}
											{@const StatusIcon = getStatusIcon(step.status)}
											<TableRow 
												class="cursor-pointer hover:bg-muted/50"
												onclick={() => handleStepClick(step)}
											>
												<TableCell>
													<div class="flex flex-col">
														<span class="font-medium">{step.name}</span>
														{#if step.description}
															<span class="text-xs text-muted-foreground line-clamp-1">{step.description}</span>
														{/if}
													</div>
												</TableCell>
												<TableCell>
													{#if step.service}
														<div class="flex items-center gap-2">
															<span class="text-sm">Serviço #{step.service.id}</span>
															<Button
																variant="ghost"
																size="sm"
																class="h-6 w-6 p-0"
																onclick={(e) => {
																	e.stopPropagation();
																	if (step.service_id) {
																		goto(`/services/${step.service_id}`);
																	}
																}}
															>
																<ExternalLink class="w-3 h-3" />
															</Button>
														</div>
													{:else}
														<span class="text-muted-foreground text-sm">-</span>
													{/if}
												</TableCell>
												<TableCell>
													{#if step.service?.client}
														<span class="text-sm">{step.service.client.name}</span>
													{:else}
														<span class="text-muted-foreground text-sm">-</span>
													{/if}
												</TableCell>
												<TableCell>
													<div class="flex items-center gap-2">
														<StatusIcon class="w-4 h-4" />
														<Badge variant={getStatusBadgeVariant(step.status)}>
															{getStatusLabel(step.status)}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													{#if step.datetime_start}
														<span class="text-sm">{formatDateTime(step.datetime_start)}</span>
													{:else}
														<span class="text-muted-foreground text-sm">-</span>
													{/if}
												</TableCell>
												<TableCell>
													{#if step.datetime_conclusion}
														<span class="text-sm">{formatDateTime(step.datetime_conclusion)}</span>
													{:else}
														<span class="text-muted-foreground text-sm">-</span>
													{/if}
												</TableCell>
												<TableCell>
													{#if step.datetime_expiration}
														<span class="text-sm">{formatDateTime(step.datetime_expiration)}</span>
													{:else}
														<span class="text-muted-foreground text-sm">-</span>
													{/if}
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Excluir Usuário"
	description={`Tem certeza que deseja excluir o usuário ${user?.name ?? ''}? Esta ação não pode ser desfeita.`}
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	loading={isDeleting}
	onConfirm={confirmDeleteUser}
	onCancel={closeDeleteDialog}
/>

