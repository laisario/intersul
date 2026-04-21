<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { Step } from '$lib/api/types/service.types.js';
	import { daysUntilExpiration, getExpirationBadgeClasses } from '$lib/utils/formatting';
	import { getServicePriorityLabel, getServicePriorityVariant } from '$lib/utils/constants.js';

	let {
		steps = [],
		isLoading = false,
		highlightedStepId = null,
		onRowClick = () => {},
	} = $props<{
		steps: Step[];
		isLoading?: boolean;
		highlightedStepId?: number | null;
		onRowClick?: (step: Step) => void;
	}>();

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'pending';
			case 'IN_PROGRESS':
				return 'in-progress';
			case 'CONCLUDED':
			case 'COMPLETED':
				return 'concluded';
			case 'CANCELLED':
				return 'destructive';
			case 'ON_HOLD':
				return 'on-hold';
			default:
				return 'outline';
		}
	}

	function getStatusLabel(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'Pendente';
			case 'IN_PROGRESS':
				return 'Em Andamento';
			case 'CONCLUDED':
				return 'Concluído';
			case 'CANCELLED':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}

	function getDays(stepDatetimeExpiration: string): number {
		return daysUntilExpiration(stepDatetimeExpiration);
	}

</script>

<div class="space-y-4">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Cliente</TableHead>
				<TableHead>Etapa</TableHead>
				<TableHead>Serviço</TableHead>
				<TableHead>Prioridade</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Vencimento</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if isLoading}
				{#each Array(5) as _}
					<TableRow>
						<TableCell><Skeleton class="h-4 w-32" /></TableCell>
						<TableCell><Skeleton class="h-4 w-24" /></TableCell>
						<TableCell><Skeleton class="h-4 w-32" /></TableCell>
						<TableCell><Skeleton class="h-4 w-20" /></TableCell>
						<TableCell><Skeleton class="h-4 w-20" /></TableCell>
						<TableCell><Skeleton class="h-4 w-20" /></TableCell>
					</TableRow>
				{/each}
			{:else if steps.length === 0}
				<TableRow>
					<TableCell colspan={6} class="text-center py-8 text-muted-foreground">
						Nenhuma etapa encontrada
					</TableCell>
				</TableRow>
			{:else}
				{#each steps as step}
					<TableRow
						id="step-card-{step.id}"
						class="cursor-pointer hover:bg-muted/50 transition-colors {highlightedStepId === step.id ? 'bg-primary/10' : ''}"
						onclick={() => onRowClick(step)}
					>
						<TableCell>
							{#if step.service?.client}
								<span class="text-sm">{step.service.client.name}</span>
							{:else}
								<span class="text-muted-foreground text-sm">-</span>
							{/if}
						</TableCell>
						<TableCell>
							<div class="flex flex-col">
								<span class="font-medium">{step.name}</span>
								{#if step.description}
									<span class="text-xs text-muted-foreground line-clamp-1">{step.description}</span>
								{/if}
							</div>
						</TableCell>
						<TableCell>
							{#if step.service}
								<span class="text-sm">Serviço #{step.service.id}</span>
							{:else}
								<span class="text-muted-foreground text-sm">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if step.service?.priority}
								<Badge variant={getServicePriorityVariant(step.service.priority)}>
									{getServicePriorityLabel(step.service.priority)}
								</Badge>
							{:else}
								<span class="text-muted-foreground text-sm">-</span>
							{/if}
						</TableCell>
						<TableCell>
							<Badge variant={getStatusBadgeVariant(step.status)}>
								{getStatusLabel(step.status)}
							</Badge>
						</TableCell>
						<TableCell>
							{#if step.datetimeExpiration}
								{@const days = getDays(step.datetimeExpiration)}
								<span 
									class={`text-sm px-2 py-1 rounded-md inline-flex items-center justify-center font-medium ${getExpirationBadgeClasses(days)}`}
								>
									{days} dia{days > 1 ? 's' : ''}
								</span>
							{:else}
								<span class="text-muted-foreground text-sm">-</span>
							{/if}
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>

