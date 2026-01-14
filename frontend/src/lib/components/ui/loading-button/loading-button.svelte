<script lang="ts">
	import { Button, type ButtonProps } from "$lib/components/ui/button/index.js";
	import { Loader2 } from "lucide-svelte";
	import type { Snippet } from "svelte";

	interface Props extends Omit<ButtonProps, 'disabled'> {
		loading?: boolean;
		loadingText?: string;
		children?: Snippet;
	}

	let {
		loading = false,
		loadingText,
		children,
		disabled,
		...buttonProps
	}: Props = $props();

	const isDisabled = $derived(loading || disabled);
</script>

<Button {...buttonProps} disabled={isDisabled}>
	{#if loading}
		<Loader2 class="w-4 h-4 animate-spin" />
		{#if loadingText}
			{loadingText}
		{:else}
			{@render children?.()}
		{/if}
	{:else}
		{@render children?.()}
	{/if}
</Button>
