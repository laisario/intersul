<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { env } from '$lib/config/env.js';
	import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from 'lucide-svelte';
	import type { Image } from '$lib/api/types/service.types.js';

	let {
		images = [],
		initialIndex = 0,
		open = $bindable(false),
	}: {
		images?: Image[];
		initialIndex?: number;
		open?: boolean;
	} = $props();

	let currentIndex = $state(0);
	let zoom = $state(1);

	const currentImage = $derived(images[currentIndex]);
	const hasMultipleImages = $derived(images.length > 1);

	function clampIndex(index: number) {
		if (images.length === 0) return 0;
		return Math.min(Math.max(index, 0), images.length - 1);
	}

	function getImageUrl(path: string) {
		if (path.startsWith('http')) return path;
		return `${env.API_URL}${path}`;
	}

	function goToPrevious() {
		if (images.length === 0) return;
		currentIndex = (currentIndex - 1 + images.length) % images.length;
		zoom = 1;
	}

	function goToNext() {
		if (images.length === 0) return;
		currentIndex = (currentIndex + 1) % images.length;
		zoom = 1;
	}

	function zoomIn() {
		zoom = Math.min(zoom + 0.25, 3);
	}

	function zoomOut() {
		zoom = Math.max(zoom - 0.25, 1);
	}

	function resetZoom() {
		zoom = 1;
	}

	$effect(() => {
		if (open) {
			currentIndex = clampIndex(initialIndex);
			zoom = 1;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden border bg-background/95 p-0 sm:h-[calc(100vh-3rem)] sm:w-[min(96vw,72rem)] sm:max-w-[72rem]"
		showCloseButton={false}
	>
		<div class="flex h-full min-h-0 flex-col">
			<div class="flex items-center justify-between gap-2 border-b px-3 py-2">
				<div class="min-w-0 text-sm text-muted-foreground">
					{#if images.length > 0}
						<span>{currentIndex + 1} de {images.length}</span>
					{/if}
				</div>

				<div class="flex items-center gap-1">
					<Button type="button" variant="ghost" size="sm" onclick={zoomOut} disabled={zoom <= 1} title="Reduzir zoom" aria-label="Reduzir zoom">
						<Minus class="h-4 w-4" />
					</Button>
					<Button type="button" variant="ghost" size="sm" onclick={resetZoom} disabled={zoom === 1} title="Restaurar zoom" aria-label="Restaurar zoom">
						<RotateCcw class="h-4 w-4" />
					</Button>
					<Button type="button" variant="ghost" size="sm" onclick={zoomIn} disabled={zoom >= 3} title="Aumentar zoom" aria-label="Aumentar zoom">
						<Plus class="h-4 w-4" />
					</Button>
					<Button type="button" variant="ghost" size="sm" onclick={() => (open = false)} title="Fechar preview" aria-label="Fechar preview">
						<X class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div class="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-3">
				{#if currentImage}
					<img
						src={getImageUrl(currentImage.path)}
						alt="Preview da imagem"
						class="max-h-full max-w-full object-contain transition-transform duration-150"
						style={`transform: scale(${zoom});`}
					/>

					{#if hasMultipleImages}
						<Button
							type="button"
							variant="secondary"
							size="sm"
							class="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full p-0 shadow-md"
							onclick={goToPrevious}
							title="Imagem anterior"
							aria-label="Imagem anterior"
						>
							<ChevronLeft class="h-5 w-5" />
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							class="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full p-0 shadow-md"
							onclick={goToNext}
							title="Próxima imagem"
							aria-label="Próxima imagem"
						>
							<ChevronRight class="h-5 w-5" />
						</Button>
					{/if}
				{:else}
					<p class="text-sm text-muted-foreground">Nenhuma imagem disponível</p>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
