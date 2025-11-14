<!--
  Steps table component for user's assigned steps
-->

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { Step } from '$lib/api/types/service.types.js';

	let {
		steps = [],
		isLoading = false,
		onRowClick = () => {},
	} = $props<{
		steps: Step[];
		isLoading?: boolean;
		onRowClick?: (step: Step) => void;
	}>();

	function getStatusBadgeVariant(status?: string) {
		switch (status) {
			case 'PENDING':
				return 'outline';
			case 'IN_PROGRESS':
				return 'secondary';
			case 'CONCLUDED':
				return 'default';
			case 'CANCELLED':
				return 'destructive';
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
</script>

<div class="space-y-4">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Etapa</TableHead>
				<TableHead>Serviço</TableHead>
				<TableHead>Cliente</TableHead>
				<TableHead>Status</TableHead>
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
					</TableRow>
				{/each}
			{:else if steps.length === 0}
				<TableRow>
					<TableCell colspan="4" class="text-center py-8 text-muted-foreground">
						Nenhuma etapa encontrada
					</TableCell>
				</TableRow>
			{:else}
				{#each steps as step}
					<TableRow 
						class="cursor-pointer hover:bg-muted/50"
						onclick={() => onRowClick(step)}
					>
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
							{#if step.service?.client}
								<span class="text-sm">{step.service.client.name}</span>
							{:else}
								<span class="text-muted-foreground text-sm">-</span>
							{/if}
						</TableCell>
						<TableCell>
							<Badge variant={getStatusBadgeVariant(step.status)}>
								{getStatusLabel(step.status)}
							</Badge>
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>

