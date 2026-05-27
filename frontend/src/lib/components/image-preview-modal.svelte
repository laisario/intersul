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
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartPanX = 0;
	let dragStartPanY = 0;

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
		resetView();
	}

	function goToNext() {
		if (images.length === 0) return;
		currentIndex = (currentIndex + 1) % images.length;
		resetView();
	}

	function zoomIn() {
		zoom = Math.min(zoom + 0.25, 3);
	}

	function zoomOut() {
		const nextZoom = Math.max(zoom - 0.25, 1);
		zoom = nextZoom;
		if (nextZoom === 1) {
			resetPan();
		}
	}

	function resetZoom() {
		resetView();
	}

	function resetPan() {
		panX = 0;
		panY = 0;
		isDragging = false;
	}

	function resetView() {
		zoom = 1;
		resetPan();
	}

	function handlePointerDown(event: PointerEvent) {
		if (zoom <= 1) return;
		event.preventDefault();
		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartPanX = panX;
		dragStartPanY = panY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || zoom <= 1) return;
		panX = dragStartPanX + event.clientX - dragStartX;
		panY = dragStartPanY + event.clientY - dragStartY;
	}

	function handlePointerEnd(event: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		const target = event.currentTarget as HTMLElement;
		if (target.hasPointerCapture(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToNext();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToPrevious();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
	}

	$effect(() => {
		if (open) {
			currentIndex = clampIndex(initialIndex);
			resetView();
		}
	});

	$effect(() => {
		if (!open || typeof window === 'undefined') return;

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
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

			<div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-3">
				{#if currentImage}
					<img
						src={getImageUrl(currentImage.path)}
						alt="Preview da imagem"
						draggable="false"
						class={`max-h-full max-w-full select-none object-contain ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'} ${isDragging ? '' : 'transition-transform duration-150'}`}
						style={`transform: translate3d(${panX}px, ${panY}px, 0) scale(${zoom}); touch-action: none;`}
						onpointerdown={handlePointerDown}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerEnd}
						onpointercancel={handlePointerEnd}
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
