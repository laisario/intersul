# Feature Documentation Guide

This directory contains feature documentation organized by backend and frontend modules. Each feature has its own `plan.md` file that documents its purpose, scope, user flows, and implementation details.

## Directory Structure

```
docs/features/
├── backend/
│   └── <module>/
│       └── <feature>/
│           └── plan.md
├── frontend/
│   └── <module>/
│       └── <feature>/
│           └── plan.md
└── README.md (this file)
```

## Adding a New Feature

### Step 1: Create Feature Directory

Create the feature directory structure:

```bash
mkdir -p docs/features/<backend|frontend>/<module>/<feature>
```

**Naming Conventions:**
- **Modules**: Use kebab-case (e.g., `copy-machines`, `service-steps`)
- **Features**: Use kebab-case, action-oriented names (e.g., `create-client`, `upload-step-image`, `generate-billings-by-city`)

### Step 2: Create plan.md

Create a `plan.md` file in the feature directory using the template below.

### Step 3: Fill Out plan.md Template

Copy the template below and fill in all sections. Be thorough but concise.

## plan.md Template

```markdown
# Feature: <Feature Name>

## Feature summary

<2-5 lines describing what this feature does>

## User value

**What problem it solves:**
- <Problem statement>

**Who benefits:**
- <User personas or roles>

## Scope

### In scope
- <List of included functionality>

### Out of scope
- <List of explicitly excluded functionality>

## User flow

1. <Step-by-step flow>
2. <Continue with numbered steps>
3. <Include alternate paths if applicable>
   - Empty state: <description>
   - Error state: <description>

## Acceptance criteria

- <Testable statement 1>
- <Testable statement 2>
- <Testable statement 3>

## Backend/Frontend behavior

### If Backend plan:
**Endpoints/actions involved:**
- <Endpoint 1>: <description>
- <Endpoint 2>: <description>

**Main rules/validations:**
- <Rule 1>
- <Rule 2>

### If Frontend plan:
**Screens/components involved:**
- <Screen/Component 1>: <description>
- <Screen/Component 2>: <description>

**Key states:**
- <State 1>: <description>
- <State 2>: <description>

**Validations:**
- <Validation 1>
- <Validation 2>

## Data & permissions

**Entities/tables/collections:**
- <Entity 1>: <description>
- <Entity 2>: <description>

**Roles/permissions:**
- <Role 1>: <permissions>
- <Role 2>: <permissions>

## Edge cases & failures

**Validation errors:**
- <Error case 1>: <handling>
- <Error case 2>: <handling>

**Missing data:**
- <Case 1>: <handling>

**Permission denied:**
- <Case 1>: <handling>

**Network / integration failure cases:**
- <Case 1>: <handling>

## Observability

**Logs/events:**
- <Event 1>: <when logged>
- <Event 2>: <when logged>

**Metrics (optional):**
- <Metric 1>: <description>

## Open questions

- <Question 1>
- <Question 2>
```

## Definition of Done

A feature's `plan.md` is considered complete when:

1. ✅ All template sections are filled out
2. ✅ Feature summary clearly describes the feature's purpose
3. ✅ User value explains the problem and beneficiaries
4. ✅ Scope clearly defines in-scope and out-of-scope items
5. ✅ User flow covers main path and alternate paths (empty/error states)
6. ✅ Acceptance criteria are testable and specific
7. ✅ Backend/Frontend behavior documents endpoints/screens and key logic
8. ✅ Data & permissions lists all affected entities and access requirements
9. ✅ Edge cases & failures cover validation, missing data, permissions, and network issues
10. ✅ Observability describes logging and metrics (if applicable)
11. ✅ Open questions section lists any unknowns or items needing confirmation

## Examples

### Backend Feature Example
```
docs/features/backend/clients/create-client/plan.md
```

### Frontend Feature Example
```
docs/features/frontend/services/service-list/plan.md
```

## Best Practices

1. **Be Specific**: Use concrete examples rather than vague descriptions
2. **Think User-First**: Focus on user value and flows before technical details
3. **Document Edge Cases**: Don't skip error handling and edge cases
4. **Keep It Updated**: Update `plan.md` as the feature evolves
5. **Mark Unknowns**: Use "Open questions" for items needing clarification
6. **No Code**: Keep documentation at the feature level, not implementation level

## Questions?

If you're unsure about:
- **What constitutes a feature?** → A feature is a distinct user-facing capability (e.g., "create client", "upload step image", "generate billings")
- **Module naming?** → Match the module name from the codebase (e.g., `copy-machines`, `service-steps`)
- **Feature granularity?** → One feature = one user action or workflow (e.g., "create-client" not "client-crud")
