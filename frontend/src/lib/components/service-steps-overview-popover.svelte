<script lang="ts">
	import { Popover } from 'bits-ui';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		getServiceStatusLabel,
		getServiceStatusVariant,
		getStepStatusLabel,
		getStepStatusVariant,
	} from '$lib/utils/constants.js';
	import type { Service } from '$lib/api/types/service.types.js';

	let {
		service,
		open = false,
		onOpenChange
	}: {
		service: Service;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();
</script>

{#if service.status}
	<Popover.Root open={open} onOpenChange={onOpenChange}>
		<Popover.Trigger
			class="inline-flex cursor-pointer rounded-md border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			type="button"
		>
			<Badge variant={getServiceStatusVariant(service.status)} class="pointer-events-none">
				{getServiceStatusLabel(service.status)}
			</Badge>
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				class="bg-popover text-popover-foreground z-50 w-[min(100vw-2rem,24rem)] max-w-[24rem] rounded-md border p-3 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				side="bottom"
				align="start"
				sideOffset={6}
				onclick={(e) => e.stopPropagation()}
			>
				<p class="mb-2.5 text-sm font-semibold">Etapas do serviço</p>

				<div class="max-h-80 overflow-y-auto pr-1 space-y-3">
					{#if !service.steps?.length}
						<p class="text-sm text-muted-foreground">Este serviço ainda não possui etapas.</p>
					{:else}
						{#each service.steps as step, i (step.id)}
							{#if i > 0}
								<div class="border-t border-border/60"></div>
							{/if}

							<div class="space-y-1.5">
								<!-- Nome + badge de status -->
								<div class="flex items-start justify-between gap-2">
									<p class="text-sm font-medium leading-tight">{step.name}</p>
									<Badge variant={getStepStatusVariant(step.status)} class="shrink-0 text-xs">
										{getStepStatusLabel(step.status)}
									</Badge>
								</div>

								<!-- Responsável -->
								<p class="text-xs text-muted-foreground">
									{step.responsable?.name?.trim() || 'Não atribuído'}
								</p>

								<!-- Checklist -->
								{#if step.checklists?.length}
									{@const done = step.checklists.filter((c) => c.completed).length}
									{@const total = step.checklists.length}
									<div class="pt-1 space-y-1">
										<p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
											Checklist — {done}/{total}
										</p>
										{#each step.checklists as item (item.id)}
											<div class="flex items-start gap-1.5 text-xs">
												<span
													class="mt-px shrink-0 font-bold {item.completed
														? 'text-emerald-500'
														: 'text-muted-foreground/30'}"
													aria-hidden="true"
												>
													{item.completed ? '✓' : '○'}
												</span>
												<span
													class={item.completed
														? 'text-muted-foreground line-through'
														: 'text-foreground'}
												>
													{item.description}
												</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
{:else}
	<span class="text-muted-foreground text-sm">-</span>
{/if}
