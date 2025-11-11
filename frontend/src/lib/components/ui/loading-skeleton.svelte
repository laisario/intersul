<!--
  Loading skeleton component for various content types
-->

<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let {
		type = 'table',
		rows = 5,
		showHeader = true
	} = $props<{
		type?: 'table' | 'card' | 'list' | 'form';
		rows?: number;
		showHeader?: boolean;
	}>();
</script>

{#if type === 'table'}
	<div class="space-y-3">
		{#if showHeader}
			<div class="flex space-x-4">
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-4 w-[100px]" />
			</div>
		{/if}
		{#each Array(rows) as _}
			<div class="flex space-x-4">
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-4 w-[150px]" />
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-4 w-[100px]" />
			</div>
		{/each}
	</div>
{:else if type === 'card'}
	<div class="space-y-4">
		{#each Array(rows) as _}
			<div class="p-4 border rounded-lg">
				<div class="flex items-center space-x-4">
					<Skeleton class="h-10 w-10 rounded-full" />
					<div class="space-y-2 flex-1">
						<Skeleton class="h-4 w-[200px]" />
						<Skeleton class="h-3 w-[150px]" />
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if type === 'list'}
	<div class="space-y-2">
		{#each Array(rows) as _}
			<div class="flex items-center space-x-3">
				<Skeleton class="h-8 w-8 rounded" />
				<div class="space-y-1 flex-1">
					<Skeleton class="h-4 w-[200px]" />
					<Skeleton class="h-3 w-[150px]" />
				</div>
				<Skeleton class="h-6 w-16" />
			</div>
		{/each}
	</div>
{:else if type === 'form'}
	<div class="space-y-4">
		{#each Array(rows) as _}
			<div class="space-y-2">
				<Skeleton class="h-4 w-[100px]" />
				<Skeleton class="h-10 w-full" />
			</div>
		{/each}
	</div>
{/if}