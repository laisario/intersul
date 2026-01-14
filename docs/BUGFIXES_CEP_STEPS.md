# Correções de Bugs - CEP e Associação de Responsável

## Resumo das Correções

Este documento descreve as correções aplicadas para três bugs críticos:
1. **BUG 1**: Formulário de endereço por CEP - exibição de campos
2. **BUG 2**: Responsável não associado em steps de serviço
3. **BUG 3**: Responsável não associado em fechamentos

---

## BUG 1 - Formulário de Endereço por CEP

### Causa Raiz
O formulário de endereço estava exibindo todos os campos (rua, número, complemento) desde o início, antes mesmo do usuário tentar buscar o CEP. Não havia controle de estado para mostrar/esconder campos baseado na tentativa de busca de CEP.

### Correções Aplicadas

**Arquivo**: `frontend/src/lib/components/address-form.svelte`

1. **Adicionados estados de controle**:
   - `hasTriedCepLookup`: indica se o usuário já tentou buscar o CEP
   - `cepLookupResult`: armazena o resultado da busca ('success', 'error', ou null)

2. **Lógica de exibição condicional**:
   - Campos de rua, número e complemento só aparecem após `hasTriedCepLookup = true`
   - Campos de localização (país, estado, cidade, bairro) só aparecem após busca bem-sucedida
   - Em caso de erro na busca, os campos de endereço aparecem para preenchimento manual

3. **Melhorias na função `handleSearchCep()`**:
   - Atualiza `hasTriedCepLookup` e `cepLookupResult` adequadamente
   - Mensagens de erro mais claras quando CEP não é encontrado

### Mudanças no Código

```svelte
// Estados adicionados
let hasTriedCepLookup = $state(false);
let cepLookupResult = $state<'success' | 'error' | null>(null);

// Exibição condicional
{#if hasTriedCepLookup}
  <!-- Campos de rua, número, complemento -->
{/if}
```

---

## BUG 2 - Responsável não Associado em Steps de Serviço

### Causa Raiz
Ao criar ou atualizar um serviço com steps, o campo `responsable_id` estava sendo passado no DTO, mas não estava sendo mapeado corretamente na criação da entidade Step. O uso de spread operator (`...step`) não garantia que o `responsable_id` fosse persistido corretamente no banco de dados.

### Correções Aplicadas

**Arquivo**: `backend/src/modules/services/service/services.ts`

1. **Método `create()`** (linhas 159-180):
   - Substituído o uso de spread operator por mapeamento explícito de campos
   - Garantido que `responsable_id` seja incluído quando fornecido
   - Validação de campos opcionais antes de incluir no stepData

2. **Método `update()`** (linhas 197-203):
   - Aplicada a mesma correção para garantir consistência
   - Mapeamento explícito de todos os campos, incluindo `responsable_id`

### Mudanças no Código

```typescript
// ANTES
const stepEntities = steps.map(step => this.stepsRepository.create({
  ...step,
  service_id: savedService.id,
}));

// DEPOIS
const stepEntities = steps.map(step => {
  const stepData: any = {
    name: step.name,
    description: step.description,
    service_id: savedService.id,
  };
  
  if (step.responsable_id !== undefined && step.responsable_id !== null) {
    stepData.responsable_id = step.responsable_id;
  }
  
  // ... outros campos opcionais
  
  return this.stepsRepository.create(stepData);
});
```

---

## BUG 3 - Responsável não Associado em Fechamentos

### Causa Raiz
Ao gerar fechamentos (billings), o campo `responsible_user_id` estava sendo passado no mapeamento de máquinas, mas não estava sendo validado antes de criar o step. Além disso, não havia garantia de que o usuário existia antes de associar ao step.

### Correções Aplicadas

**Arquivo**: `backend/src/modules/billings/billings.service.ts`

1. **Método `generateByCity()`** (linhas 564-580):
   - Adicionada validação do usuário responsável antes de criar o step
   - Verificação se o usuário existe no banco de dados
   - Erro claro se o usuário não for encontrado
   - Associação explícita do `responsable_id` ao step

### Mudanças no Código

```typescript
// ANTES
const stepData: any = {
  name: `fechamento – ${client.name} – ${cityName}`,
  description: stepDescription,
  service_id: savedService.id,
  responsable_id: machineMapping.responsible_user_id,
  is_billing: true,
  status: StepStatus.PENDING,
};

// DEPOIS
const stepData: any = {
  name: `fechamento – ${client.name} – ${cityName}`,
  description: stepDescription,
  service_id: savedService.id,
  is_billing: true,
  status: StepStatus.PENDING,
};

// Validate and assign responsable_id if provided
if (machineMapping.responsible_user_id) {
  const responsableUser = await this.usersRepository.findOne({
    where: { id: machineMapping.responsible_user_id },
  });
  if (!responsableUser) {
    throw new BadRequestException(`User with ID ${machineMapping.responsible_user_id} not found`);
  }
  stepData.responsable_id = machineMapping.responsible_user_id;
}
```

---

## Checklist de Teste Manual

### BUG 1 - Teste do Formulário de CEP

#### Teste 1: Estado Inicial
- [ ] Abrir formulário de cadastro/edição de cliente
- [ ] Verificar que apenas o campo CEP está visível
- [ ] Verificar que campos rua, número e complemento NÃO estão visíveis
- [ ] Verificar que botão de busca está presente

#### Teste 2: Busca de CEP Válida
- [ ] Digitar CEP válido (ex: 01310-100)
- [ ] Clicar no botão de busca
- [ ] Verificar loading durante busca
- [ ] Verificar que após busca bem-sucedida:
  - [ ] Campos de localização aparecem (país, estado, cidade, bairro) preenchidos
  - [ ] Campo "Rua" aparece e está preenchido
  - [ ] Campos "Número" e "Complemento" aparecem (vazios, para preenchimento)
  - [ ] Mensagem de sucesso é exibida

#### Teste 3: Busca de CEP Inválido
- [ ] Digitar CEP inválido ou não existente (ex: 00000-000)
- [ ] Clicar no botão de busca
- [ ] Verificar que após erro:
  - [ ] Mensagem de erro é exibida
  - [ ] Campos rua, número e complemento aparecem para preenchimento manual
  - [ ] Campos de localização NÃO aparecem

#### Teste 4: CEP Incompleto
- [ ] Digitar CEP com menos de 8 dígitos (ex: 01310)
- [ ] Clicar no botão de busca
- [ ] Verificar que mensagem de erro é exibida
- [ ] Verificar que campos não aparecem

#### Teste 5: Formatação de CEP
- [ ] Digitar CEP sem hífen (ex: 01310100)
- [ ] Verificar que CEP é formatado automaticamente (01310-100)
- [ ] Buscar CEP e verificar que funciona corretamente

#### Teste 6: Salvamento
- [ ] Buscar CEP válido
- [ ] Preencher número e complemento
- [ ] Salvar cliente
- [ ] Verificar que endereço foi salvo corretamente no banco de dados

---

### BUG 2 - Teste de Steps com Responsável

#### Teste 1: Criar Serviço com Step e Responsável
- [ ] Acessar tela de criação de serviço
- [ ] Preencher dados básicos do serviço
- [ ] Adicionar step manualmente
- [ ] Preencher nome e descrição do step
- [ ] Selecionar um responsável no campo "Responsável"
- [ ] Salvar serviço
- [ ] Verificar no banco de dados que o step foi criado com `responsable_id` correto
- [ ] Acessar a lista de "Meus Steps" do responsável selecionado
- [ ] Verificar que o step aparece na lista

#### Teste 2: Editar Serviço e Adicionar Responsável
- [ ] Acessar serviço existente sem responsável nos steps
- [ ] Editar o serviço
- [ ] Adicionar responsável a um step existente
- [ ] Salvar alterações
- [ ] Verificar no banco que `responsable_id` foi atualizado
- [ ] Verificar que step aparece na lista do responsável

#### Teste 3: Trocar Responsável de Step
- [ ] Acessar serviço com step que tem responsável A
- [ ] Editar serviço
- [ ] Trocar responsável do step para responsável B
- [ ] Salvar alterações
- [ ] Verificar que step não aparece mais na lista do responsável A
- [ ] Verificar que step aparece na lista do responsável B

#### Teste 4: Criar Serviço com Múltiplos Steps
- [ ] Criar serviço com 3 steps
- [ ] Atribuir responsáveis diferentes para cada step
- [ ] Salvar serviço
- [ ] Verificar que cada step tem seu `responsable_id` correto no banco
- [ ] Verificar que cada responsável vê apenas seus steps

---

### BUG 3 - Teste de Fechamento com Responsável

#### Teste 1: Gerar Fechamento por Cidade
- [ ] Acessar tela de fechamentos
- [ ] Clicar em "Gerar Fechamento por Cidade"
- [ ] Selecionar uma cidade
- [ ] Para cada máquina alugada do cliente:
  - [ ] Selecionar um responsável no campo "Usuário Responsável"
  - [ ] (Opcional) Preencher data de expiração
  - [ ] (Opcional) Selecionar forma de pagamento
- [ ] Confirmar criação
- [ ] Verificar que fechamentos foram criados
- [ ] Verificar no banco de dados que cada step de fechamento tem `responsable_id` correto
- [ ] Acessar lista de "Meus Steps" de cada responsável
- [ ] Verificar que os steps de fechamento aparecem para cada responsável

#### Teste 2: Fechamento com Boleto
- [ ] Gerar fechamento selecionando "Boleto" como forma de pagamento
- [ ] Preencher responsável pelo serviço de boleto (deve ser MANAGER)
- [ ] Preencher data de expiração do serviço de boleto
- [ ] Confirmar criação
- [ ] Verificar que:
  - [ ] Step de fechamento tem o responsável correto
  - [ ] Serviço de boleto foi criado com os 3 steps
  - [ ] Steps do serviço de boleto têm o responsável correto

#### Teste 3: Múltiplos Clientes na Mesma Cidade
- [ ] Gerar fechamento para cidade com múltiplos clientes
- [ ] Atribuir responsáveis diferentes para máquinas de clientes diferentes
- [ ] Confirmar criação
- [ ] Verificar que cada step tem o `responsable_id` correto
- [ ] Verificar que cada responsável vê apenas seus steps

#### Teste 4: Validação de Usuário Inválido
- [ ] Tentar gerar fechamento com ID de usuário inexistente (manipular requisição)
- [ ] Verificar que erro é retornado: "User with ID X not found"
- [ ] Verificar que nenhum fechamento foi criado

---

## Testes Automatizados (Sugestão)

### Teste 1: CEP - Estados de Exibição

```typescript
describe('AddressForm - CEP Lookup', () => {
  it('should only show CEP field initially', () => {
    // Verificar que apenas CEP está visível
  });

  it('should show address fields after successful CEP lookup', async () => {
    // Mock ViaCEP API success
    // Verificar que campos aparecem e rua está preenchida
  });

  it('should show address fields for manual entry after failed CEP lookup', async () => {
    // Mock ViaCEP API error
    // Verificar que campos aparecem vazios para preenchimento manual
  });

  it('should not trigger lookup for incomplete CEP', () => {
    // Verificar que busca não é disparada para CEP com menos de 8 dígitos
  });
});
```

### Teste 2: Step - Persistência do Responsável

```typescript
describe('Service Steps - Responsible User', () => {
  it('should save responsable_id when creating service with steps', async () => {
    const serviceData = {
      client_id: 1,
      category_id: 1,
      steps: [{
        name: 'Step 1',
        description: 'Description',
        responsable_id: 5
      }]
    };
    
    const service = await servicesService.create(serviceData);
    const step = await stepsRepository.findOne({
      where: { service_id: service.id }
    });
    
    expect(step.responsable_id).toBe(5);
  });

  it('should filter steps by responsable_id in my-steps endpoint', async () => {
    // Criar steps com diferentes responsáveis
    // Buscar steps do usuário 5
    // Verificar que apenas steps do usuário 5 são retornados
  });
});
```

### Teste 3: Billing - Responsável em Fechamento

```typescript
describe('Billing Generation - Responsible User', () => {
  it('should save responsable_id when generating billings', async () => {
    const generateDto = {
      city_id: 1,
      machines: [{
        copy_machine_id: 1,
        responsible_user_id: 5
      }]
    };
    
    const result = await billingsService.generateByCity(generateDto);
    const step = result.steps[0];
    
    expect(step.responsable_id).toBe(5);
  });

  it('should throw error if responsible user does not exist', async () => {
    const generateDto = {
      city_id: 1,
      machines: [{
        copy_machine_id: 1,
        responsible_user_id: 99999 // Non-existent user
      }]
    };
    
    await expect(
      billingsService.generateByCity(generateDto)
    ).rejects.toThrow('User with ID 99999 not found');
  });
});
```

---

## Arquivos Modificados

1. `frontend/src/lib/components/address-form.svelte`
   - Adicionados estados de controle de exibição
   - Lógica condicional para mostrar/esconder campos

2. `backend/src/modules/services/service/services.ts`
   - Método `create()`: mapeamento explícito de campos do step
   - Método `update()`: mapeamento explícito de campos do step

3. `backend/src/modules/billings/billings.service.ts`
   - Método `generateByCity()`: validação e associação explícita do responsable_id

---

## Observações Importantes

1. **Compatibilidade**: As correções mantêm compatibilidade com código existente
2. **Validação**: Adicionadas validações para garantir integridade dos dados
3. **Mensagens de Erro**: Mensagens mais claras para facilitar debugging
4. **Performance**: Validações adicionais não impactam significativamente a performance

---

## Próximos Passos (Opcional)

1. Adicionar testes automatizados completos
2. Implementar cache para buscas de CEP frequentes
3. Adicionar validação de CEP no frontend antes de enviar ao backend
4. Considerar adicionar logs para rastreamento de associações de responsáveis
