<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Search, Loader2 } from 'lucide-svelte';
	import type { CreateAddressDto } from '$lib/api/types/address.types.js';
	import { addressApi } from '$lib/api/endpoints/address';
	import { ViaCepService } from '$lib/services/viacep.service';
	import { showError, showSuccess } from '$lib/utils/toast';
	import { normalizePostalCode, formatPostalCode } from '$lib/utils/postal-code.js';

	interface Props {
		address: Partial<CreateAddressDto>;
		onChange: (address: Partial<CreateAddressDto>) => void;
		disabled?: boolean;
		required?: boolean;
	}

	let { address = $bindable({
		postalCode: '',
		street: '',
		number: '',
		complement: '',
		neighborhoodId: undefined
	}), onChange, disabled = false, required = false }: Props = $props();

	let isLoadingCep = $state(false);
	let hasTriedCepLookup = $state(false);
	let cepLookupResult = $state<'success' | 'error' | null>(null);
	let locationDisplay = $state({
		neighborhood: '',
		city: '',
		state: '',
		country: 'Brasil'
	});
	
	// Store raw ViaCEP data for backend processing
	let viaCepRawData = $state<{ state_code: string; city_name: string; neighborhood_name: string } | null>(null);

	async function handleSearchCep() {
		if (!address.postalCode) {
			showError('Digite um CEP para buscar');
			return;
		}

		const normalizedCep = normalizePostalCode(address.postalCode);
		if (normalizedCep.length !== 8) {
			showError('CEP deve ter 8 dígitos');
			return;
		}

		isLoadingCep = true;
		hasTriedCepLookup = false;
		cepLookupResult = null;
		
		try {
			// Call ViaCEP directly from frontend (using normalized digits-only CEP)
			const viaCepData = await ViaCepService.getAddressByCep(normalizedCep);
			
			hasTriedCepLookup = true;
			
			// Check for ViaCEP error response (erro: true even with 200 OK)
			if (!viaCepData || viaCepData.erro) {
				cepLookupResult = 'error';
				showError('CEP não encontrado. Preencha o endereço manualmente.');
				return;
			}

			// Format and show data to user
			const formatted = ViaCepService.formatAddress(viaCepData);
			
			// Update display fields for user verification
			locationDisplay = {
				neighborhood: formatted.neighborhood,
				city: formatted.city,
				state: formatted.state,
				country: 'Brasil'
			};

			// Store raw data to send to backend later
			viaCepRawData = {
				state_code: viaCepData.uf,
				city_name: viaCepData.localidade,
				neighborhood_name: viaCepData.bairro
			};

			// Update address with street and formatted postal code
			const updated = {
				...address,
				postalCode: formatPostalCode(formatted.postal_code),
				street: formatted.street || address.street,
			};
			
			onChange(updated);
			cepLookupResult = 'success';
			
			// Process location data immediately after successful ViaCEP lookup
			// This sets neighborhoodId so validation doesn't show false negative
			try {
				const result = await addressApi.processLocation(viaCepRawData);
				const updatedWithNeighborhood = {
					...updated,
					neighborhoodId: result.neighborhoodId
				};
				onChange(updatedWithNeighborhood);
			} catch (locationErr: any) {
				console.error('Error processing location after CEP lookup:', locationErr);
				// Don't show error here - user can still fill manually and it will retry on submit
			}
			
			showSuccess('Endereço encontrado! Verifique os dados e complete o número.');
		} catch (err: any) {
			console.error('Error fetching CEP:', err);
			hasTriedCepLookup = true;
			cepLookupResult = 'error';
			showError('Erro ao buscar CEP. Preencha o endereço manualmente.');
		} finally {
			isLoadingCep = false;
		}
	}

	// Function to process location with backend (call this before submitting the form)
	export async function processLocationData(): Promise<boolean> {
		if (!viaCepRawData) {
			// If we already have neighborhoodId, no need to process
			if (address.neighborhoodId) {
				return true;
			}
			return true; // No location data to process
		}

		try {
			const result = await addressApi.processLocation(viaCepRawData);
			
			// Update address with neighborhoodId (camelCase)
			const updated = {
				...address,
				neighborhoodId: result.neighborhoodId
			};
			
			onChange(updated);
			return true;
		} catch (err: any) {
			console.error('Error processing location:', err);
			showError('Erro ao processar localização');
			return false;
		}
	}

	function updateField(field: keyof CreateAddressDto, value: string | number | undefined) {
		const updated = { ...address, [field]: value };
		onChange(updated);
	}

	function handleCepInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const formatted = formatPostalCode(input.value);
		updateField('postalCode', formatted);
	}
</script>

<div class="space-y-4">
	<!-- CEP with Search Button -->
	<div class="space-y-2">
		<Label for="postalCode">CEP {required ? '*' : ''}</Label>
		<div class="flex gap-2">
			<Input
				id="postalCode"
				bind:value={address.postalCode}
				oninput={handleCepInput}
				placeholder="00000-000"
				maxlength={9}
				disabled={disabled || isLoadingCep}
				required={required}
				class="flex-1"
			/>
			<Button
				type="button"
				variant="outline"
				onclick={handleSearchCep}
				disabled={disabled || isLoadingCep || !address.postalCode}
			>
				{#if isLoadingCep}
					<Loader2 class="w-4 h-4 animate-spin" />
				{:else}
					<Search class="w-4 h-4" />
				{/if}
			</Button>
		</div>
	</div>

	<!-- Location Display (read-only, filled by CEP search) - Only show after CEP lookup -->
	{#if hasTriedCepLookup && (locationDisplay.neighborhood || locationDisplay.city || locationDisplay.state)}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<!-- Country -->
			<div class="space-y-2">
				<Label for="country_display">País</Label>
				<Input
					id="country_display"
					value={locationDisplay.country}
					placeholder="Brasil"
					disabled
					class="bg-gray-50"
				/>
			</div>

			<!-- State -->
			<div class="space-y-2">
				<Label for="state_display">Estado</Label>
				<Input
					id="state_display"
					value={locationDisplay.state}
					placeholder="SP - São Paulo"
					disabled
					class="bg-gray-50"
				/>
			</div>

			<!-- City -->
			<div class="space-y-2">
				<Label for="city_display">Cidade</Label>
				<Input
					id="city_display"
					value={locationDisplay.city}
					placeholder="São Paulo"
					disabled
					class="bg-gray-50"
				/>
			</div>

			<!-- Neighborhood -->
			<div class="space-y-2">
				<Label for="neighborhood_display">Bairro</Label>
				<Input
					id="neighborhood_display"
					value={locationDisplay.neighborhood}
					placeholder="Centro"
					disabled
					class="bg-gray-50"
				/>
			</div>
		</div>
	{/if}

	<!-- Street, Number, Complement - Only show after CEP lookup attempt (success or error) -->
	{#if hasTriedCepLookup}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Street -->
			<div class="space-y-2">
				<Label for="street">Rua {required ? '*' : ''}</Label>
				<Input
					id="street"
					bind:value={address.street}
					onchange={(e) => updateField('street', e.currentTarget.value)}
					placeholder="Rua das Flores"
					disabled={disabled}
					required={required}
				/>
			</div>

			<!-- Number -->
			<div class="space-y-2">
				<Label for="number">Número {required ? '*' : ''}</Label>
				<Input
					id="number"
					bind:value={address.number}
					onchange={(e) => updateField('number', e.currentTarget.value)}
					placeholder="123"
					disabled={disabled}
					required={required}
				/>
			</div>
		</div>

		<!-- Complement -->
		<div class="space-y-2">
			<Label for="complement">Complemento</Label>
			<Input
				id="complement"
				bind:value={address.complement}
				onchange={(e) => updateField('complement', e.currentTarget.value)}
				placeholder="Apto 45, Bloco B"
				{disabled}
			/>
		</div>
	{/if}
</div>
