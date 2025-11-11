<script lang="ts">
	import { goto } from '$app/navigation';
	import { useInvitationDetails, useAcceptInvitation } from '$lib/hooks/queries/use-auth.svelte.js';
	import { showError, showSuccess } from '$lib/utils/toast.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import { USER_ROLES } from '$lib/utils/constants.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { InvitationDetails } from '$lib/api/types/auth.types.js';

	export let data: { token: string };

	const token = data.token;

	const invitationQuery = $derived(useInvitationDetails(token));
	const invitation = $derived(invitationQuery.data as InvitationDetails | undefined);
	const isLoadingInvitation = $derived(invitationQuery.isLoading);
	const isInvitationError = $derived(invitationQuery.isError);
	const invitationErrorMessage = $derived(() => {
		const error: any = invitationQuery.error;
		return error?.response?.data?.message || error?.message || 'Não foi possível validar o convite.';
	});

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation();

	const isInvitationExpired = $derived(() => {
		if (!invitation?.expiresAt) return false;
		return new Date(invitation.expiresAt).getTime() < Date.now();
	});

	const isInvitationUsed = $derived(() => invitation?.used ?? false);
	const isEmailLocked = $derived(() => !!invitation?.email);

	$effect(() => {
		if (invitation?.email) {
			email = invitation.email;
		}
	});

	function handleSubmit(event: Event) {
		event.preventDefault();

		if (!invitation || isInvitationUsed || isInvitationExpired) {
			showError('Este convite não está mais disponível.');
			return;
		}

		if (!name.trim() || !email.trim() || !password) {
			showError('Preencha todos os campos obrigatórios.');
			return;
		}

		if (password !== confirmPassword) {
			showError('As senhas não conferem.');
			return;
		}

		acceptInvitation(
			{
				token,
				name: name.trim(),
				email: email.trim(),
				password,
			},
			{
				onSuccess: () => {
					showSuccess('Convite aceito com sucesso!');
					goto('/services');
				},
				onError: (error: any) => {
					const message =
						error?.response?.data?.message ||
						error?.message ||
						'Não foi possível concluir o cadastro com este convite.';
					showError(message);
				},
			},
		);
	}
</script>

<svelte:head>
	<title>Aceitar convite - Intersul</title>
</svelte:head>

<div class="min-h-screen bg-muted/50 flex items-center justify-center px-4 py-12">
	<Card class="w-full max-w-2xl">
		{#if isLoadingInvitation}
			<CardContent class="space-y-6">
				<div class="space-y-2">
					<Skeleton class="h-6 w-1/3" />
					<Skeleton class="h-4 w-2/3" />
				</div>
				<div class="space-y-3">
					{#each Array(4) as _}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			</CardContent>
		{:else if isInvitationError}
			<CardHeader class="space-y-2">
				<CardTitle>Convite inválido</CardTitle>
				<CardDescription>{invitationErrorMessage}</CardDescription>
			</CardHeader>
			<CardContent class="flex justify-end">
				<Button onclick={() => goto('/login')}>Ir para o login</Button>
			</CardContent>
		{:else}
			<CardHeader class="space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant="outline">
						{USER_ROLES[invitation?.role ?? 'TECHNICIAN']?.label ?? invitation?.role ?? 'Convite'}
					</Badge>
					{#if invitation?.email}
						<Badge variant="secondary">{invitation.email}</Badge>
					{/if}
				</div>
				<CardTitle>Finalize seu cadastro</CardTitle>
				<CardDescription>
					{#if isInvitationUsed}
						Este convite já foi utilizado. Solicite um novo link ao administrador.
					{:else if isInvitationExpired}
						Este convite expirou em {invitation?.expiresAt ? formatDate(invitation.expiresAt) : 'data desconhecida'}.
					{:else}
						Você foi convidado para acessar a plataforma como
						{USER_ROLES[invitation?.role ?? 'TECHNICIAN']?.label ?? invitation?.role}.
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				{#if isInvitationUsed || isInvitationExpired}
					<div class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
						{#if isInvitationUsed}
							O convite já foi utilizado. Solicite um novo link ao administrador.
						{:else}
							O convite expirou. Solicite um novo link ao administrador.
						{/if}
					</div>
					<div class="flex justify-end">
						<Button onclick={() => goto('/login')}>Ir para o login</Button>
					</div>
				{:else}
					<form class="space-y-4" onsubmit={handleSubmit}>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2 sm:col-span-2">
								<Label for="invite-name">Nome completo</Label>
								<Input
									id="invite-name"
									placeholder="Seu nome"
									bind:value={name}
									required
								/>
							</div>

							<div class="space-y-2 sm:col-span-2">
								<Label for="invite-email-input">E-mail</Label>
								<Input
									id="invite-email-input"
									type="email"
									placeholder="email@empresa.com"
									bind:value={email}
									readonly={isEmailLocked}
									required
								/>
								{#if isEmailLocked}
									<p class="text-xs text-muted-foreground">Este convite está vinculado a este e-mail.</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="invite-password">Senha</Label>
								<Input
									id="invite-password"
									type="password"
									placeholder="Crie uma senha"
									bind:value={password}
									minlength="8"
									required
								/>
							</div>
							<div class="space-y-2">
								<Label for="invite-password-confirm">Confirmar senha</Label>
								<Input
									id="invite-password-confirm"
									type="password"
									placeholder="Repita a senha"
									bind:value={confirmPassword}
									minlength="8"
									required
								/>
							</div>
						</div>

						<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							{#if invitation?.expiresAt}
								<p class="text-xs text-muted-foreground">
									Convite válido até {formatDate(invitation.expiresAt)}
								</p>
							{/if}
							<Button type="submit" disabled={isAccepting}>
								{isAccepting ? 'Criando conta...' : 'Criar conta'}
							</Button>
						</div>
					</form>
				{/if}
			</CardContent>
		{/if}
	</Card>
</div>

