<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { AlertTriangle, Trash2, X } from 'lucide-svelte';

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
		onCancel
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
				return 'text-red-600';
			case 'warning':
				return 'text-yellow-600';
			case 'info':
				return 'text-blue-600';
			default:
				return 'text-red-600';
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
			<Button
				variant={confirmButtonVariant()}
				onclick={handleConfirm}
				disabled={loading}
				class="w-full sm:w-auto"
			>
				{#if loading}
					<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Processando...
				{:else}
					{#if icon === 'trash'}
						<Trash2 class="w-4 h-4 mr-2" />
					{/if}
					{confirmText}
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
