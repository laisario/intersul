<script lang="ts">
	import { page } from '$app/stores';
	import { useBilling, useUpdateBilling } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { formatDate, formatCurrency } from '$lib/utils/formatting.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { ArrowLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';

	const billingId = $derived.by(() => {
		const id = $page.params.id;
		if (!id) return 0;
		const numId = Number(id);
		return isNaN(numId) ? 0 : numId;
	});
	const billingQuery = $derived(useBilling(billingId));
	const billing = $derived(billingQuery.data);
	const isLoading = $derived(billingQuery.isLoading);
	const isError = $derived(billingQuery.isError);

	const usersQuery = useUsers();
	const users = $derived(usersQuery.data?.filter((u) => u.active) ?? []);

	const { mutate: updateBilling, isPending: isUpdating } = useUpdateBilling();

	let isEditMode = $state(false); // Always false - billing details are read-only
	let formData = $state({
		previous_counter: null as number | null,
		current_counter: null as number | null,
		payment_method: '',
		amount_to_receive: 0,
		is_invoiced: false,
		responsible_user_id: 0,
	});

	$effect(() => {
		if (billing) {
			formData = {
				previous_counter: billing.previousCounter ?? null,
				current_counter: billing.currentCounter ?? null,
				payment_method: billing.paymentMethod || '',
				amount_to_receive: billing.amountToReceive,
				is_invoiced: billing.isInvoiced ?? false,
				responsible_user_id: billing.responsibleUserId,
			};
		}
	});

	async function handleSave() {
		if (!billing) return;

		try {
			updateBilling(
				{
					id: billing.id,
					data: {
						previous_counter: formData.previous_counter ?? undefined,
						current_counter: formData.current_counter ?? undefined,
						payment_method: formData.payment_method || undefined,
						amount_to_receive: formData.amount_to_receive,
						is_invoiced: formData.is_invoiced,
						responsible_user_id: formData.responsible_user_id,
					},
				},
				{
					onSuccess: () => {
						successToast.updated('Fechamento');
						isEditMode = false;
					},
					onError: () => {
						errorToast.update('Fechamento');
					},
				}
			);
		} catch (err: any) {
			console.error('Error updating billing:', err);
			if (err.response?.data?.message) {
				showError(err.response.data.message);
			} else {
				errorToast.unknown();
			}
		}
	}

	function handleCancel() {
		if (billing) {
			formData = {
				previous_counter: billing.previousCounter ?? null,
				current_counter: billing.currentCounter ?? null,
				payment_method: billing.paymentMethod || '',
				amount_to_receive: billing.amountToReceive,
				is_invoiced: billing.isInvoiced ?? false,
				responsible_user_id: billing.responsibleUserId,
			};
		}
		isEditMode = false;
	}
</script>

<svelte:head>
	<title>Fechamento - Intersul</title>
</svelte:head>

<div class="space-y-6 px-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/billings')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Voltar
			</Button>
			<div>
				<h1 class="text-3xl font-bold">Detalhes do Fechamento</h1>
				<p class="text-muted-foreground">Visualize as informações do fechamento</p>
			</div>
		</div>
	</div>

	{#if isLoading}
		<Card>
			<CardContent class="p-6">
				<div class="space-y-4">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-32 w-full" />
				</div>
			</CardContent>
		</Card>
	{:else if isError || !billing}
		<Card>
			<CardContent class="p-6">
				<div class="text-center">
					<p class="text-lg font-medium text-red-600">Erro ao carregar fechamento</p>
					<p class="text-sm text-muted-foreground mt-2">
						{billingQuery.error?.message || 'Fechamento não encontrado ou você não tem permissão para visualizá-lo.'}
					</p>
					<Button onclick={() => goto('/billings')} class="mt-4">
						Voltar para Lista
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Billing Info -->
				<Card>
					<CardHeader>
						<CardTitle>Informações do Fechamento</CardTitle>
						<CardDescription>Dados do fechamento de franquia</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Read-only View Mode -->
						<div class="space-y-4">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm font-medium text-muted-foreground">Data</p>
									<p class="text-sm">{formatDate(billing.date)}</p>
								</div>
								<div>
									<p class="text-sm font-medium text-muted-foreground">Contador Anterior</p>
									<p class="text-sm">{billing.previousCounter ?? 'N/A'}</p>
								</div>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm font-medium text-muted-foreground">Contador Atual</p>
									<p class="text-sm">{billing.currentCounter ?? 'Não preenchido'}</p>
								</div>
								<div>
									<p class="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
									<p class="text-sm">{billing.paymentMethod || 'Não informado'}</p>
								</div>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm font-medium text-muted-foreground">Valor a Receber</p>
									<p class="text-sm font-semibold">{formatCurrency(billing.amountToReceive)}</p>
								</div>
								<div>
									<p class="text-sm font-medium text-muted-foreground">Pagamento Concluído</p>
									<p class="text-sm">{billing.isInvoiced ? 'Sim' : 'Não'}</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Client Info -->
				<Card>
					<CardHeader>
						<CardTitle>Cliente</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<p class="text-sm font-medium">{billing.client?.name || '-'}</p>
						{#if billing.client?.email}
							<p class="text-sm text-muted-foreground">{billing.client.email}</p>
						{/if}
						{#if billing.client?.phone}
							<p class="text-sm text-muted-foreground">{billing.client.phone}</p>
						{/if}
						{#if billing.client?.address}
							<p class="text-sm text-muted-foreground">
								{billing.client.address.neighborhood?.city?.name || ''}
								{#if billing.client.address.neighborhood?.city?.state?.code}
									- {billing.client.address.neighborhood.city.state.code}
								{/if}
							</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Machine Info -->
				<Card>
					<CardHeader>
						<CardTitle>Máquina</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<p class="text-sm font-medium">
							{billing.copyMachine?.catalogCopyMachine?.model ||
								billing.copyMachine?.externalModel ||
								'Máquina'}
						</p>
						{#if billing.copyMachine?.serialNumber}
							<p class="text-sm text-muted-foreground">Série: {billing.copyMachine.serialNumber}</p>
						{/if}
						{#if billing.copyMachine?.franchise}
							<p class="text-sm text-muted-foreground">
								Franquia: {billing.copyMachine.franchise.quantity} páginas
							</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Responsible Info -->
				<Card>
					<CardHeader>
						<CardTitle>Responsável</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-sm font-medium">
							{billing.responsibleUser?.name || 'Não atribuído'}
						</p>
						{#if billing.responsibleUser?.email}
							<p class="text-sm text-muted-foreground">{billing.responsibleUser.email}</p>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>


