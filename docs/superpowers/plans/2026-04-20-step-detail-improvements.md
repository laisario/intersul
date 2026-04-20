# Step Detail Page Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar a experiência de edição de etapas entre desktop e mobile — adicionando checklist interativo na página de detalhes, upload de fotos no `StepFormDialog`, e auto-start automático ao marcar um item de checklist em etapa PENDING.

**Architecture:** Três arquivos modificados, zero arquivos novos. `StepFormDialog` passa a ser completo (observation + responsableClient + fotos) e compartilhado entre desktop e mobile. A página de detalhes migra o form inline para um dialog e exibe o checklist. `StepCard` ganha auto-start ao tocar no checklist.

**Tech Stack:** SvelteKit 2 / Svelte 5 (`$state`, `$derived`, `$props`, `$effect`), TanStack Query v5 (`createQuery` / `createMutation`), Tailwind CSS 4, lucide-svelte, componentes shadcn-svelte (`Dialog`, `Card`, `Button`, `Badge`, `Label`).

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/lib/components/step-form-dialog.svelte` | Modificar | Adicionar `useStepImages` interno e `StepImagesUpload` |
| `src/routes/(protected)/steps/[id]/+page.svelte` | Modificar | Checklist + button "Preencher informações" + auto-start + remover form inline |
| `src/lib/components/step-card.svelte` | Modificar | Auto-start ao marcar checklist em etapa PENDING |

---

### Task 1: Adicionar upload de imagens no `StepFormDialog`

**Files:**
- Modify: `src/lib/components/step-form-dialog.svelte`

**Contexto:** O dialog atual tem observation e responsableClient mas não tem upload de fotos. Vamos adicionar `useStepImages(step.id)` internamente e incluir `StepImagesUpload` no corpo do dialog — abaixo dos campos de texto. Isso resolve o mobile (home page usa o mesmo dialog) sem alterar a interface de props.

- [ ] **Step 1: Abrir o arquivo e identificar os imports atuais**

Leia `src/lib/components/step-form-dialog.svelte` para confirmar a lista de imports atual antes de editar.

- [ ] **Step 2: Adicionar os imports necessários**

No bloco `<script lang="ts">`, adicione as linhas abaixo junto aos imports existentes:

```typescript
import { useStepImages } from '$lib/hooks/queries/use-steps.svelte.js';
import StepImagesUpload from '$lib/components/step-images-upload.svelte';
import { queryClient } from '$lib/config/query-client.js';
import type { Image } from '$lib/api/types/service.types.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';  // já existe, confirmar
import { env } from '$lib/config/env.js';
```

> Nota: `Dialog` já está importado. `env`, `queryClient`, `Image` e `StepImagesUpload` são novos.

- [ ] **Step 3: Adicionar a query de imagens e o estado de preview**

Dentro do `<script>`, logo após as declarações de mutation (`useUpdateStep`, `useUpdateBilling`), adicione:

```typescript
// Images query — internal to dialog
const imagesQuery = $derived(useStepImages(step.id));
const images = $derived(imagesQuery.data || []);

// Image preview state
let selectedImage = $state<Image | null>(null);
let showImagePreview = $state(false);

function handleImageClick(image: Image) {
    selectedImage = image;
    showImagePreview = true;
}
```

- [ ] **Step 4: Inserir `StepImagesUpload` no template do dialog**

No template HTML, dentro do `<div class="flex-1 overflow-y-auto ...">` e após o bloco `<div class="space-y-4">` que contém observation e responsableClient (antes do fechamento da div), adicione a seção de imagens:

```svelte
<!-- Images Section -->
{#if isFormEnabled}
    <div class="space-y-2">
        <StepImagesUpload
            stepId={step.id}
            images={images}
            disabled={!isFormEnabled}
            onImageUploaded={() => {
                queryClient.invalidateQueries({ queryKey: ['steps', step.id, 'images'] });
            }}
            onImageDeleted={() => {
                queryClient.invalidateQueries({ queryKey: ['steps', step.id, 'images'] });
            }}
            onImageClick={handleImageClick}
        />
    </div>
{/if}
```

- [ ] **Step 5: Adicionar dialog de preview de imagem**

Logo antes do fechamento de `</Dialog.Root>` (ou após o conteúdo principal do dialog), adicione o dialog de preview de imagem. Como o `Dialog.Root` já envolve o conteúdo, adicione um segundo `Dialog.Root` separado após o fechamento do primeiro:

```svelte
<!-- Image Preview Dialog -->
<Dialog.Root bind:open={showImagePreview}>
    <Dialog.Content class="max-w-4xl max-h-[90vh] p-0">
        {#if selectedImage}
            <div class="relative w-full h-full">
                <img
                    src={selectedImage.path.startsWith('http') ? selectedImage.path : `${env.API_URL}${selectedImage.path}`}
                    alt="Preview da imagem"
                    class="w-full h-auto max-h-[85vh] object-contain"
                />
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
```

- [ ] **Step 6: Verificar tipos com o type checker**

```bash
cd /home/lucas/laisa-projects/intersul/frontend
npm run check 2>&1 | grep -E "step-form-dialog|Error" | head -20
```

Esperado: sem erros em `step-form-dialog.svelte`.

- [ ] **Step 7: Commit**

```bash
cd /home/lucas/laisa-projects/intersul
git add frontend/src/lib/components/step-form-dialog.svelte
git commit -m "feat: add image upload to StepFormDialog (desktop + mobile unification)"
```

---

### Task 2: Adicionar checklist e botão "Preencher informações" na página de detalhes

**Files:**
- Modify: `src/routes/(protected)/steps/[id]/+page.svelte`

**Contexto:** A página de detalhes tem o form inline com toggle edit/preview. Vamos: (a) remover o modo de edição inline, (b) manter apenas o preview read-only de observation/responsableClient/images, (c) adicionar botão "Preencher informações" que abre `StepFormDialog`, (d) adicionar seção de checklist com `useStepChecklists`.

> **Atenção:** O card de billing (`step.isBilling`) permanece intacto. Só o card "Step Info" é alterado.

- [ ] **Step 1: Adicionar imports novos no bloco `<script>`**

No topo do `<script lang="ts">`, adicione as linhas que ainda não existem:

```typescript
import { useStep, useUpdateStep, useStartStep, useConcludeStep, useCancelStep, useStepImages, useStepChecklists, useToggleChecklist } from '$lib/hooks/queries/use-steps.svelte.js';
import StepFormDialog from '$lib/components/step-form-dialog.svelte';
import { ClipboardList } from 'lucide-svelte';
import type { StepChecklist } from '$lib/api/types/service.types.js';
```

> `useStartStep`, `useConcludeStep`, `useCancelStep`, `useStepImages` já estão importados — apenas acrescente `useStepChecklists`, `useToggleChecklist` na mesma linha de import. `StepFormDialog` e `ClipboardList` são novos.

- [ ] **Step 2: Adicionar queries e estado do dialog**

Logo após as queries existentes (`stepQuery`, `imagesQuery`, `usersQuery`), adicione:

```typescript
const checklistsQuery = $derived(useStepChecklists(stepId));
const checklists = $derived(checklistsQuery.data || []);
const isLoadingChecklists = $derived(checklistsQuery.isLoading);

let showFormDialog = $state(false);
```

E adicione o mutation de toggle checklist junto aos outros mutations:

```typescript
const { mutate: toggleChecklist, isPending: isTogglingChecklist } = useToggleChecklist();
```

- [ ] **Step 3: Adicionar handler de toggle checklist com auto-start**

Adicione esta função junto às outras funções handlers (ex.: após `handleCancelEdit`):

```typescript
function handleToggleChecklist(checklist: StepChecklist) {
    if (!step) return;

    // Auto-start: se etapa está PENDING, iniciar antes de toggle
    if (step.status === 'PENDING') {
        startStep(step.id, {
            onSuccess: () => {
                successToast.updated('Etapa iniciada');
                toggleChecklist(checklist.id);
            },
            onError: (error: any) => {
                const message = error?.response?.data?.errors?.[0]?.message
                    || error?.response?.data?.message
                    || 'Erro ao iniciar etapa';
                showError(message);
            },
        });
    } else if (step.status === 'IN_PROGRESS') {
        toggleChecklist(checklist.id, {
            onError: () => {
                showError('Erro ao atualizar checklist');
            },
        });
    }
    // CONCLUDED / CANCELLED: não faz nada (checklist será read-only no template)
}
```

- [ ] **Step 4: Remover o estado `isEditMode` e `isBillingEditMode` do form inline**

Remova as seguintes linhas de `$state` que só serviam o edit-mode inline (o billing edit mode permanece):

```typescript
// REMOVER estas linhas:
let isEditMode = $state(false);
```

E no `$effect` que inicializa os campos, **remova** apenas o bloco que controlava `isEditMode`:

```typescript
// REMOVER este bloco de dentro do $effect:
if (isFormEnabled) {
    const hasSavedData = (step.observation && step.observation.trim()) || (step.responsableClient && step.responsableClient.trim());
    isEditMode = !hasSavedData;
} else {
    isEditMode = false;
}
```

As variáveis `observation` e `responsableClient` permanecem — são usadas no preview read-only.

- [ ] **Step 5: Substituir o card "Step Info" no template**

Encontre o card com `<CardTitle>{step.name}</CardTitle>` (começando em `<!-- Step Info -->`). Substitua **toda** a `<CardContent class="space-y-6">` desse card pela nova versão abaixo:

```svelte
<CardContent class="space-y-6">
    {#if !isFormEnabled}
        <div class="bg-muted/50 border border-muted rounded-lg p-4">
            <p class="text-sm text-muted-foreground">
                {#if step.status === 'PENDING'}
                    Para preencher este formulário, você precisa iniciar a etapa clicando no botão "Iniciar Etapa".
                {:else if step.status === 'CONCLUDED'}
                    Esta etapa já foi concluída e não pode mais ser editada.
                {:else if step.status === 'CANCELLED'}
                    Esta etapa foi cancelada e não pode mais ser editada.
                {:else}
                    O formulário está desabilitado.
                {/if}
            </p>
        </div>
    {/if}

    <!-- ── Informações da Etapa ─────────────────────────────── -->
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações</h3>
            {#if isFormEnabled && isResponsable}
                <Button variant="outline" size="sm" onclick={() => (showFormDialog = true)}>
                    Preencher informações
                </Button>
            {/if}
        </div>

        {#if isFormEnabled && !isResponsable}
            <div class="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div class="flex items-center gap-2">
                    <User class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Você não é o responsável por esta etapa. Apenas o responsável pode editar as informações.
                    </p>
                </div>
            </div>
        {/if}

        <!-- Observação -->
        <div class="space-y-1">
            <Label class="text-sm font-medium text-muted-foreground">Observação</Label>
            <div class="min-h-[60px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                {#if observation}
                    {observation}
                {:else}
                    <span class="text-muted-foreground italic">Nenhuma observação adicionada</span>
                {/if}
            </div>
        </div>

        <!-- Responsável no Cliente -->
        <div class="space-y-1">
            <Label class="text-sm font-medium text-muted-foreground">Responsável no Cliente</Label>
            <div class="min-h-[38px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                {#if responsableClient}
                    {responsableClient}
                {:else}
                    <span class="text-muted-foreground italic">Não informado</span>
                {/if}
            </div>
        </div>

        <!-- Imagens (preview read-only) -->
        <div class="space-y-1">
            <Label class="text-sm font-medium text-muted-foreground">Imagens</Label>
            {#if images && images.length > 0}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {#each images as image (image.id)}
                        <div
                            role="button"
                            tabindex="0"
                            class="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                            onclick={() => handleImageClick(image)}
                            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleImageClick(image)}
                        >
                            <img
                                src={image.path.startsWith('http') ? image.path : `${env.API_URL}${image.path}`}
                                alt="Imagem da etapa"
                                class="w-full h-full object-cover"
                            />
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="border-2 border-dashed rounded-lg p-6 text-center">
                    <ImageIcon class="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p class="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- ── Checklist ─────────────────────────────────────────── -->
    {#if isLoadingChecklists}
        <div class="border-t pt-4 space-y-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-full" />
        </div>
    {:else if checklists.length > 0}
        <div class="border-t pt-4 space-y-3">
            <div class="flex items-center gap-2">
                <ClipboardList class="w-4 h-4 text-muted-foreground" />
                <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Checklist
                    <span class="font-normal normal-case ml-1">
                        ({checklists.filter((c) => c.completed).length}/{checklists.length})
                    </span>
                </h3>
            </div>
            <div class="space-y-2">
                {#each checklists as checklist (checklist.id)}
                    {@const isEditable = step.status === 'PENDING' || step.status === 'IN_PROGRESS'}
                    <label class="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={checklist.completed}
                            disabled={!isEditable || isTogglingChecklist}
                            onchange={() => handleToggleChecklist(checklist)}
                            class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                        />
                        <span class={`text-sm ${checklist.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {checklist.description}
                        </span>
                    </label>
                {/each}
            </div>
        </div>
    {/if}
</CardContent>
```

- [ ] **Step 6: Remover as funções que não são mais necessárias**

As seguintes funções serviam só o form inline e podem ser removidas:

```typescript
// REMOVER completamente:
function handleEdit() { ... }
function handleCancelEdit() { ... }
```

> Atenção: `handleSave` também pode ser removida se não houver mais chamadas a ela. Verifique com grep antes de remover:

```bash
grep -n "handleSave\|handleEdit\|handleCancelEdit" frontend/src/routes/\(protected\)/steps/\[id\]/+page.svelte
```

Se `handleSave` não tiver mais referências no template, remova também.

- [ ] **Step 7: Adicionar `StepFormDialog` no template (após os Dialogs existentes)**

Logo antes da última linha `</div>` que fecha o `<div class="space-y-6 px-6">` principal, ou junto aos outros dialogs (`ConfirmationDialog`, Edit Responsable Dialog), adicione:

```svelte
<!-- Step Form Dialog -->
<StepFormDialog
    step={step}
    bind:open={showFormDialog}
    onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ['steps', stepId, 'images'] });
    }}
/>
```

- [ ] **Step 8: Verificar tipos**

```bash
cd /home/lucas/laisa-projects/intersul/frontend
npm run check 2>&1 | grep -E "\[id\]/\+page|Error" | head -30
```

Esperado: sem erros em `steps/[id]/+page.svelte`.

Se houver erro relacionado a `isEditMode` — significa que ainda há referência no template que precisa ser removida. Grep:

```bash
grep -n "isEditMode\|handleEdit\|handleCancelEdit\|handleSave" frontend/src/routes/\(protected\)/steps/\[id\]/+page.svelte
```

Remova todas as referências restantes.

- [ ] **Step 9: Commit**

```bash
cd /home/lucas/laisa-projects/intersul
git add frontend/src/routes/\(protected\)/steps/\[id\]/+page.svelte
git commit -m "feat: add checklist and form dialog to step detail page"
```

---

### Task 3: Auto-start ao marcar checklist em etapa PENDING no StepCard (mobile)

**Files:**
- Modify: `src/lib/components/step-card.svelte`

**Contexto:** O `StepCard` já tem `useToggleChecklist`. Vamos adicionar `useStartStep` e, no handler de toggle, verificar se o step está PENDING para auto-iniciar antes de marcar o item.

- [ ] **Step 1: Adicionar import de `useStartStep` e `successToast`**

No bloco `<script lang="ts">`, adicione junto aos imports existentes:

```typescript
import { useToggleChecklist, useStartStep } from '$lib/hooks/queries/use-steps.svelte.js';
import { successToast, showError } from '$lib/utils/toast.js';
```

> `useToggleChecklist` já existe no import — só acrescente `useStartStep` na mesma linha.

- [ ] **Step 2: Instanciar `useStartStep`**

Logo após `const { mutate: toggleChecklist } = useToggleChecklist();`, adicione:

```typescript
const { mutate: startStep, isPending: isStarting } = useStartStep();
```

- [ ] **Step 3: Atualizar `handleToggleChecklist` com lógica de auto-start**

Substitua a função `handleToggleChecklist` existente pela versão abaixo:

```typescript
function handleToggleChecklist(checklist: StepChecklist) {
    if (!step) return;

    if (step.status === 'PENDING') {
        startStep(step.id, {
            onSuccess: () => {
                successToast.updated('Etapa iniciada');
                toggleChecklist(checklist.id, {
                    onError: () => showError('Erro ao atualizar checklist'),
                });
            },
            onError: (error: any) => {
                const message = error?.response?.data?.errors?.[0]?.message
                    || error?.response?.data?.message
                    || 'Erro ao iniciar etapa';
                showError(message);
            },
        });
    } else if (step.status === 'IN_PROGRESS') {
        toggleChecklist(checklist.id, {
            onError: () => showError('Erro ao atualizar checklist'),
        });
    }
}
```

- [ ] **Step 4: Desabilitar checkboxes enquanto operações estão em andamento**

No template, no bloco `{#each step.checklists as checklist}`, atualize o `<input type="checkbox">` adicionando `disabled` baseado no estado de loading:

Encontre a linha:
```svelte
<input
    type="checkbox"
    checked={checklist.completed}
    onchange={() => handleToggleChecklist(checklist)}
    class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
/>
```

Substitua por:
```svelte
<input
    type="checkbox"
    checked={checklist.completed}
    disabled={isStarting || isTogglingChecklist}
    onchange={() => handleToggleChecklist(checklist)}
    class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
/>
```

E declare `isTogglingChecklist` — atualize a linha de `useToggleChecklist`:
```typescript
const { mutate: toggleChecklist, isPending: isTogglingChecklist } = useToggleChecklist();
```

- [ ] **Step 5: Verificar tipos**

```bash
cd /home/lucas/laisa-projects/intersul/frontend
npm run check 2>&1 | grep -E "step-card|Error" | head -20
```

Esperado: sem erros em `step-card.svelte`.

- [ ] **Step 6: Commit**

```bash
cd /home/lucas/laisa-projects/intersul
git add frontend/src/lib/components/step-card.svelte
git commit -m "feat: auto-start step when checklist item is toggled on PENDING step (mobile)"
```

---

### Task 4: Verificação visual e ajustes finais

**Files:** Nenhum arquivo novo — validação manual.

- [ ] **Step 1: Subir o ambiente de desenvolvimento**

```bash
# Terminal 1 — Backend (se não estiver rodando)
cd /home/lucas/laisa-projects/intersul/backend
npm run docker:up
npm run start:dev

# Terminal 2 — Frontend
cd /home/lucas/laisa-projects/intersul/frontend
npm run dev
```

- [ ] **Step 2: Verificar `StepFormDialog` com imagens**

1. Acesse `/` (home page) — visão mobile (DevTools → toggle device toolbar).
2. Encontre uma etapa IN_PROGRESS com responsabilidade sua.
3. Clique no botão de preencher formulário (ícone FileText).
4. Confirme que o dialog abre com: observação + responsável no cliente + seção de imagens.
5. Faça upload de uma imagem de teste.
6. Confirme que a imagem aparece na grade.
7. Feche o dialog e confirme que a imagem persiste ao reabrir.

- [ ] **Step 3: Verificar checklist na página de detalhes**

1. Acesse `/steps/:id` de uma etapa que tenha checklist.
2. Confirme que o checklist aparece no card "Step Info", abaixo de "Informações".
3. Confirme que o contador `(X/Y)` está correto.
4. Para etapa PENDING: marque um item → a etapa deve mudar para IN_PROGRESS automaticamente.
5. Para etapa IN_PROGRESS: marque um item → apenas o item muda (sem mudança de status).

- [ ] **Step 4: Verificar botão "Preencher informações"**

1. Na página de detalhes de uma etapa IN_PROGRESS com responsabilidade sua.
2. Confirme que o botão "Preencher informações" aparece na seção "Informações".
3. Clique → dialog abre com observation, responsableClient e imagens.
4. Preencha e salve → confirme que o card read-only atualiza com os novos valores.
5. Para etapa CONCLUDED: confirme que o botão não aparece e os valores são só leitura.

- [ ] **Step 5: Verificar auto-start no mobile (StepCard)**

1. Na home page mobile, encontre uma etapa PENDING com checklist.
2. Expanda o checklist clicando na seção.
3. Marque um item → confirme toast "Etapa iniciada" + item fica marcado + status do card muda para "Em Andamento".

- [ ] **Step 6: Verificar full type check**

```bash
cd /home/lucas/laisa-projects/intersul/frontend
npm run check
```

Esperado: zero erros.

- [ ] **Step 7: Commit final se necessário**

```bash
cd /home/lucas/laisa-projects/intersul
git add -p  # revisar qualquer ajuste residual
git commit -m "fix: visual adjustments from step detail improvements"
```

---

## Self-Review

### Spec Coverage

| Requisito | Task |
|-----------|------|
| Checklist visível na página de detalhes | Task 2 (Step 5) |
| Auto-start ao marcar checklist (PENDING → IN_PROGRESS) | Task 2 (Step 3) + Task 3 (Step 3) |
| Formulário como dialog/modal com botão "Preencher informações" | Task 2 (Steps 5, 7) |
| Formulário com observação + responsável + fotos | Task 1 (Steps 4, 5) |
| Mesmo formulário em desktop e mobile | Task 1 (sem mudança de props) |
| Fotos no mobile (StepFormDialog) | Task 1 |
| Não quebrar fluxo billing | Billing card intacto (Task 2 não toca nele) |
| Dark theme preservado | Usa classes existentes do sistema |

### Sem placeholders: ✅

Todos os code blocks contêm código real. Nenhum "TBD" ou "similar ao task N".

### Consistência de tipos: ✅

- `StepChecklist` importado de `service.types.js` em ambos os arquivos que o usam.
- `useStepImages`, `useStepChecklists`, `useToggleChecklist`, `useStartStep` — todos exportados de `use-steps.svelte.ts`.
- `queryClient.invalidateQueries` — padrão já usado em todo o codebase.
- `successToast.updated()` / `showError()` — padrão já usado em `step-card.svelte` (não, atualmente não usa toast — mas o padrão existe na codebase e é importado desta forma em outros lugares).

> **Nota sobre toast no step-card:** `step-card.svelte` atualmente não importa toast utils. A Task 3 Step 1 já inclui esse import.
