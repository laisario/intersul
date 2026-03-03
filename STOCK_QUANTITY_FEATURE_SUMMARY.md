# Stock Quantity Feature Implementation Summary

## Overview
Implemented stock quantity tracking for catalog machines with automatic decrement when machines are rented (ALUGADA/RENT) or sold (VENDIDA/SOLD) to clients.

## Backend Changes

### 1. Entity Update
**File:** `backend/src/modules/copy-machines/entities/copy-machine-catalog.entity.ts`
- Added `stockQuantity` field: `@Column({ type: 'int', default: 0 }) stockQuantity: number;`
- Field is NOT NULL with default value of 0

### 2. Migration
**File:** `backend/src/migrations/1772568247272-AddStockQuantityToCopyMachineCatalog.ts`
- Adds `stockQuantity` column to `copy_machine_catalog` table
- Type: `int`, Default: `0`, NOT NULL
- Includes rollback in `down()` method

### 3. Service Logic
**File:** `backend/src/modules/copy-machines/copy-machines.service.ts`

**Changes:**
- Injected `DataSource` for transaction management
- Updated `createClientCopyMachine()` method:
  - Uses database transaction for atomicity
  - Locks catalog machine row with `pessimistic_write` to prevent race conditions
  - Decrements stock when `acquisition_type` is `RENT` or `SOLD`
  - Uses atomic SQL update: `stockQuantity = stockQuantity - 1`
  - Allows negative stock (no blocking)
  - Commits transaction after both operations succeed

**Key Implementation Details:**
```typescript
// Transaction ensures atomicity
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();

// Lock row to prevent race conditions
catalogMachine = await queryRunner.manager.findOne(CopyMachineCatalog, {
  where: { id: catalogMachineId },
  lock: { mode: 'pessimistic_write' },
});

// Atomic SQL update
await queryRunner.manager
  .createQueryBuilder()
  .update(CopyMachineCatalog)
  .set({ stockQuantity: () => 'stockQuantity - 1' })
  .where('id = :id', { id: catalogMachine.id })
  .execute();
```

## Frontend Changes

### 1. Type Updates
**File:** `frontend/src/lib/api/types/copy-machine.types.ts`
- Added `stockQuantity?: number;` to `CopyMachineCatalog` interface

### 2. Form Component Updates
**File:** `frontend/src/lib/components/copymachine-form-dialog.svelte`

**Changes:**
- Display stock quantity in catalog machine select dropdown
- Show stock warning when stock is <= 0:
  - Negative stock: Red warning with "⚠️ Estoque negativo: X unidade(s)"
  - Zero stock: Yellow warning with "⚠️ Estoque zerado"
  - Positive stock: Green info with "Estoque disponível: X unidade(s)"
- Refresh catalog query after successful machine creation to update stock display

**Stock Display in Select:**
```svelte
<option value={machine.id}>
  {machine.manufacturer} - {machine.model}
  {machine.price ? `(R$ ${price})` : ''}
  {machine.stockQuantity !== undefined ? `[Estoque: ${stock}]` : ''}
</option>
```

**Stock Warning:**
```svelte
{#if selectedCatalogMachine && selectedCatalogMachine.stockQuantity !== undefined}
  {#if stock <= 0}
    <p class="text-xs {stock < 0 ? 'text-destructive' : 'text-yellow-600'}">
      {stock < 0 ? '⚠️ Estoque negativo: ' + stock : '⚠️ Estoque zerado'}
    </p>
  {/if}
{/if}
```

### 3. Catalog Page Updates
**File:** `frontend/src/routes/(protected)/machines/+page.svelte`

**Changes:**
- Display stock quantity badge in machine cards
- Color coding:
  - Negative: Red badge (destructive variant)
  - Zero: Yellow badge (secondary variant)
  - Positive: Default badge
- Show warning messages for negative/zero stock

## Business Rules

1. **Stock Decrement:**
   - Only decrements when `acquisition_type` is `RENT` (ALUGADA) or `SOLD` (VENDIDA)
   - Does NOT decrement for `OWNED` (própria) or other types

2. **Negative Stock:**
   - Allowed (no blocking)
   - UI shows clear warning indicators

3. **Concurrency Safety:**
   - Uses pessimistic locking (`SELECT ... FOR UPDATE`)
   - Transaction ensures atomicity
   - Atomic SQL update prevents race conditions

4. **Stock Display:**
   - Shows in catalog machine select dropdown
   - Shows in catalog machine cards
   - Updates automatically after machine creation

## Files Changed

### Backend (3 files)
1. `backend/src/modules/copy-machines/entities/copy-machine-catalog.entity.ts`
2. `backend/src/migrations/1772568247272-AddStockQuantityToCopyMachineCatalog.ts`
3. `backend/src/modules/copy-machines/copy-machines.service.ts`

### Frontend (3 files)
1. `frontend/src/lib/api/types/copy-machine.types.ts`
2. `frontend/src/lib/components/copymachine-form-dialog.svelte`
3. `frontend/src/routes/(protected)/machines/+page.svelte`

## Example Payloads

### Create Client Machine (RENT - decrements stock)
```json
{
  "clientId": 1,
  "catalogCopyMachineId": 5,
  "acquisitionType": "RENT",
  "serialNumber": "SN123456"
}
```
**Result:** Catalog machine #5 stock decreases by 1

### Create Client Machine (SOLD - decrements stock)
```json
{
  "clientId": 1,
  "catalogCopyMachineId": 5,
  "acquisitionType": "SOLD",
  "value": 2500.00
}
```
**Result:** Catalog machine #5 stock decreases by 1

### Create Client Machine (OWNED - no stock change)
```json
{
  "clientId": 1,
  "acquisitionType": "OWNED",
  "externalModel": "HP LaserJet",
  "externalManufacturer": "HP"
}
```
**Result:** No stock change (external machine, not from catalog)

## Manual Test Checklist

### Backend Tests
- [ ] Run migration: `npm run migration:run`
- [ ] Create client machine with RENT → stock decreases by 1
- [ ] Create client machine with SOLD → stock decreases by 1
- [ ] Create client machine with OWNED → stock unchanged
- [ ] Create multiple machines concurrently → stock updates correctly (no race conditions)
- [ ] Create machine when stock is 0 → stock becomes -1 (allowed)
- [ ] Verify transaction rollback on error

### Frontend Tests
- [ ] Catalog page displays stock quantity for each machine
- [ ] Stock badge shows correct color (red/yellow/green)
- [ ] Machine form select shows stock in dropdown
- [ ] Stock warning appears when stock <= 0
- [ ] After creating RENT machine, catalog refreshes and stock updates
- [ ] After creating SOLD machine, catalog refreshes and stock updates
- [ ] Negative stock displays correctly (e.g., "-2 unidade(s)")

### Integration Tests
- [ ] Create RENT machine → verify stock decrements in database
- [ ] Create SOLD machine → verify stock decrements in database
- [ ] Create OWNED machine → verify stock unchanged
- [ ] Verify UI updates reflect database changes immediately

## Migration Instructions

1. **Run Migration:**
   ```bash
   cd backend
   npm run migration:run
   ```

2. **Verify Migration:**
   ```sql
   DESCRIBE copy_machine_catalog;
   -- Should show stockQuantity column with type int, default 0
   ```

3. **Test Stock Updates:**
   - Create a catalog machine
   - Create a client machine with RENT or SOLD
   - Verify stock decreases in database

## Notes

- Stock can go negative (no blocking)
- Transaction ensures data consistency
- Pessimistic locking prevents race conditions
- UI provides clear visual feedback for stock status
- Catalog automatically refreshes after machine creation
