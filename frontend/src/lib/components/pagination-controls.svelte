<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';

	const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
	const MAX_BUTTONS = 5;

	type PaginationControlsProps = {
		page?: number;
		totalPages?: number;
		totalItems?: number;
		pageSize?: number;
		label?: string;
		onPrevious?: () => void;
		onNext?: () => void;
		onSelectPage?: (page: number) => void;
		onPageSizeChange?: (size: number) => void;
		pageSizeOptions?: number[];
		showPageSizeSelector?: boolean;
	};

	let {
		page = 1,
		totalPages = 1,
		totalItems = 0,
		pageSize = 0,
		label = 'itens',
		onPrevious = () => {},
		onNext = () => {},
		onSelectPage = () => {},
		onPageSizeChange = () => {},
		pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
		showPageSizeSelector = true
	}: PaginationControlsProps = $props();

	$effect(() => {
		if (page > totalPages && totalPages > 0) {
			onSelectPage?.(totalPages);
		}
	});

	function getPageNumbers() {
		if (totalPages <= 1) return [1];

		const startPage = Math.max(1, page - Math.floor(MAX_BUTTONS / 2));
		const endPage = Math.min(totalPages, startPage + MAX_BUTTONS - 1);

		return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
	}

	const hasPageSizeSelector = showPageSizeSelector && pageSizeOptions.length > 0;
	const shouldRender = hasPageSizeSelector || totalItems > 0 || totalPages > 1;
</script>

{#if shouldRender}
	<div class="flex flex-col gap-3 mt-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div class="text-sm text-muted-foreground">
				Mostrando
				{#if totalItems === 0}
					0
				{:else}
					{(page - 1) * pageSize + 1}
					a
					{Math.min(page * pageSize, totalItems)}
				{/if}
				de {totalItems} {label}
			</div>

			{#if hasPageSizeSelector}
				<div class="flex items-center gap-2">
					<Label class="text-sm">Itens por página</Label>
					<Select
						type="single"
						value={pageSize.toString()}
						onValueChange={(value: string) => {
							const parsed = parseInt(value, 10);
							if (!Number.isNaN(parsed)) {
								onPageSizeChange?.(parsed);
							}
						}}
					>
						<SelectTrigger class="w-[110px]">
							{pageSize}
						</SelectTrigger>
						<SelectContent>
							{#each pageSizeOptions as option (option)}
								<SelectItem value={option.toString()}>
									{option}
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-between pt-4 border-t">
			<Button
				variant="outline"
				size="sm"
				onclick={onPrevious}
				disabled={page <= 1}
				class="flex items-center space-x-1"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				<span>Anterior</span>
			</Button>

			<div class="flex items-center space-x-1">
				{#each getPageNumbers() as pageNumber}
					<Button
						variant={pageNumber === page ? 'default' : 'outline'}
						size="sm"
						onclick={() => onSelectPage?.(pageNumber)}
						class="w-8 h-8 p-0"
						disabled={totalPages === 1 && pageNumber === 1}
					>
						{pageNumber}
					</Button>
				{/each}
			</div>

			<Button
				variant="outline"
				size="sm"
				onclick={onNext}
				disabled={page >= totalPages}
				class="flex items-center space-x-1"
			>
				<span>Próxima</span>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</Button>
		</div>
	</div>
{/if}

