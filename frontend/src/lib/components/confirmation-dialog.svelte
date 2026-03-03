<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { LoadingButton } from '$lib/components/ui/loading-button/index.js';
	import { AlertTriangle, Trash2, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'destructive' | 'warning' | 'info';
		icon?: 'trash' | 'warning' | 'info' | 'none';
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel: () => void;
		children?: Snippet;
	}

	let {
		open = $bindable(),
		title = 'Confirmar ação',
		description = 'Tem certeza que deseja continuar? Esta ação não pode ser desfeita.',
		confirmText = 'Confirmar',
		cancelText = 'Cancelar',
		variant = 'destructive',
		icon = 'warning',
		loading = false,
		onConfirm,
		onCancel,
		children
	}: Props = $props();

	async function handleConfirm() {
		loading = true;
		try {
			await onConfirm();
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		if (!loading) {
			onCancel();
		}
	}

	// Get icon component based on variant
	let IconComponent = $derived(() => {
		switch (icon) {
			case 'trash':
				return Trash2;
			case 'warning':
				return AlertTriangle;
			case 'info':
				return AlertTriangle;
			case 'none':
				return null;
			default:
				return AlertTriangle;
		}
	});

	// Get button variant based on confirmation variant
	let confirmButtonVariant = $derived(() => {
		switch (variant) {
			case 'destructive':
				return 'destructive' as const;
			case 'warning':
				return 'default' as const;
			case 'info':
				return 'default' as const;
			default:
				return 'destructive' as const;
		}
	});

	// Get icon color based on variant
	let iconColor = $derived(() => {
		switch (variant) {
			case 'destructive':
				return 'text-destructive';
			case 'warning':
				return 'text-yellow-600';
			case 'info':
				return 'text-blue-600';
			default:
				return 'text-destructive';
		}
	});
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<div class="flex items-center space-x-3">
				{#if IconComponent()}
					<div class="flex-shrink-0">
						{#if icon === 'trash'}
							<Trash2 class="w-6 h-6 {iconColor()}" />
						{:else if icon === 'warning' || icon === 'info'}
							<AlertTriangle class="w-6 h-6 {iconColor()}" />
						{/if}
					</div>
				{/if}
				<div>
					<DialogTitle class="text-lg font-semibold">{title}</DialogTitle>
					<DialogDescription class="mt-1 text-sm text-muted-foreground">
						{description}
					</DialogDescription>
				</div>
			</div>
		</DialogHeader>

		{#if children}
			<div class="py-4">
				{@render children()}
			</div>
		{/if}

		<DialogFooter class="flex-col sm:flex-row gap-2">
			<Button
				variant="outline"
				onclick={handleCancel}
				disabled={loading}
				class="w-full sm:w-auto"
			>
				<X class="w-4 h-4 mr-2" />
				{cancelText}
			</Button>
			<LoadingButton
				variant={confirmButtonVariant()}
				onclick={handleConfirm}
				loading={loading}
				loadingText="Processando..."
				class="w-full sm:w-auto"
			>
				{#if icon === 'trash'}
					<Trash2 class="w-4 h-4 mr-2" />
				{/if}
				{confirmText}
			</LoadingButton>
		</DialogFooter>
	</DialogContent>
</Dialog>
