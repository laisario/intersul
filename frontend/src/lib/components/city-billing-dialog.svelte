<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import type { City } from '$lib/api/types/address.types.js';

	interface Props {
		open: boolean;
		onConfirm: (cityId: number) => void;
		onCancel: () => void;
	}

	let { open = $bindable(false), onConfirm, onCancel }: Props = $props();

	const clientsQuery = useClients();
	const clients = $derived(clientsQuery.data ?? []);

	let selectedCityId = $state<number | null>(null);

	// Extract unique cities from clients
	const cityOptions = $derived(
		(() => {
			const map = new Map<number, { city: City; label: string }>();

			clients.forEach((client) => {
				const city = client.address?.neighborhood?.city;
				if (city) {
					const stateCode = city.state?.code ? ` - ${city.state.code}` : '';
					const label = `${city.name}${stateCode}`;
					if (!map.has(city.id)) {
						map.set(city.id, { city, label });
					}
				}
			});

			return Array.from(map.values())
				.sort((a, b) => a.label.localeCompare(b.label))
				.map(({ city, label }) => ({ id: city.id, label }));
		})()
	);

	function handleConfirm() {
		if (selectedCityId) {
			onConfirm(selectedCityId);
			selectedCityId = null;
		}
	}

	function handleCancel() {
		selectedCityId = null;
		onCancel();
	}

	$effect(() => {
		if (!open) {
			selectedCityId = null;
		}
	});
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Selecionar Cidade</DialogTitle>
			<DialogDescription>
				Selecione a cidade para gerar os fechamentos. Todos os clientes ativos desta cidade com máquinas RENT serão incluídos.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="city">Cidade *</Label>
				<Select
					type="single"
					value={selectedCityId?.toString()}
					onValueChange={(value: string) => {
						selectedCityId = value ? parseInt(value) : null;
					}}
				>
					<SelectTrigger id="city">
						{#if !selectedCityId}
							<span class="text-muted-foreground">Selecione uma cidade</span>
						{:else}
							{cityOptions.find((option) => option.id === selectedCityId)?.label || 'Cidade'}
						{/if}
					</SelectTrigger>
					<SelectContent>
						{#if clientsQuery.isLoading}
							<SelectItem value="" disabled>Carregando...</SelectItem>
						{:else if !cityOptions.length}
							<SelectItem value="" disabled>Nenhuma cidade disponível</SelectItem>
						{:else}
							{#each cityOptions as option (option.id)}
								<SelectItem value={option.id.toString()}>{option.label}</SelectItem>
							{/each}
						{/if}
					</SelectContent>
				</Select>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleCancel}>
				Cancelar
			</Button>
			<Button onclick={handleConfirm} disabled={!selectedCityId || clientsQuery.isLoading}>
				Gerar Fechamentos
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>


