# Step Detail Page Improvements — Design Spec

**Date:** 2026-04-20  
**Scope:** Página de detalhes da etapa + visão mobile (home page)

---

## Contexto

Hoje:
- Página de detalhes (`/steps/[id]`) tem form inline (observação, responsável, fotos), sem checklist visível.
- `StepFormDialog` existe e é usado no mobile via home page, mas **não tem upload de fotos**.
- `StepCard` (mobile) tem checklist expansível mas **não inicia a etapa automaticamente** ao marcar.
- Dois caminhos de edição divergentes (desktop inline, mobile dialog) com comportamento diferente.

Objetivo: unificar e completar a experiência.

---

## Arquitetura das Mudanças

### 1. `step-form-dialog.svelte` — Adicionar upload de imagens

**O que muda:**
- Adicionar `StepImagesUpload` dentro do dialog, abaixo dos campos observation/responsableClient.
- O dialog consulta suas próprias imagens via `useStepImages(step.id)` internamente.
- Invalidação das queries de imagem acontece dentro do dialog (já segue o padrão `queryClient.invalidateQueries`).

**Props que permanecem iguais** (nenhuma mudança de interface com o exterior):
```ts
{ step: Step; open: boolean; onSuccess: () => void }
```

**Resultado:** Dialog passa a ser completo — observação + responsável + fotos — tanto no desktop quanto no mobile.

### 2. `/steps/[id]/+page.svelte` — Checklist + Dialog button + auto-start

**Remoção:**
- Remove o modo de edição inline (edit mode / preview mode toggle) do card "Step Info".
- Remove os campos de textarea, input e `StepImagesUpload` expostos diretamente no card.

**Adições ao card "Step Info":**

_Seção de informações (read-only preview):_
- Observação (texto ou placeholder "Nenhuma observação")
- Responsável no cliente (texto ou placeholder)
- Grid de imagens em read-only (click para preview)
- Botão "Preencher informações" → abre `StepFormDialog` (visível apenas se IN_PROGRESS && isResponsable)

_Seção de checklist (separador visual dentro do mesmo card):_
- Título "Checklist" com contador `(X/Y concluídos)`
- Lista de checkboxes interativos
- Quando step é PENDING e um item é marcado → chama `startStep` automaticamente antes de `toggleChecklist`
- Se step já é IN_PROGRESS, CONCLUDED ou CANCELLED → sem efeito no status

**Queries adicionadas:**
- `useStepChecklists(stepId)` para listar checklists

**Mutations adicionadas:**
- `useToggleChecklist()` (já existe no hook file, só importar)
- `useStartStep()` (já importado, adicionar handler)

**State adicionado:**
- `showFormDialog = $state(false)` — controla `StepFormDialog`

### 3. `step-card.svelte` — Auto-start em checklist PENDING

**O que muda:**
- Importar `useStartStep`.
- Em `handleToggleChecklist`: se `step?.status === 'PENDING'`, chamar `startStep(step.id)` antes do `toggleChecklist`.
- Toast de feedback: "Etapa iniciada automaticamente" (usar `successToast` do sistema).

**Regra de negócio:**
- Status `PENDING` → auto-start + toggle.
- Status `IN_PROGRESS` → só toggle.
- Status `CONCLUDED` / `CANCELLED` → cheklist fica read-only (não interativo — já controlado pelo template via `isActionable`).

---

## Fluxo de Dados

```
[Step Detail Page]
  useStep(id)              → step data
  useStepImages(id)        → images (for read-only preview in card)
  useStepChecklists(id)    → checklists
  useToggleChecklist()     → toggle item
  useStartStep()           → auto-start quando PENDING
  ↓
  StepFormDialog (open=showFormDialog)
    step prop              → step data
    useStepImages(step.id) → images (internal query)
    useUpdateStep()        → salva observation + responsableClient
    StepImagesUpload       → upload/delete images

[Home Page Mobile]
  StepCard
    step.checklists        → checklist items (from step object)
    useToggleChecklist()   → toggle item
    useStartStep()         → auto-start quando PENDING
    onFillForm callback    → abre StepFormDialog no pai
  ↓
  StepFormDialog (mesmo componente, agora com fotos)
```

---

## Regras de Negócio Preservadas

- Form só habilitado quando `status === 'IN_PROGRESS'` — o `StepFormDialog` já respeita isso via `isFormEnabled`.
- Apenas o responsável da etapa pode editar — verificação via `isResponsable` mantida.
- Auto-start só ocorre quando `status === 'PENDING'` — não executa em outros estados.
- Não duplicar lógica de billing: a seção de billing permanece separada e intacta.

---

## Arquivos Alterados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/lib/components/step-form-dialog.svelte` | Modificar | Adicionar StepImagesUpload + useStepImages interno |
| `src/routes/(protected)/steps/[id]/+page.svelte` | Modificar | Checklist + dialog button + remover form inline |
| `src/lib/components/step-card.svelte` | Modificar | Auto-start quando checklist toggled em PENDING |

Sem novos arquivos. Sem alterações de API. Sem alterações de tipos.

---

## Decisões Técnicas

1. **Images no dialog via query interna**: O dialog chama `useStepImages(step.id)` internamente em vez de receber imagens como prop. Isso mantém a interface simples e o dialog autossuficiente (DRY).

2. **Auto-start sem modal de confirmação**: Ao marcar um item do checklist numa etapa PENDING, a etapa inicia automaticamente (sem prompt). Isso é menos interruptivo e o usuário já tomou uma ação intencional.

3. **Read-only preview no card de detalhes**: Em vez de toggle edit/preview, o card sempre mostra os dados em modo leitura. A edição vai para o dialog. Isso simplifica o estado da página e elimina o `isEditMode` / `isBillingEditMode` dos campos de info (o billing permanece com seu próprio edit mode intacto).

4. **Sem refactor do billing**: O card de billing continua idêntico — o objetivo é só mover o form de info (observation, responsableClient, images) para o dialog, sem tocar na lógica de fechamento.

5. **Nenhuma mudança de interface externa**: `StepFormDialog` mantém as mesmas props públicas, portanto a home page não precisa de alteração além de receber o benefício das fotos automaticamente.
