<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { themeStore } from '$lib/stores/theme.svelte.js';
	import ToastProvider from '$lib/components/toast/toast-provider.svelte';
	import { queryClient } from '$lib/config/query-client.js';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content={$themeStore.resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<ToastProvider>
		<slot />
	</ToastProvider>
</QueryClientProvider>
