<!--
  Empty state component for when there's no data to display
-->

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Plus, Search, FileX, Users, Wrench, Printer } from 'lucide-svelte';

	let {
		icon = 'default',
		title = 'Nenhum item encontrado',
		description = 'Não há dados para exibir no momento.',
		actionLabel = 'Criar novo',
		onAction = () => {},
		showAction = true,
		variant = 'default'
	} = $props<{
		icon?: 'default' | 'search' | 'file' | 'users' | 'services' | 'machines';
		title?: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
		showAction?: boolean;
		variant?: 'default' | 'card';
	}>();

	// Icon mapping
	let iconComponent = $derived(() => {
		switch (icon) {
			case 'search': return Search;
			case 'file': return FileX;
			case 'users': return Users;
			case 'services': return Wrench;
			case 'machines': return Printer;
			default: return FileX;
		}
	});

	let IconComponent = $derived(iconComponent);
</script>

{#if variant === 'card'}
	<Card>
		<CardContent class="flex flex-col items-center justify-center py-12 text-center">
			<IconComponent class="h-12 w-12 text-muted-foreground mb-4" />
			<h3 class="text-lg font-semibold mb-2">{title}</h3>
			<p class="text-muted-foreground mb-6 max-w-sm">{description}</p>
			{#if showAction}
				<Button on:click={onAction}>
					<Plus class="w-4 h-4 mr-2" />
					{actionLabel}
				</Button>
			{/if}
		</CardContent>
	</Card>
{:else}
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<IconComponent class="h-12 w-12 text-muted-foreground mb-4" />
		<h3 class="text-lg font-semibold mb-2">{title}</h3>
		<p class="text-muted-foreground mb-6 max-w-sm">{description}</p>
		{#if showAction}
			<Button on:click={onAction}>
				<Plus class="w-4 h-4 mr-2" />
				{actionLabel}
			</Button>
		{/if}
	</div>
{/if}
