
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import {
		useUsers,
		useDeleteUser,
		useToggleUserActive,
		useUserInvitations,
		useCreateUserInvitation
	} from '$lib/hooks/queries/use-users.svelte.js';
	import { successToast, errorToast, showError, showSuccess } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { USER_ROLES } from '$lib/utils/constants.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import PaginationControls from '$lib/components/pagination-controls.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ConfirmationDialog from '$lib/components/confirmation-dialog.svelte';
	import { canManageUsers } from '$lib/stores/auth.svelte.js';
	import type { User } from '$lib/api/types/auth.types.js';
	import { UserRole } from '$lib/api/types/auth.types.js';
	import type { UserInvitation } from '$lib/api/types/users.types.js';
	import { MoreVertical, Edit, Trash2, Copy } from 'lucide-svelte';

let activeTab = $state<'users' | 'invitations'>('users');
let searchTerm = $state('');
	type RoleFilterOption = 'all' | keyof typeof USER_ROLES;
	type StatusFilterOption = 'all' | 'active' | 'inactive';
let roleFilter = $state<RoleFilterOption>('all');
let statusFilter = $state<StatusFilterOption>('all');
let showNewUserModal = $state(false);
let currentPage = $state(1);
let pageSize = $state(10);
let showDeleteConfirmation = $state(false);
let userToDelete = $state<User | null>(null);
let inviteRole = $state<UserRole>(UserRole.TECHNICIAN);
let inviteEmail = $state('');
let inviteExpiresInHours = $state(72);
let generatedInvitation = $state<UserInvitation | null>(null);
let generatedInviteUrl = $state<string | null>(null);

const pageSizeOptions = [10, 25, 50, 100];
const invitationExpirationOptions = [
	{ value: 24, label: '24 horas' },
	{ value: 72, label: '3 dias' },
	{ value: 168, label: '7 dias' }
];

	const roleFilterLabels: Record<RoleFilterOption, string> = {
		all: 'Todas as funções',
		ADMIN: USER_ROLES[UserRole.ADMIN].label,
		MANAGER: USER_ROLES[UserRole.MANAGER].label,
		TECHNICIAN: USER_ROLES[UserRole.TECHNICIAN].label,
		COMMERCIAL: USER_ROLES[UserRole.COMMERCIAL].label
	};

	const statusFilterLabels: Record<StatusFilterOption, string> = {
		all: 'Todos os status',
		active: 'Ativo',
		inactive: 'Inativo'
	};

	const queryParams = $derived({
		search: searchTerm || undefined,
		role: roleFilter !== 'all' ? roleFilter : undefined,
		active: statusFilter !== 'all' ? statusFilter === 'active' : undefined
	});

	const usersQuery = $derived(useUsers(queryParams));
const users = $derived<User[]>(usersQuery.data ?? []);
const isLoading = $derived(usersQuery.isLoading);
const totalUsers = $derived(users.length);
const totalPages = $derived(Math.max(1, Math.ceil(totalUsers / pageSize)));
const paginatedUsers = $derived(
	users.slice(
		Math.max(0, (currentPage - 1) * pageSize),
		Math.max(0, (currentPage - 1) * pageSize) + pageSize
	)
);

const userInvitationsQuery = $derived(useUserInvitations());
const userInvitations = $derived<UserInvitation[]>(userInvitationsQuery.data ?? []);
const isLoadingInvitations = $derived(userInvitationsQuery.isLoading);

	const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
	const { mutate: toggleActive, isPending: isToggling } = useToggleUserActive();
	const { mutate: createInvitation, isPending: isCreatingInvitation } = useCreateUserInvitation();

function requestDeleteUser(user: User) {
	userToDelete = user;
	showDeleteConfirmation = true;
}

function closeDeleteDialog() {
	showDeleteConfirmation = false;
	userToDelete = null;
}

async function confirmDeleteUser() {
	if (!userToDelete) {
		closeDeleteDialog();
		return;
	}

	const user = userToDelete;

	return new Promise<void>((resolve, reject) => {
		deleteUser(user.id, {
			onSuccess: () => {
				successToast.deleted('Usuário');
				closeDeleteDialog();
				resolve();
			},
			onError: () => {
				errorToast.delete('Usuário');
				reject(new Error('delete-user-failed'));
			},
		});
	});
}

	function handleToggleActive(user: User) {
		toggleActive(user.id, {
			onSuccess: () => {
				successToast.updated('Usuário');
			},
			onError: () => {
				errorToast.update('Usuário');
			},
		});
	}

function resetInvitationForm() {
	inviteRole = UserRole.TECHNICIAN;
	inviteEmail = '';
	inviteExpiresInHours = 72;
	generatedInvitation = null;
	generatedInviteUrl = null;
}

function openInvitationModal() {
	resetInvitationForm();
	showNewUserModal = true;
}

function buildInvitationUrl(token: string) {
	if (!browser) {
		return `/register/${token}`;
	}

	const origin = window.location.origin;
	return `${origin}/register/${token}`;
}

function handleGenerateInvitation(event: Event) {
	event.preventDefault();
	generatedInvitation = null;
	generatedInviteUrl = null;

	createInvitation(
		{
			role: inviteRole,
			email: inviteEmail || undefined,
			expiresInHours: inviteExpiresInHours,
		},
		{
			onSuccess: (invitation) => {
				generatedInvitation = invitation;
				generatedInviteUrl = buildInvitationUrl(invitation.token);
				successToast.created('Convite');
				userInvitationsQuery.refetch();
			},
			onError: (error: any) => {
				console.error('Create invitation failed:', error);
				const message =
					error?.response?.data?.message ||
					error?.message ||
					'Ocorreu um erro ao gerar o convite.';
				showError(message);
			},
		},
	);
}

function isInvitationExpired(invitation: UserInvitation) {
	if (!invitation.expiresAt) return false;
	return new Date(invitation.expiresAt).getTime() < Date.now();
}

function getInvitationStatus(invitation: UserInvitation) {
	if (invitation.used) {
		return 'Utilizado';
	}
	if (isInvitationExpired(invitation)) {
		return 'Expirado';
	}
	return 'Ativo';
}

function getInvitationStatusVariant(invitation: UserInvitation): 'default' | 'secondary' | 'destructive' | 'outline' {
	if (invitation.used) {
		return 'secondary';
	}
	if (isInvitationExpired(invitation)) {
		return 'destructive';
	}
	return 'default';
}

async function copyInviteLink(link: string) {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(link);
			showSuccess('Link do convite copiado para a área de transferência!');
			return;
		}
		const textarea = document.createElement('textarea');
		textarea.value = link;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		showSuccess('Link do convite copiado para a área de transferência!');
	} catch (error) {
		console.error('Failed to copy invite link:', error);
		showError('Não foi possível copiar o link. Tente novamente.');
	}
}

function getRoleBadge(role: UserRole) {
	const roleConfig = USER_ROLES[role];
	return roleConfig;
}

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

$effect(() => {
	searchTerm;
	roleFilter;
	statusFilter;
	currentPage = 1;
});

$effect(() => {
	if (currentPage > totalPages) {
		currentPage = totalPages;
	}
});

function handleSelectPage(page: number) {
	if (page !== currentPage) {
		currentPage = page;
	}
}

function handlePreviousPage() {
	if (currentPage > 1) {
		currentPage -= 1;
	}
}

function handleNextPage() {
	if (currentPage < totalPages) {
		currentPage += 1;
	}
}

function handlePageSizeChange(size: number) {
	if (size !== pageSize) {
		pageSize = size;
		currentPage = 1;
	}
}
</script>

<svelte:head>
	<title>Funcionários - Intersul</title>
</svelte:head>

{#if !$canManageUsers}
	<div class="flex items-center justify-center min-h-[400px]">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-red-600">Acesso Negado</h2>
			<p class="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
		</div>
	</div>
{:else}
	<div class="space-y-6 px-6">
		<!-- Header -->
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold">Funcionários</h1>
				<p class="text-muted-foreground">Gerencie os funcionários do sistema</p>
			</div>
			<Button onclick={openInvitationModal}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
				</svg>
				Gerar convite
			</Button>
		</div>

		<Tabs bind:value={activeTab} class="space-y-6">
			<TabsList>
				<TabsTrigger value="users">Funcionários</TabsTrigger>
				<TabsTrigger value="invitations">Convites</TabsTrigger>
			</TabsList>

			<TabsContent value="users" class="space-y-6">
		<!-- Filters -->
		<Card>
			<CardHeader>
				<CardTitle>Filtros</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="search" class="block text-sm font-medium mb-2">Buscar</label>
						<Input
							id="search"
							placeholder="Buscar por nome ou email"
							bind:value={searchTerm}
						/>
					</div>
					<div>
						<label for="role" class="block text-sm font-medium mb-2">Função</label>
						<Select
							type="single"
							value={roleFilter}
							onValueChange={(value: string) => {
								roleFilter = (value as RoleFilterOption) ?? 'all';
							}}
						>
							<SelectTrigger class="w-full">
								<span class="block text-left text-sm">
									{roleFilterLabels[roleFilter]}
								</span>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas</SelectItem>
								{#each Object.entries(USER_ROLES) as [roleKey, config]}
									<SelectItem value={roleKey}>
										{config.label}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
					<div>
						<label for="status" class="block text-sm font-medium mb-2">Status</label>
						<Select
							type="single"
							value={statusFilter}
							onValueChange={(value: string) => {
								statusFilter = (value as StatusFilterOption) ?? 'all';
							}}
						>
							<SelectTrigger class="w-full">
								<span class="block text-left text-sm">
									{statusFilterLabels[statusFilter]}
								</span>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="active">Ativo</SelectItem>
								<SelectItem value="inactive">Inativo</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Users List -->
		<Card>
			{#if isLoading}
				<CardContent class="p-6">
					<div class="space-y-4">
						{#each Array(5) as _}
							<div class="flex items-center space-x-4">
								<Skeleton class="h-12 w-12 rounded-full" />
								<div class="space-y-2">
									<Skeleton class="h-4 w-[200px]" />
									<Skeleton class="h-4 w-[160px]" />
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			{:else if !users || users.length === 0}
				<CardContent class="p-6">
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
						</svg>
						<h3 class="mt-2 text-sm font-medium">Nenhum usuário encontrado</h3>
						<p class="mt-1 text-sm text-muted-foreground">Comece criando um novo usuário.</p>
						<div class="mt-6">
							<Button onclick={openInvitationModal}>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								Gerar convite
							</Button>
						</div>
					</div>
				</CardContent>
			{:else}
				<CardContent class="p-0">
					<div class="divide-y">
						{#each paginatedUsers as user (user.id)}
							<div class="p-6 flex items-center justify-between hover:bg-muted/50">
								<div class="flex items-center space-x-4">
									<div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
										<span class="text-sm font-medium text-primary-foreground">
											{user.name.charAt(0).toUpperCase()}
										</span>
									</div>
									<div>
										<div class="flex items-center space-x-2">
											<p class="text-sm font-medium">{user.name}</p>
											<Badge variant={getRoleBadgeVariant(user.role)}>
												{getRoleBadge(user.role).label}
											</Badge>
											<Badge variant={user.isActive ? 'default' : 'secondary'}>
												{user.isActive ? 'Ativo' : 'Inativo'}
											</Badge>
										</div>
										<div class="mt-1">
											<p class="text-sm text-muted-foreground">{user.email}</p>
											{#if user.position}
												<p class="text-sm text-muted-foreground">{user.position}</p>
											{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center space-x-2">
									<span class="text-sm text-muted-foreground">
										Criado: {formatDate(user.createdAt)}
									</span>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="sm" class="px-2">
												<MoreVertical class="w-4 h-4" />
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item
												onclick={() => handleToggleActive(user)}
												disabled={isToggling}
											>
												{user.isActive ? 'Desativar' : 'Ativar'}
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => goto(`/admin/users/${user.id}/edit`)}>
												<Edit class="w-4 h-4" />
												Editar
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												variant="destructive"
												onclick={() => requestDeleteUser(user)}
												disabled={isDeleting}
											>
												<Trash2 class="w-4 h-4" />
												Excluir
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
							</div>
						{/each}
					</div>

					{#if totalUsers > 0}
						<div class="px-6 pb-6">
							<PaginationControls
								page={currentPage}
								totalPages={totalPages}
								totalItems={totalUsers}
								pageSize={pageSize}
								label="usuários"
								onPrevious={handlePreviousPage}
								onNext={handleNextPage}
								onSelectPage={handleSelectPage}
								onPageSizeChange={handlePageSizeChange}
								pageSizeOptions={pageSizeOptions}
							/>
						</div>
					{/if}
				</CardContent>
			{/if}
		</Card>
			</TabsContent>

			<TabsContent value="invitations" class="space-y-6">
				<Card>
					<CardHeader>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle>Convites de acesso</CardTitle>
								<CardDescription>
									Gere e acompanhe os convites enviados para novos usuários.
								</CardDescription>
							</div>
							<Button variant="outline" onclick={openInvitationModal}>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								Novo convite
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{#if isLoadingInvitations}
							<div class="space-y-3">
								{#each Array(3) as _}
									<Skeleton class="h-16 w-full" />
								{/each}
							</div>
						{:else if !userInvitations || userInvitations.length === 0}
							<div class="text-center py-12">
								<svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m2-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
								</svg>
								<h3 class="mt-2 text-sm font-medium">Nenhum convite encontrado</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									Gere um convite e compartilhe o link com o novo usuário para completar o cadastro.
								</p>
								<div class="mt-6">
									<Button onclick={openInvitationModal}>Criar convite</Button>
								</div>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Convite</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Expira em</TableHead>
											<TableHead>Criado em</TableHead>
											<TableHead>Criado por</TableHead>
											<TableHead class="text-right w-[160px]">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each userInvitations as invitation (invitation.id)}
											<TableRow>
												<TableCell>
													<div class="flex flex-col gap-1">
														<div class="flex items-center gap-2">
															<Badge variant="outline">
																{USER_ROLES[invitation.role]?.label ?? invitation.role}
															</Badge>
															<span class="text-sm text-muted-foreground">
																{invitation.email ?? 'Qualquer e-mail'}
															</span>
														</div>
														<span class="text-xs text-muted-foreground break-all">
															Token: {invitation.token}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={getInvitationStatusVariant(invitation)}>
														{getInvitationStatus(invitation)}
													</Badge>
													{#if invitation.used && invitation.usedAt}
														<p class="text-xs text-muted-foreground mt-1">
															Usado em {formatDate(invitation.usedAt)}
														</p>
													{/if}
												</TableCell>
												<TableCell>
													{invitation.expiresAt ? formatDate(invitation.expiresAt) : 'Sem expiração'}
												</TableCell>
												<TableCell>{formatDate(invitation.createdAt)}</TableCell>
												<TableCell>{invitation.createdBy?.name ?? '-'}</TableCell>
												<TableCell class="text-right">
													<div class="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onclick={() => copyInviteLink(buildInvitationUrl(invitation.token))}
														>
															<Copy class="w-4 h-4 mr-2" />
															Copiar link
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onclick={() => window.open(buildInvitationUrl(invitation.token), '_blank')}
														>
															Abrir
														</Button>
													</div>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	</div>

	<ConfirmationDialog
		bind:open={showDeleteConfirmation}
		title="Excluir Usuário"
		description={`Tem certeza que deseja excluir o usuário ${userToDelete?.name ?? ''}? Esta ação não pode ser desfeita.`}
		confirmText="Excluir"
		cancelText="Cancelar"
		variant="destructive"
		icon="trash"
		loading={isDeleting}
		onConfirm={confirmDeleteUser}
		onCancel={closeDeleteDialog}
	/>

	<!-- Invitation Modal -->
	{#if showNewUserModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold">Novo Convite</h3>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								showNewUserModal = false;
								resetInvitationForm();
							}}
						>
							✕
						</Button>
					</div>
					<form class="space-y-6" onsubmit={handleGenerateInvitation}>
						<div class="space-y-2">
							<Label>Função do usuário</Label>
							<Select
								type="single"
								value={inviteRole}
								onValueChange={(value: string) => {
									inviteRole = (value as UserRole) ?? UserRole.TECHNICIAN;
								}}
							>
								<SelectTrigger class="w-full">
									{USER_ROLES[inviteRole]?.label ?? 'Selecione a função'}
								</SelectTrigger>
								<SelectContent>
									{#each Object.entries(USER_ROLES) as [roleKey, config]}
										<SelectItem value={roleKey}>
											{config.label}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div class="space-y-2">
							<Label for="invite-email">E-mail (opcional)</Label>
							<Input
								id="invite-email"
								type="email"
								placeholder="email@empresa.com"
								bind:value={inviteEmail}
							/>
							<p class="text-xs text-muted-foreground">
								Preencha para restringir o convite a um e-mail específico. Deixe em branco para permitir qualquer e-mail.
							</p>
						</div>

						<div class="space-y-2">
							<Label>Validade</Label>
							<Select
								type="single"
								value={inviteExpiresInHours.toString()}
								onValueChange={(value: string) => {
									const parsed = Number.parseInt(value, 10);
									inviteExpiresInHours = Number.isNaN(parsed) ? 72 : parsed;
								}}
							>
								<SelectTrigger class="w-full">
									{invitationExpirationOptions.find((option) => option.value === inviteExpiresInHours)?.label ?? 'Selecione a validade'}
								</SelectTrigger>
								<SelectContent>
									{#each invitationExpirationOptions as option (option.value)}
										<SelectItem value={option.value.toString()}>
											{option.label}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div class="flex items-center justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="ghost"
								onclick={() => {
									showNewUserModal = false;
									resetInvitationForm();
								}}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isCreatingInvitation}>
								{isCreatingInvitation ? 'Gerando...' : 'Gerar convite'}
							</Button>
						</div>
					</form>

					{#if generatedInvitation && generatedInviteUrl}
						<div class="mt-6 space-y-4 border-t pt-4">
							<div class="space-y-2">
								<h4 class="text-sm font-semibold">Convite gerado com sucesso</h4>
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant="outline">
										{USER_ROLES[generatedInvitation.role]?.label ?? generatedInvitation.role}
									</Badge>
									<Badge variant={getInvitationStatusVariant(generatedInvitation)}>
										{getInvitationStatus(generatedInvitation)}
									</Badge>
								</div>
								<p class="text-sm text-muted-foreground">
									{generatedInvitation.email
										? `Convite restrito ao e-mail ${generatedInvitation.email}.`
										: 'Convite disponível para qualquer e-mail.'}
								</p>
								<p class="text-xs text-muted-foreground">
									{generatedInvitation.expiresAt
										? `Válido até ${formatDate(generatedInvitation.expiresAt)}.`
										: 'Sem data de expiração definida.'}
								</p>
							</div>

							<div class="space-y-2">
								<Label>Link do convite</Label>
								<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
									<Input readonly value={generatedInviteUrl} />
									<Button
										type="button"
										variant="secondary"
										onclick={() => {
											if (generatedInviteUrl) {
												copyInviteLink(generatedInviteUrl);
											}
										}}
									>
										<Copy class="w-4 h-4 mr-2" />
										Copiar link
									</Button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}
