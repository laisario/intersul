<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent",
				secondary:
					"bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent",
				destructive:
					"bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-destructive-foreground",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				concluded:
					"bg-status-concluded text-status-concluded-foreground [a&]:hover:bg-status-concluded/90 border-transparent",
				pending:
					"bg-status-pending text-status-pending-foreground [a&]:hover:bg-status-pending/90 border-transparent",
				"in-progress":
					"bg-status-in-progress text-status-in-progress-foreground [a&]:hover:bg-status-in-progress/90 border-transparent",
				"on-hold":
					"bg-status-on-hold text-status-on-hold-foreground [a&]:hover:bg-status-on-hold/90 border-transparent",
				"priority-low":
					"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
				"priority-medium":
					"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
				"priority-high":
					"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700",
				"priority-urgent":
					"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});
	
	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
