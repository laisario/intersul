<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="sheet-header"
	class={cn("flex flex-col gap-1.5 p-4 max-md:sticky max-md:top-0 max-md:z-10 max-md:bg-background max-md:shrink-0", className)}
	{...restProps}
>
	{@render children?.()}
</div>
