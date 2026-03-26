<script lang="ts">
	import { Popover } from 'bits-ui';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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
				class="bg-popover text-popover-foreground z-50 w-[min(100vw-2rem,22rem)] max-w-[22rem] rounded-md border p-3 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				side="bottom"
				align="start"
				sideOffset={6}
				onclick={(e) => e.stopPropagation()}
			>
				<p class="mb-2 text-sm font-semibold">Etapas do serviço</p>
				<p class="mb-3 text-xs text-muted-foreground">Clique no status para abrir ou fechar.</p>
				<div class="max-h-64 overflow-y-auto pr-1">
					{#if !service.steps?.length}
						<p class="text-sm text-muted-foreground">Este serviço ainda não possui etapas.</p>
					{:else}
						{#each service.steps as step, i (step.id)}
							{#if i > 0}
								<Separator class="my-3" />
							{/if}
							<div class="text-sm">
								<div class="font-medium leading-tight">{step.name}</div>
								<div class="mt-1.5">
									<Badge variant={getStepStatusVariant(step.status)} class="text-xs font-medium">
										{getStepStatusLabel(step.status)}
									</Badge>
								</div>
								<div class="mt-0.5 text-xs">
									{step.responsable?.name?.trim() ? step.responsable.name : 'Não atribuído'}
								</div>
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
