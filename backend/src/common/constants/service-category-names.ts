/**
 * Official category name for franchise closing services.
 * Must match `ensureBillingCategory` in billings.service.
 */
export const FRANCHISE_CLOSING_CATEGORY_NAME = 'Fechamento de Franquia';

export function isFranchiseClosingCategoryName(name: string | undefined | null): boolean {
  return (name ?? '').trim() === FRANCHISE_CLOSING_CATEGORY_NAME;
}
