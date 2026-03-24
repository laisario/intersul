<!--
  Searchable async client select with backend pagination and scroll-to-load-more.
  Loads first page on open, fetches more on scroll, debounced search.
-->

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { onMount, onDestroy } from 'svelte';
	import { clientsApi } from '$lib/api/endpoints/clients.js';
	import { useClient } from '$lib/hooks/queries/use-clients.svelte.js';
	import { ChevronDownIcon, Loader2 } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { cn } from '$lib/utils.js';
	import type { Client } from '$lib/api/types/client.types.js';

	const DEBOUNCE_MS = 300;
	const PAGE_SIZE = 20;
	const SCROLL_THRESHOLD = 50;

	let {
		value = $bindable(0),
		onValueChange,
		placeholder = 'Selecione um cliente',
		disabled = false,
		class: className,
		label = 'Cliente *'
	}: {
		value?: number;
		onValueChange?: (clientId: number, client?: Client) => void;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		label?: string;
	} = $props();

	let isOpen = $state(false);
	let searchTerm = $state('');
	let options = $state<Client[]>([]);
	let page = $state(1);
	let hasNextPage = $state(false);
	let loading = $state(false);
	let loadingMore = $state(false);
	let requestId = 0;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let listRef: HTMLDivElement | null = null;

	const selectedClientQuery = useClient(value);
	const selectedClientName = $derived(value ? (selectedClientQuery.data?.name ?? '') : '');

	function clearDebounce() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function fetchClients(search: string, pageNum: number, append: boolean) {
		const rid = ++requestId;
		clientsApi.getPaginated({ search: search || undefined, page: pageNum, limit: PAGE_SIZE }).then(
			(res) => {
				if (rid !== requestId) return;
				if (append) {
					const ids = new Set(options.map((o) => o.id));
					options = [...options, ...res.data.filter((c) => !ids.has(c.id))];
				} else {
					options = res.data;
				}
				hasNextPage = res.hasNextPage;
			},
			() => {
				if (rid !== requestId) return;
				if (!append) options = [];
			}
		).finally(() => {
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
			fetchClients('', 1, false);
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
			fetchClients(searchTerm.trim(), 1, false);
		}, DEBOUNCE_MS);
	}

	function onScroll() {
		if (!listRef || loadingMore || !hasNextPage || loading) return;
		const { scrollTop, scrollHeight, clientHeight } = listRef;
		if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
			loadingMore = true;
			page += 1;
			fetchClients(searchTerm.trim(), page, true);
		}
	}

	function selectClient(client: Client) {
		value = client.id;
		onValueChange?.(client.id, client);
		isOpen = false;
	}

	onDestroy(clearDebounce);
</script>

<div class={cn('space-y-2', className)}>
	{#if label}
		<Label for="client-async-select">{label}</Label>
	{/if}
	<Popover.Root open={isOpen} onOpenChange={onOpenChange}>
		<Popover.Trigger
			disabled={disabled}
			class={cn(
				'border-input [&_svg:not([class*="text-"])]:text-muted-foreground shadow-xs flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
				'text-left'
			)}
		>
			<span class={cn('truncate', !value && !selectedClientName && 'text-muted-foreground')}>
				{value ? selectedClientName || (selectedClientQuery.isLoading ? 'Carregando...' : placeholder) : placeholder}
			</span>
			<ChevronDownIcon class="size-4 shrink-0 opacity-50" />
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				class="bg-popover text-popover-foreground z-50 min-w-[var(--bits-popover-trigger-width)] max-w-[var(--bits-popover-trigger-width)] rounded-md border p-0 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				sideOffset={4}
			>
				<div class="p-1">
					<Input
						type="text"
						placeholder="Buscar cliente..."
						value={searchTerm}
						oninput={onSearchInput}
						class="h-8 mb-1"
					/>
				</div>
				<div
					bind:this={listRef}
					role="listbox"
					class="max-h-[200px] overflow-y-auto"
					onscroll={onScroll}
					tabindex="-1"
				>
					{#if loading}
						<div class="flex items-center justify-center py-8">
							<Loader2 class="size-6 animate-spin text-muted-foreground" />
						</div>
					{:else if options.length === 0}
						<div class="py-6 text-center text-sm text-muted-foreground">
							{searchTerm ? 'Nenhum cliente encontrado' : 'Digite para buscar'}
						</div>
					{:else}
						{#each options as client (client.id)}
							<button
								type="button"
								role="option"
								aria-selected={value === client.id}
								class={cn(
									'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm',
									value === client.id && 'bg-accent'
								)}
								onclick={() => selectClient(client)}
							>
								{client.name}
							</button>
						{/each}
						{#if loadingMore}
							<div class="flex justify-center py-2">
								<Loader2 class="size-4 animate-spin text-muted-foreground" />
							</div>
						{/if}
					{/if}
				</div>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>
