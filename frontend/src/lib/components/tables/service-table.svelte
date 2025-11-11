<!--
  Reusable service table component
-->

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { formatDate, formatServiceStatus } from '$lib/utils/formatting.js';
	import { SERVICE_STATUS } from '$lib/utils/constants.js';
	import { Eye, Edit, Trash2 } from 'lucide-svelte';
	import type { Service } from '$lib/api/types/service.types.js';

	let {
		services = [],
		isLoading = false,
		onRowClick = () => {},
		onEdit = () => {},
		onDelete = () => {},
		showFilters = true,
		searchTerm = $bindable(''),
		statusFilter = $bindable('all'),
		categoryFilter = $bindable('all'),
		onFilterChange = () => {}
	} = $props<{
		services: Service[];
		isLoading?: boolean;
		onRowClick?: (service: Service) => void;
		onEdit?: (service: Service) => void;
		onDelete?: (service: Service) => void;
		showFilters?: boolean;
		searchTerm?: string;
		statusFilter?: string;
		categoryFilter?: string;
		onFilterChange?: () => void;
	}>();

	function handleRowClick(service: Service) {
		onRowClick(service);
	}

	function handleEdit(event: Event, service: Service) {
		event.stopPropagation();
		onEdit(service);
	}

	function handleDelete(event: Event, service: Service) {
		event.stopPropagation();
		onDelete(service);
	}
</script>

<div class="space-y-4">
	{#if showFilters}
		<!-- Filters -->
		<div class="flex flex-col sm:flex-row gap-4">
			<Input
				type="text"
				placeholder="Buscar serviços..."
				bind:value={searchTerm}
				class="flex-1"
			/>
			<Select bind:value={statusFilter} on:selectedChange={onFilterChange}>
				<SelectTrigger class="w-full sm:w-[180px]">
					<span class="text-muted-foreground">Todos os status</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos os status</SelectItem>
					{#each SERVICE_STATUS as status}
						<SelectItem value={status.value}>{status.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			<Select bind:value={categoryFilter} on:selectedChange={onFilterChange}>
				<SelectTrigger class="w-full sm:w-[180px]">
					<span class="text-muted-foreground">Todas as categorias</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas as categorias</SelectItem>
					<!-- Categories will be populated from props -->
				</SelectContent>
			</Select>
		</div>
	{/if}

	<!-- Desktop Table -->
	<div class="hidden md:block">
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Cliente</TableHead>
						<TableHead>Categoria</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Responsáveis</TableHead>
						<TableHead>Última Atualização</TableHead>
						<TableHead class="w-[100px]">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						{#each Array(5) as _}
							<TableRow>
								<TableCell><Skeleton class="h-4 w-12" /></TableCell>
								<TableCell><Skeleton class="h-4 w-32" /></TableCell>
								<TableCell><Skeleton class="h-4 w-24" /></TableCell>
								<TableCell><Skeleton class="h-4 w-16" /></TableCell>
								<TableCell><Skeleton class="h-4 w-20" /></TableCell>
								<TableCell><Skeleton class="h-4 w-24" /></TableCell>
								<TableCell><Skeleton class="h-4 w-16" /></TableCell>
							</TableRow>
						{/each}
					{:else if services.length === 0}
						<TableRow>
							<TableCell colspan="7" class="text-center py-8 text-muted-foreground">
								Nenhum serviço encontrado
							</TableCell>
						</TableRow>
					{:else}
						{#each services as service}
							<TableRow 
								class="cursor-pointer hover:bg-muted/50"
								on:click={() => handleRowClick(service)}
							>
								<TableCell class="font-medium">#{service.id}</TableCell>
								<TableCell>{service.client.name}</TableCell>
								<TableCell>
									<div class="flex items-center space-x-2">
										<div class="w-3 h-3 rounded-full" style="background-color: {service.category.color || '#3b82f6'}"></div>
										<span>{service.category.name}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={service.status === 'completed' ? 'default' : service.status === 'in_progress' ? 'secondary' : 'outline'}>
										{formatServiceStatus(service.status)}
									</Badge>
								</TableCell>
								<TableCell>
									{#if service.assignedTo}
										<span class="text-sm">{service.assignedTo.name}</span>
									{:else}
										<span class="text-muted-foreground text-sm">Não atribuído</span>
									{/if}
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{formatDate(service.updatedAt)}
								</TableCell>
								<TableCell>
									<div class="flex items-center space-x-1">
										<Button
											variant="ghost"
											size="sm"
											on:click={(e) => handleEdit(e, service)}
										>
											<Eye class="w-4 h-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											on:click={(e) => handleEdit(e, service)}
										>
											<Edit class="w-4 h-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											on:click={(e) => handleDelete(e, service)}
											class="text-red-600 hover:text-red-700"
										>
											<Trash2 class="w-4 h-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>
	</div>

	<!-- Mobile Cards -->
	<div class="md:hidden space-y-4">
		{#if isLoading}
			{#each Array(3) as _}
				<Card>
					<CardContent class="p-4">
						<Skeleton class="h-6 w-3/4 mb-2" />
						<Skeleton class="h-4 w-1/2 mb-2" />
						<Skeleton class="h-4 w-full" />
					</CardContent>
				</Card>
			{/each}
		{:else if services.length === 0}
			<Card>
				<CardContent class="p-8 text-center text-muted-foreground">
					Nenhum serviço encontrado
				</CardContent>
			</Card>
		{:else}
			{#each services as service}
				<Card 
					class="cursor-pointer hover:shadow-md transition-shadow"
					on:click={() => handleRowClick(service)}
				>
					<CardContent class="p-4">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h3 class="font-semibold">#{service.id} - {service.title}</h3>
								<p class="text-sm text-muted-foreground">{service.client.name}</p>
							</div>
							<Badge variant={service.status === 'completed' ? 'default' : service.status === 'in_progress' ? 'secondary' : 'outline'}>
								{formatServiceStatus(service.status)}
							</Badge>
						</div>
						
						<div class="space-y-2 text-sm">
							<div class="flex items-center space-x-2">
								<div class="w-3 h-3 rounded-full" style="background-color: {service.category.color || '#3b82f6'}"></div>
								<span class="text-muted-foreground">{service.category.name}</span>
							</div>
							
							{#if service.assignedTo}
								<div class="text-muted-foreground">
									Responsável: {service.assignedTo.name}
								</div>
							{/if}
							
							<div class="text-muted-foreground">
								Atualizado: {formatDate(service.updatedAt)}
							</div>
						</div>
						
						<div class="flex items-center justify-end space-x-2 mt-3">
							<Button
								variant="ghost"
								size="sm"
								on:click={(e) => handleEdit(e, service)}
							>
								<Eye class="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								on:click={(e) => handleEdit(e, service)}
							>
								<Edit class="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								on:click={(e) => handleDelete(e, service)}
								class="text-red-600 hover:text-red-700"
							>
								<Trash2 class="w-4 h-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>
</div>
