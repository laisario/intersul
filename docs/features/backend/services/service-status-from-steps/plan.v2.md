# Feature: Service Status Auto-Update Based on Steps (v2)

Refined design with resolved open questions and implementation-oriented details. Complements plan.md.

## Resolved business rules

| Condition | Result |
|-----------|--------|
| Service has no Steps | PENDING |
| All Steps PENDING | PENDING |
| All Steps CONCLUDED | CONCLUDED |
| Any Step IN_PROGRESS | IN_PROGRESS |
| Mixed (PENDING + CONCLUDED, no IN_PROGRESS) | IN_PROGRESS |
| One or more CANCELLED, rest CONCLUDED (none PENDING/IN_PROGRESS) | CONCLUDED |
| All Steps CANCELLED | CONCLUDED (workflow finished) |
| Service.status is CANCELLED | Skip recalc — preserve manual cancellation |

## Manual override policy

- **Service CANCELLED:** Recalc is skipped when Service.status === CANCELLED to preserve intentional cancellation.
- **Service CONCLUDED:** Recalc may override (e.g. if last Step reverted) — keeps derivation consistent.

## Execution flow (etapa changes → service recalculation)

**Step created:** Persist Step → call recalculateStatus(service_id) → apply rules → save Service if changed.

**Step updated (status):** Persist Step → call recalculateStatus(service_id) → apply rules → save Service if changed.

**Step deleted:** Remove Step → call recalculateStatus(service_id) → if no Steps → PENDING; else apply rules → save Service if changed.

**Transaction:** Wrap Step save + recalculateStatus in transaction for atomicity (e.g. concludeStep, startStep, ServicesService.update with steps).

## Implementation checklist

1. Refactor ServicesService.updateServiceStatus → recalculateStatus; implement full rule set.
2. Update call sites: startStep, concludeStep, cancelStep (already call); StepService.update (add when status changes); ServicesService.create (optional); ServicesService.update (already calls).
3. Use transaction for Step save + recalculateStatus where both touch DB.
4. Migration script: For each Service, call recalculateStatus(service.id). Skip CANCELLED if preserving manual override.

## Suggested tests

- Unit: recalculateStatus — no steps → PENDING; all PENDING → PENDING; all CONCLUDED → CONCLUDED; one IN_PROGRESS → IN_PROGRESS; mixed → IN_PROGRESS; all CANCELLED → CONCLUDED; service not found → no-op; Service CANCELLED → skip.
- Integration: startStep → Service IN_PROGRESS; concludeStep (last) → Service CONCLUDED; concludeStep (not last) → IN_PROGRESS; cancelStep → recalculated; transaction rollback → Service not updated.
- Edge: Concurrent concludeStep for last two steps → one wins; Service CONCLUDED.

## Impact / migration

- Existing Services may have status out of sync with Steps.
- One-time job: for each Service, call recalculateStatus(serviceId). Skip Services with status CANCELLED if preserving manual cancel.
- No schema changes required.
- Services currently CONCLUDED manually might be overwritten if Steps not all concluded — assess product impact.
