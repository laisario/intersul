# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

### Backend (NestJS)

**Runner:** Jest 29.x
**Config file:** `backend/package.json` (jest section)
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testEnvironment": "node",
  "setupFilesAfterEnv": []
}
```

**Assertion Library:** Jest built-in (`expect`)

**Run Commands:**
```bash
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:cov              # Coverage
npm run test:unit             # Unit tests only (spec.ts files)
npm run test:integration      # Integration tests only (integration.spec.ts)
npm run test:e2e              # E2E tests only (jest-e2e.json)
npm run test:all              # All tests sequentially
npm run test:ci               # CI mode with coverage
```

### Frontend (SvelteKit)

**Runner:** Vitest 4.x
**Config file:** `frontend/vitest.config.ts`
```typescript
export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
  },
});
```

**Assertion Library:** Vitest built-in (`expect`)

**Run Commands:**
```bash
npm test              # Run tests
npm run test:run      # Run once
npm run test:ui       # UI mode
```

**Note:** Frontend has no test files at present (`npm test` runs but finds 0 tests).

## Test File Organization

### Backend

**Location:** Co-located with source files
- Unit tests: `src/**/*.spec.ts`
- Integration tests: `src/**/*.integration.spec.ts`
- E2E tests: `test/*.e2e-spec.ts`

**Naming:**
- `{ModuleName}.controller.spec.ts`
- `{ModuleName}.controller.integration.spec.ts`
- `{Feature}.e2e-spec.ts`

**Structure:**
```
backend/
├── src/
│   └── modules/
│       └── auth/
│           ├── controllers/
│           │   ├── auth.controller.spec.ts       # Unit tests
│           │   └── auth.controller.integration.spec.ts
│           └── services/
│               └── auth.service.ts
└── test/
    ├── test-setup.ts                             # Shared test utilities
    └── auth.e2e-spec.ts                          # E2E tests
```

### Frontend

**Location:** Not yet implemented
- Test setup exists at `frontend/src/test/setup.ts`
- No test files found (`frontend/src/**/*.spec.ts`)

## Test Structure

### Backend Unit Tests

**Pattern:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth';
import { AuthService } from '../services/auth';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token when login is successful', async () => {
      // Arrange
      const loginDto: LoginDto = { /* ... */ };
      jest.spyOn(authService, 'login').mockResolvedValue({ /* ... */ });

      // Act
      const result = await authController.login(loginDto);

      // Assert
      expect(result).toEqual({ /* ... */ });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
```

**Key Patterns:**
- `TestingModule` from `@nestjs/testing`
- `jest.fn()` for mocking
- `jest.spyOn()` for spying on existing methods
- `mockResolvedValue()` / `mockRejectedValue()` for async responses
- `describe()` blocks for grouping related tests
- `beforeEach()` for setup

### Backend Integration Tests

**Pattern:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth';
import { AuthService } from '../services/auth';
import { testDatabaseConfig } from '../../../test/test-setup';

describe('AuthController Integration', () => {
  let app: INestApplication;
  let authController: AuthController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...testDatabaseConfig, entities: [User] }),
        TypeOrmModule.forFeature([User]),
      ],
      controllers: [AuthController],
      providers: [AuthService, UserService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    authController = moduleFixture.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await userService.remove(1);
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register user first
      await authController.register(registerDto);
      // Then login
      const result = await authController.login(loginDto);
      expect(result).toHaveProperty('access_token');
    });
  });
});
```

**Key Patterns:**
- Uses real database via TypeORM (`synchronize: true`, `dropSchema: true`)
- `beforeAll` / `afterAll` for app lifecycle
- `ValidationPipe` for DTO transformation
- Cleanup in `beforeEach`

### Backend E2E Tests

**Config:** `backend/test/jest-e2e.json`
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "testTimeout": 30000
}
```

**Location:** `backend/test/*.e2e-spec.ts`

### Frontend Test Setup

**Setup file:** `frontend/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: { subscribe: vi.fn(() => () => {}) },
}));

// Mock TanStack Query
vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(() => ({ /* ... */ })),
  createMutation: vi.fn(() => ({ /* ... */ })),
}));

// Mock axios
vi.mock('axios', () => ({ /* ... */ }));

// Mock toast
vi.mock('$lib/utils/toast', () => ({ /* ... */ }));
```

## Mocking

### Backend

**What to Mock:**
- Services: Use `useValue` with jest.fn() objects
- Repositories: Use `useValue` or `createMockRepository()`
- External services: JWT, file storage, etc.

**Mock Repository Pattern:**
```typescript
export function createMockRepository<T>(): Partial<Repository<T>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    }),
  };
}
```

### Frontend

**Mocking Approach:**
- Uses `vi.mock()` from Vitest
- Mocks for: `$app/navigation`, `$app/stores`, `@tanstack/svelte-query`, `axios`, toast utilities

## Fixtures and Factories

### Backend Test Data

**Location:** `backend/test/test-setup.ts`

```typescript
export const testData = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'ADMIN' as any,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  client: { /* ... */ },
  copyMachineCatalog: { /* ... */ },
  // ... more test data
};
```

**Usage in Tests:**
```typescript
const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  // ...
} as User;
```

## Coverage

### Backend

**Requirements:** 100% coverage enforced
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}
```

**Excluded from Coverage:**
- `*.spec.ts` files
- `*.integration.spec.ts` files
- `test/**` directory
- `node_modules/**`

**View Coverage:**
```bash
npm run test:cov
```

**Output:** Reports in `coverage/` directory (text, lcov, html)

### Frontend

**Coverage:** Not configured (no tests exist)

## Test Types

### Backend Unit Tests

**Scope:** Individual controllers/services in isolation
**Pattern:** Mock all dependencies
**Example:** `backend/src/modules/auth/controllers/auth.controller.spec.ts`

### Backend Integration Tests

**Scope:** Controller with real database
**Pattern:** TypeORM with test database, real services
**Example:** `backend/src/modules/auth/controllers/auth.controller.integration.spec.ts`

### Backend E2E Tests

**Scope:** Full application flow
**Pattern:** HTTP requests via supertest
**Example:** `backend/test/auth.e2e-spec.ts`

### Frontend Tests

**Status:** Not implemented
**Recommended approach:** Vitest + @testing-library/svelte

## Common Patterns

### Async Testing

```typescript
it('should throw error when login fails', async () => {
  jest.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid credentials'));

  await expect(authController.login(loginDto)).rejects.toThrow('Invalid credentials');
});
```

### Error Testing

```typescript
it('should fail with duplicate email', async () => {
  await expect(authController.register(registerDto)).rejects.toThrow();
});
```

### Spying

```typescript
it('should call authService.login with loginDto', async () => {
  jest.spyOn(authService, 'login').mockResolvedValue({ /* ... */ });

  await authController.login(loginDto);

  expect(authService.login).toHaveBeenCalledWith(loginDto);
});
```

---

*Testing analysis: 2026-02-18*
