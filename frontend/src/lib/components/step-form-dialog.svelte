<script lang="ts">
	import { useUpdateStep, useStepImages } from '$lib/hooks/queries/use-steps.svelte.js';
	import { useUpdateBilling } from '$lib/hooks/queries/use-billings.svelte.js';
	import { errorToast, successToast, showError } from '$lib/utils/toast.js';
	import { formatCurrency, getPaymentMethodLabel } from '$lib/utils/formatting.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { LoadingButton } from '$lib/components/ui/loading-button/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import StepImagesUpload from '$lib/components/step-images-upload.svelte';
	import { queryClient } from '$lib/config/query-client.js';
	import { env } from '$lib/config/env.js';
	import type { Step, Image } from '$lib/api/types/service.types.js';

	let {
		step,
		open = $bindable(false),
		onSuccess = () => {},
	} = $props<{
		step: Step;
		open?: boolean;
		onSuccess?: () => void;
	}>();

	const { mutate: updateStep, isPending: isUpdatingStep } = useUpdateStep();
	const { mutate: updateBilling, isPending: isUpdatingBilling } = useUpdateBilling();

	// Images query — internal to dialog
	const imagesQuery = $derived(useStepImages(step.id, { enabled: () => open }));
	const images = $derived(imagesQuery.data || []);

	// Image preview state
	let selectedImage = $state<Image | null>(null);
	let showImagePreview = $state(false);

	function handleImageClick(image: Image) {
		selectedImage = image;
		showImagePreview = true;
	}

	let observation = $state('');
	let responsableClient = $state('');
	let isSaving = $state(false);

	// Billing fields
	let previousCounter = $state<number | null>(null);
	let currentCounter = $state<number | null>(null);
	let paymentMethod = $state('');
	let isInvoiced = $state(false);
	let calculatedAmountToReceive = $state<number | null>(null);

	const isFormEnabled = $derived(step?.status === 'IN_PROGRESS');
	const isBillingStep = $derived(step?.isBilling === true);

	function calculateAmountToReceive(prev: number, curr: number, franchise: any): number {
		const copies = curr - prev;
		const baseRate = franchise.basePrice ?? 0.01;
		const excessRate = franchise.excessPrice ?? 0.009;
		const minimumCopies = franchise.minimumCopies ?? 5000;
		const excessCopies = Math.max(0, copies - minimumCopies);
		return (minimumCopies * baseRate) + (excessCopies * excessRate);
	}

	// Update form fields when step changes
	$effect(() => {
		if (step) {
			observation = step.observation ?? '';
			responsableClient = step.responsableClient ?? '';

			if (step.billing) {
				previousCounter = step.billing.previousCounter ?? null;
				currentCounter = step.billing.currentCounter ?? null;
				paymentMethod = step.billing.paymentMethod ?? '';
				isInvoiced = step.billing.isInvoiced ?? false;

				if (currentCounter !== null && previousCounter !== null && step.billing.copyMachine?.franchise) {
					calculatedAmountToReceive = calculateAmountToReceive(
						previousCounter,
						currentCounter,
						step.billing.copyMachine.franchise
					);
				} else {
					calculatedAmountToReceive = null;
				}
			}
		}
	});

	function handleSave() {
		isSaving = true;
		updateStep(
			{
				id: step.id,
				data: {
					observation: observation.trim() || undefined,
					responsableClient: responsableClient.trim() || undefined,
				},
			},
			{
				onSuccess: () => {
					successToast.updated('Etapa');
					onSuccess();
					open = false;
					isSaving = false;
				},
				onError: () => {
					errorToast.update('Etapa');
					isSaving = false;
				},
			},
		);
	}

	function handleSaveBilling() {
		if (currentCounter === null) {
			showError('Por favor, preencha o contador atual');
			return;
		}
		if (previousCounter === null) {
			showError('Por favor, preencha o contador anterior');
			return;
		}

		const amountToReceive = calculatedAmountToReceive ?? 0;

		isSaving = true;
		
		// First update step data (observation, responsableClient)
		updateStep(
			{
				id: step.id,
				data: {
					observation: observation.trim() || undefined,
					responsableClient: responsableClient.trim() || undefined,
				},
			},
			{
				onSuccess: () => {
					// Then update billing data
					updateBilling(
						{
							id: step.billing.id,
							data: {
								previousCounter,
								currentCounter,
								paymentMethod: paymentMethod || undefined,
								amountToReceive,
								isInvoiced,
							},
						},
						{
							onSuccess: () => {
								successToast.updated('Fechamento');
								onSuccess();
								open = false;
								isSaving = false;
							},
							onError: () => {
								errorToast.update('Fechamento');
								isSaving = false;
							},
						},
					);
				},
				onError: () => {
					errorToast.update('Etapa');
					isSaving = false;
				},
			},
		);
	}

	const canSave = $derived(isFormEnabled);

	// Reset saving state when dialog opens
	$effect(() => {
		if (open) {
			isSaving = false;
		}
	});
</script>

<Dialog.Root bind:open={open}>
	<Dialog.Content class="w-full h-full max-w-none sm:max-w-xl sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0">
		<div class="flex flex-col h-full sm:max-h-[85vh]">
			<Dialog.Header class="p-4 sm:p-6 shrink-0">
				<Dialog.Title>Preencher Etapa</Dialog.Title>
				<Dialog.Description>
					{step?.name}
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 space-y-6">
				{#if isBillingStep && step.billing}
					<Card>
						<CardHeader class="pb-3">
							<CardTitle class="text-base">Informações do Fechamento</CardTitle>
							<CardDescription>
								Preencha as informações do fechamento de franquia
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if !isFormEnabled}
								<p class="text-sm text-muted-foreground">
									Para preencher este formulário, você precisa iniciar a etapa.
								</p>
							{:else}
								<div class="space-y-4">
									<div>
										<Label for="previousCounter">Contador Anterior</Label>
										<Input
											id="previousCounter"
											type="number"
											bind:value={previousCounter}
											disabled={!canSave}
										/>
									</div>
									<div>
										<Label for="currentCounter">Contador Atual</Label>
										<Input
											id="currentCounter"
											type="number"
											bind:value={currentCounter}
											disabled={!canSave}
										/>
									</div>
								</div>

								<div>
									<Label for="paymentMethod">Forma de Pagamento</Label>
									<Select bind:value={paymentMethod} disabled={!canSave}>
										<SelectTrigger>
											<span>{paymentMethod ? getPaymentMethodLabel(paymentMethod) : 'Selecione'}</span>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="BOLETO">Boleto</SelectItem>
											<SelectItem value="PIX">PIX</SelectItem>
											<SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
											<SelectItem value="DINHEIRO">Dinheiro</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div class="flex items-center gap-2">
									<input
										type="checkbox"
										id="isInvoiced"
										bind:checked={isInvoiced}
										disabled={!canSave}
										class="rounded"
									/>
									<Label for="isInvoiced">Faturado</Label>
								</div>

								{#if calculatedAmountToReceive !== null}
									<div class="bg-muted p-3 rounded-lg">
										<p class="text-sm text-muted-foreground">Valor a Receber</p>
										<p class="text-lg font-semibold">{formatCurrency(calculatedAmountToReceive)}</p>
									</div>
								{/if}
							{/if}
						</CardContent>
					</Card>
				{/if}

				<div class="space-y-4">
					<div>
						<Label for="observation">Observação</Label>
						<textarea
							id="observation"
							bind:value={observation}
							disabled={!canSave}
							class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Adicione observações sobre esta etapa..."
						></textarea>
					</div>

					<div>
						<Label for="responsableClient">Responsável Cliente</Label>
					<Input
						id="responsableClient"
						bind:value={responsableClient}
						disabled={!canSave}
						placeholder="Nome do responsável pelo cliente"
					/>
				</div>

				<!-- Images Section -->
				<div class="space-y-2">
					<StepImagesUpload
						stepId={step.id}
						{images}
						disabled={!isFormEnabled}
						onImageUploaded={() => {
							queryClient.invalidateQueries({ queryKey: ['steps', step.id, 'images'] });
						}}
						onImageDeleted={() => {
							queryClient.invalidateQueries({ queryKey: ['steps', step.id, 'images'] });
						}}
						onImageClick={handleImageClick}
					/>
				</div>
			</div>
		</div>

		<Dialog.Footer class="p-4 sm:p-6 shrink-0 flex flex-col sm:flex-row gap-2">
			<Button variant="outline" onclick={() => (open = false)} class="w-full sm:w-auto">
				Cancelar
			</Button>
			{#if isBillingStep && step.billing}
				<LoadingButton
					onclick={handleSaveBilling}
					loading={isSaving || isUpdatingBilling}
					disabled={!canSave}
					class="w-full sm:w-auto"
				>
					Salvar Fechamento
				</LoadingButton>
			{:else}
				<LoadingButton
					onclick={handleSave}
					loading={isSaving || isUpdatingStep}
					disabled={!canSave}
					class="w-full sm:w-auto"
				>
					Salvar
				</LoadingButton>
			{/if}
		</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Image Preview Dialog -->
<Dialog.Root bind:open={showImagePreview}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] p-0">
		{#if selectedImage}
			<div class="relative w-full h-full">
				<img
					src={selectedImage.path.startsWith('http') ? selectedImage.path : `${env.API_URL}${selectedImage.path}`}
					alt="Preview da imagem"
					class="w-full h-auto max-h-[85vh] object-contain"
				/>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
