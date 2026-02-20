import type { CreateAddressDto } from '$lib/api/types/address.types.js';
import { normalizePostalCode } from './postal-code.js';

/**
 * Checks if an address is complete and valid for submission
 * Required fields: postalCode, street, number, neighborhoodId
 */
export function isAddressComplete(address: Partial<CreateAddressDto> | null | undefined): boolean {
	if (!address) return false;

	// Use normalized postal code for validation (digits only)
	const normalizedPostalCode = normalizePostalCode(address.postalCode);
	const hasPostalCode = normalizedPostalCode.length === 8;
	const hasStreet = !!address.street?.trim();
	const hasNumber = !!address.number?.trim();
	const hasNeighborhoodId = !!address.neighborhoodId;

	return hasPostalCode && hasStreet && hasNumber && hasNeighborhoodId;
}

/**
 * Gets a user-friendly message about what's missing in the address
 */
export function getAddressValidationMessage(address: Partial<CreateAddressDto> | null | undefined): string | null {
	if (!address) return 'Preencha o endereço';

	// Use normalized postal code for validation (digits only)
	const normalizedPostalCode = normalizePostalCode(address.postalCode);
	
	// Only show "Busque o CEP..." if postalCode is empty or invalid
	// If postalCode exists and is valid, but neighborhoodId is missing,
	// it means location processing failed or is pending - show different message
	if (normalizedPostalCode.length !== 8) {
		return 'Busque o CEP para preencher automaticamente';
	}

	if (!address.street?.trim()) {
		return 'Preencha a rua';
	}

	if (!address.number?.trim()) {
		return 'Preencha o número';
	}

	// If postalCode is valid but neighborhoodId is missing:
	// This should only happen if:
	// 1. User manually entered CEP without doing ViaCEP lookup (shouldn't show "Busque o CEP" message)
	// 2. ViaCEP lookup succeeded but location processing failed (should show different message)
	// Since we now call processLocationData immediately after ViaCEP success,
	// if neighborhoodId is still missing, it means location processing failed.
	// Don't show "Busque o CEP..." here - that message is only for when CEP is missing/invalid.
	if (!address.neighborhoodId && normalizedPostalCode.length === 8) {
		return 'Erro ao processar localização. Tente buscar o CEP novamente.';
	}

	return null;
}
