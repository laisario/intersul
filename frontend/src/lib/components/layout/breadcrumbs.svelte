<!--
  Breadcrumb navigation component
-->

<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChevronRight, Home } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let {
		items = [],
		showHome = true
	} = $props<{
		items?: Array<{ label: string; href?: string }>;
		showHome?: boolean;
	}>();

	// Generate breadcrumbs from current path
	let pathBreadcrumbs = $derived(() => {
		const path = $page.url.pathname;
		const segments = path.split('/').filter(Boolean);
		
		const breadcrumbs = [];
		
		if (showHome) {
			breadcrumbs.push({ label: 'Dashboard', href: '/' });
		}
		
		let currentPath = '';
		for (const segment of segments) {
			currentPath += `/${segment}`;
			
			// Skip route groups
			if (segment.startsWith('(') && segment.endsWith(')')) {
				continue;
			}
			
			// Skip dynamic segments
			if (segment.startsWith('[') && segment.endsWith(']')) {
				continue;
			}
			
			// Map segments to labels
			let label = segment;
			switch (segment) {
				case 'dashboard':
					label = 'Dashboard';
					break;
				case 'services':
					label = 'Serviços';
					break;
				case 'clients':
					label = 'Clientes';
					break;
				case 'machines':
					label = 'Máquinas';
					break;
				case 'categories':
					label = 'Categorias';
					break;
				case 'users':
					label = 'Usuários';
					break;
				case 'admin':
					label = 'Administração';
					break;
				default:
					// Capitalize first letter
					label = segment.charAt(0).toUpperCase() + segment.slice(1);
			}
			
			breadcrumbs.push({ 
				label, 
				href: currentPath === path ? undefined : currentPath 
			});
		}
		
		return breadcrumbs;
	});

	// Use provided items or generate from path
	let breadcrumbs = $derived(items.length > 0 ? items : pathBreadcrumbs());
</script>

<nav class="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
	{#each breadcrumbs as crumb, index}
		{#if index > 0}
			<ChevronRight class="w-4 h-4" />
		{/if}
		
		{#if crumb.href}
			<Button 
				variant="ghost" 
				size="sm" 
				class="h-auto p-0 font-normal text-muted-foreground hover:text-foreground"
				on:click={() => goto(crumb.href!)}
			>
				{#if index === 0 && showHome}
					<Home class="w-4 h-4 mr-1" />
				{/if}
				{crumb.label}
			</Button>
		{:else}
			<span class="font-medium text-foreground">
				{#if index === 0 && showHome}
					<Home class="w-4 h-4 mr-1" />
				{/if}
				{crumb.label}
			</span>
		{/if}
	{/each}
</nav>
