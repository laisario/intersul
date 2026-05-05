<script lang="ts">
	import { useUpdateBilling } from '$lib/hooks/queries/use-billings.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { formatCurrency, getPaymentMethodLabel } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { LoadingButton } from '$lib/components/ui/loading-button/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { errorToast, successToast } from '$lib/utils/toast.js';
	import type { Billing } from '$lib/api/types/billing.types.js';

	let {
		billing,
		open = $bindable(false),
		onSuccess = () => {},
	}: {
		billing: Billing;
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	const { mutate: updateBilling, isPending: isUpdating } = useUpdateBilling();
	const usersQuery = useUsers({ includeInactive: true });
	const users = $derived(usersQuery.data ?? []);

	let previousCounter = $state<number | null>(null);
	let currentCounter = $state<number | null>(null);
	let paymentMethod = $state('');
	let isInvoiced = $state(false);
	let executionDate = $state('');
	let calculatedAmountToReceive = $state<number | null>(null);
	let initialized = $state(false);
	let responsibleUserIdStr = $state<string>('');

	function formatDateForInput(dateValue: string | Date | undefined): string {
		if (!dateValue) return '';
		const dateStr = String(dateValue);
		if (dateStr.includes('T')) {
			const [year, month, day] = dateStr.split('T')[0].split('-');
			return `${day}-${month}-${year}`;
		}
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${d}-${m}-${y}`;
	}

	function formatDateForBackend(dateValue: string): string | undefined {
		if (!dateValue) return undefined;
		const parts = dateValue.split('/');
		if (parts.length !== 3) return undefined;
		const [day, month, year] = parts;
		if (!day || !month || !year) return undefined;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	$effect(() => {
		if (billing && open && !initialized) {
			previousCounter = billing.previousCounter ?? null;
			currentCounter = billing.currentCounter ?? null;
			paymentMethod = billing.paymentMethod ?? '';
			isInvoiced = billing.isInvoiced ?? false;
			responsibleUserIdStr = billing.responsibleUserId ? String(billing.responsibleUserId) : '';
			executionDate = formatDateForInput(billing.date);
			initialized = true;
			calculateAmount();
		}
	});

	$effect(() => {
		if (open === false) {
			initialized = false;
		}
	});

	function calculateAmount() {
		if (previousCounter !== null && currentCounter !== null && billing.copyMachine?.franchise) {
			const franchise = billing.copyMachine.franchise;
			const copies = currentCounter - previousCounter;
			const franchiseQuantity = franchise.quantity;
			const unitPrice = Number(franchise.unitPrice);

			const franchiseValue = franchiseQuantity * unitPrice;

			if (copies > franchiseQuantity) {
				const excessCopies = copies - franchiseQuantity;
				const excessValue = excessCopies * unitPrice;
				calculatedAmountToReceive = franchiseValue + excessValue;
			} else {
				calculatedAmountToReceive = franchiseValue;
			}
		} else {
			calculatedAmountToReceive = null;
		}
	}

	$effect(() => {
		calculateAmount();
	});

function handleSave() {
		updateBilling(
			{
				id: billing.id,
				data: {
					previousCounter: previousCounter ?? undefined,
					currentCounter: currentCounter ?? undefined,
					paymentMethod: paymentMethod || undefined,
					isInvoiced,
					responsibleUserId: responsibleUserIdStr ? parseInt(responsibleUserIdStr) : undefined,
					date: formatDateForBackend(executionDate) || undefined,
				},
			},
			{
				onSuccess: () => {
					successToast.updated('Fechamento');
					open = false;
					onSuccess();
				},
				onError: (error: any) => {
					console.error('Error updating billing:', error);
					if (error.response?.data?.message) {
						errorToast.update('Fechamento');
					} else {
						errorToast.update('Fechamento');
					}
				},
			}
		);
	}
</script>

<Dialog.Root bind:open={open}>
	<Dialog.Content class="w-full h-full max-w-none sm:max-w-xl sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0">
		<div class="flex flex-col h-full sm:max-h-[85vh]">
			<Dialog.Header class="p-4 sm:p-6 shrink-0">
				<Dialog.Title>Editar Fechamento</Dialog.Title>
				<Dialog.Description>
					{billing.client?.name} {(billing.copyMachine?.catalogCopyMachine?.model || billing.copyMachine?.externalModel) && '-'}  {billing.copyMachine?.catalogCopyMachine?.model || billing.copyMachine?.externalModel}  {billing.copyMachine?.serialNumber && `- ${billing.copyMachine?.serialNumber}`}
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 space-y-6">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-base">Informações do Fechamento</CardTitle>
						<CardDescription>
							Edite os contadores e informações de pagamento
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="previousCounter">Contador Anterior</Label>
								<Input
									id="previousCounter"
									type="number"
									bind:value={previousCounter}
									placeholder="Digite o contador anterior"
								/>
							</div>
							<div>
								<Label for="currentCounter">Contador Atual</Label>
								<Input
									id="currentCounter"
									type="number"
									bind:value={currentCounter}
									placeholder="Digite o contador atual"
								/>
							</div>
						</div>

						<div>
							<Label for="paymentMethod">Forma de Pagamento</Label>
							<Select type="single" bind:value={paymentMethod}>
								<SelectTrigger class="w-full">
									<span>{paymentMethod ? getPaymentMethodLabel(paymentMethod) : 'Selecione'}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Bank Slip">Boleto</SelectItem>
									<SelectItem value="PIX">PIX</SelectItem>
									<SelectItem value="Transfer">Transferência</SelectItem>
									<SelectItem value="Cash">Dinheiro</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="isInvoiced"
								bind:checked={isInvoiced}
								class="rounded"
							/>
							<Label for="isInvoiced">Faturado / Pago</Label>
						</div>

						<div>
							<Label for="responsibleUser">Responsável</Label>
							<Select type="single" bind:value={responsibleUserIdStr}>
								<SelectTrigger class="w-full">
									<span>
										{#if responsibleUserIdStr}
											{users.find(u => u.id === parseInt(responsibleUserIdStr))?.name || 'Usuário não encontrado'}
										{:else}
											Selecione
										{/if}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Selecione</SelectItem>
									{#each users as user (user.id)}
										<SelectItem value={String(user.id)}>{user.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label for="executionDate">Data de Execução</Label>
							<Input
								id="executionDate"
								type="text"
								bind:value={executionDate}
								placeholder="dd/mm/aaaa"
								maxlength={10}
								oninput={(e) => {
									let value = e.currentTarget.value.replace(/\D/g, '');
									if (value.length > 2) {
										value = value.slice(0, 2) + '/' + value.slice(2);
									}
									if (value.length > 5) {
										value = value.slice(0, 5) + '/' + value.slice(5, 9);
									}
									executionDate = value;
								}}
							/>
						</div>

						{#if calculatedAmountToReceive !== null}
							<div class="bg-muted p-3 rounded-lg">
								<p class="text-sm text-muted-foreground">Valor a Receber</p>
								<p class="text-lg font-semibold">{formatCurrency(calculatedAmountToReceive)}</p>
							</div>
						{/if}

						<div class="pt-2 border-t">
							<p class="text-xs text-muted-foreground">
								<b>Cliente:</b> {billing.client?.name || '-'}
							</p>
							<p class="text-xs text-muted-foreground">
								<b>Cidade:</b> {billing.client?.address?.neighborhood?.city?.name || '-'}
							</p>
							<p class="text-xs text-muted-foreground">
								<b>Máquina:</b> {billing.copyMachine?.catalogCopyMachine?.model || billing.copyMachine?.externalModel || ''} {billing.copyMachine?.serialNumber ? `- ${billing.copyMachine?.serialNumber}` : ''}
							</p>
							<p class="text-xs text-muted-foreground">
								<b>Data:</b> {billing.date ? new Date(billing.date).toLocaleDateString('pt-BR') : '-'}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>

		<Dialog.Footer class="p-4 sm:p-6 shrink-0 flex flex-col sm:flex-row gap-2">
			<Button variant="outline" onclick={() => (open = false)} class="w-full sm:w-auto">
				Cancelar
			</Button>
			<LoadingButton
				onclick={handleSave}
				loading={isUpdating}
				class="w-full sm:w-auto"
			>
				Salvar
			</LoadingButton>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>