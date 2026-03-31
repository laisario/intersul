<!--
  Searchable async catalog machine select (model/manufacturer) with backend pagination.
  UX mirrors ClientAsyncSelect: Desktop Popover, Mobile Drawer.
-->

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import { copyMachinesApi } from '$lib/api/endpoints/copy-machines.js';
	import { useCopyMachine } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { ChevronDownIcon, Loader2 } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { cn } from '$lib/utils.js';
	import type { CopyMachineCatalog } from '$lib/api/types/copy-machine.types.js';

	const isMobile = new IsMobile();
	const DEBOUNCE_MS = 250;
	const PAGE_SIZE = 20;
	const SCROLL_THRESHOLD = 50;

	let {
		value = $bindable<number | undefined>(),
		onValueChange,
		placeholder = 'Selecione uma máquina',
		disabled = false,
		class: className,
		label = 'Máquina do Catálogo *',
	}: {
		value?: number | undefined;
		onValueChange?: (id: number, machine?: CopyMachineCatalog) => void;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		label?: string;
	} = $props();

	let isOpen = $state(false);
	let searchTerm = $state('');
	let options = $state<CopyMachineCatalog[]>([]);
	let page = $state(1);
	let hasNextPage = $state(false);
	let loading = $state(false);
	let loadingMore = $state(false);
	let requestId = 0;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let listRef = $state<HTMLDivElement | null>(null);
	let selectedCache = $state<{ id: number; label: string } | null>(null);

	const selectedId = $derived(value ?? 0);
	const selectedQuery = useCopyMachine(value ?? 0);
	const selectedLabel = $derived.by(() => {
		if (!selectedId) return '';
		if (selectedCache?.id === selectedId) return selectedCache.label;
		const m = selectedQuery.data;
		return m ? `${m.manufacturer} - ${m.model}` : '';
	});

	const triggerClass = cn(
		'border-input [&_svg:not([class*="text-"])]:text-muted-foreground shadow-xs flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
		'text-left',
		className,
	);

	const triggerContent = $derived.by(() => {
		const display = selectedId
			? selectedLabel || (selectedQuery.isLoading ? 'Carregando...' : placeholder)
			: placeholder;
		return { display, isPlaceholder: !selectedId && !selectedLabel };
	});

	function clearDebounce() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function fetchMachines(search: string, pageNum: number, append: boolean) {
		const rid = ++requestId;
		copyMachinesApi.catalog
			.getAll(search || undefined, pageNum, PAGE_SIZE)
			.then(
				(res) => {
					if (rid !== requestId) return;
					if (append) {
						const ids = new Set(options.map((o) => o.id));
						options = [...options, ...res.data.filter((m) => !ids.has(m.id))];
					} else {
						options = res.data;
					}
					hasNextPage = pageNum < (res.totalPages ?? 1);
				},
				() => {
					if (rid !== requestId) return;
					if (!append) options = [];
				},
			)
			.finally(() => {
				if (rid !== requestId) return;
				loading = false;
				loadingMore = false;
			});
	}

	function onOpenChange(open: boolean) {
		isOpen = open;
		if (open) {
			searchTerm = '';
			page = 1;
			options = [];
			hasNextPage = false;
			loading = true;
			fetchMachines('', 1, false);
		}
	}

	function onSearchInput(e: Event) {
		const input = e.target as HTMLInputElement;
		searchTerm = input.value;
		clearDebounce();
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			page = 1;
			options = [];
			hasNextPage = false;
			loading = true;
			fetchMachines(searchTerm.trim(), 1, false);
		}, DEBOUNCE_MS);
	}

	function onScroll() {
		if (!listRef || loadingMore || !hasNextPage || loading) return;
		const { scrollTop, scrollHeight, clientHeight } = listRef;
		if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
			loadingMore = true;
			page += 1;
			fetchMachines(searchTerm.trim(), page, true);
		}
	}

	function selectMachine(machine: CopyMachineCatalog) {
		value = machine.id;
		selectedCache = { id: machine.id, label: `${machine.manufacturer} - ${machine.model}` };
		onValueChange?.(machine.id, machine);
		isOpen = false;
	}

	$effect(() => {
		if (!selectedId) selectedCache = null;
	});

	onDestroy(clearDebounce);
</script>

<div class={cn('space-y-2', className)}>
	{#if label}
		<Label for="catalog-machine-async-select">{label}</Label>
	{/if}

	{#if isMobile.current}
		<Drawer.Root direction="bottom" bind:open={isOpen} onOpenChange={(open) => open && onOpenChange(true)}>
			<Drawer.Trigger disabled={disabled} class={triggerClass}>
				<span class={cn('truncate', triggerContent.isPlaceholder && 'text-muted-foreground')}>
					{triggerContent.display}
				</span>
				<ChevronDownIcon class="size-4 shrink-0 opacity-50" />
			</Drawer.Trigger>
			<Drawer.Content class="max-h-[70vh] flex flex-col">
				<Drawer.Header class="border-b pb-3">
					<Drawer.Title class="text-base">Selecionar máquina do catálogo</Drawer.Title>
					<div class="mt-2">
						<Input
							type="text"
							placeholder="Buscar por modelo ou fabricante..."
							value={searchTerm}
							oninput={onSearchInput}
							class="h-10"
							style="touch-action: manipulation;"
						/>
					</div>
				</Drawer.Header>
				<div
					bind:this={listRef}
					role="listbox"
					class="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-4 px-4"
					onscroll={onScroll}
					style="touch-action: manipulation; -webkit-overflow-scrolling: touch;"
				>
					{#if loading}
						<div class="flex items-center justify-center py-10">
							<Loader2 class="size-6 animate-spin text-muted-foreground" />
						</div>
					{:else if options.length === 0}
						<div class="py-8 text-center text-sm text-muted-foreground">
							{searchTerm ? 'Nenhuma máquina encontrada' : 'Digite para buscar'}
						</div>
					{:else}
						<div class="flex flex-col py-1">
							{#each options as m (m.id)}
								<button
									type="button"
									role="option"
									aria-selected={value === m.id}
									class={cn(
										'w-full min-h-[44px] px-4 py-3 text-left text-sm border-b border-border/50 last:border-0 active:bg-accent',
										'hover:bg-accent hover:text-accent-foreground cursor-pointer',
										value === m.id && 'bg-accent',
									)}
									style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
									onclick={() => selectMachine(m)}
									onkeydown={(e) => e.key === 'Enter' && selectMachine(m)}
								>
									<div class="font-medium">{m.manufacturer} - {m.model}</div>
									{#if m.quantity !== undefined && m.quantity !== null}
										<div class="text-xs text-muted-foreground">Estoque: {m.quantity ?? 0}</div>
									{/if}
								</button>
							{/each}
							{#if loadingMore}
								<div class="flex justify-center py-3">
									<Loader2 class="size-5 animate-spin text-muted-foreground" />
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</Drawer.Content>
		</Drawer.Root>
	{:else}
		<Popover.Root open={isOpen} onOpenChange={onOpenChange}>
			<Popover.Trigger disabled={disabled} class={triggerClass}>
				<span class={cn('truncate', triggerContent.isPlaceholder && 'text-muted-foreground')}>
					{triggerContent.display}
				</span>
				<ChevronDownIcon class="size-4 shrink-0 opacity-50" />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					class="bg-popover text-popover-foreground z-50 w-[var(--bits-popover-anchor-width,16rem)] min-w-0 max-w-[var(--bits-popover-anchor-width,16rem)] overflow-hidden rounded-md border p-0 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
					side="bottom"
					sideOffset={4}
					align="start"
				>
					<div class="p-1">
						<Input
							type="text"
							placeholder="Buscar por modelo ou fabricante..."
							value={searchTerm}
							oninput={onSearchInput}
							class="h-8 mb-1"
						/>
					</div>
					<div bind:this={listRef} role="listbox" class="max-h-[220px] overflow-y-auto" onscroll={onScroll} tabindex="-1">
						{#if loading}
							<div class="flex items-center justify-center py-8">
								<Loader2 class="size-6 animate-spin text-muted-foreground" />
							</div>
						{:else if options.length === 0}
							<div class="py-8 text-center text-sm text-muted-foreground">
								{searchTerm ? 'Nenhuma máquina encontrada' : 'Digite para buscar'}
							</div>
						{:else}
							<div class="flex flex-col py-1">
								{#each options as m (m.id)}
									<button
										type="button"
										role="option"
										aria-selected={value === m.id}
										class={cn(
											'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
											value === m.id && 'bg-accent',
										)}
										onclick={() => selectMachine(m)}
									>
										<div class="font-medium">{m.manufacturer} - {m.model}</div>
										{#if m.quantity !== undefined && m.quantity !== null}
											<div class="text-xs text-muted-foreground">Estoque: {m.quantity ?? 0}</div>
										{/if}
									</button>
								{/each}
								{#if loadingMore}
									<div class="flex justify-center py-3">
										<Loader2 class="size-5 animate-spin text-muted-foreground" />
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	{/if}
</div>

