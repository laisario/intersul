/**
 * Normalizes postal code to digits only (removes formatting)
 * @example "27323-750" -> "27323750"
 */
export function normalizePostalCode(value: string | null | undefined): string {
	if (!value) return '';
	return value.replace(/\D/g, '');
}

/**
 * Formats postal code with hyphen
 * @example "27323750" -> "27323-750"
 */
export function formatPostalCode(value: string | null | undefined): string {
	const normalized = normalizePostalCode(value);
	if (normalized.length <= 5) return normalized;
	return `${normalized.slice(0, 5)}-${normalized.slice(5, 8)}`;
}
