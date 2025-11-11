<!--
  Reusable service form component with validation
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    FieldGroup, 
    Field, 
    FieldLabel, 
    FieldError 
  } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
  // Using native textarea instead of shadcn component
  import { serviceSchema, validateForm, getFieldError } from '$lib/utils/validation.js';
  import { useServiceCategories } from '$lib/hooks/queries/use-services.svelte.js';
  import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
  import type { Service, CreateServiceDto, UpdateServiceDto, ServiceStatus, ServicePriority } from '$lib/api/types/service.types.js';

  const dispatch = createEventDispatcher<{
    submit: { data: CreateServiceDto | UpdateServiceDto };
    cancel: void;
  }>();

  let {
    service = null,
    isLoading = false,
    submitText = 'Salvar',
    cancelText = 'Cancelar',
    showCancel = true,
  }: {
    service?: Service | null;
    isLoading?: boolean;
    submitText?: string;
    cancelText?: string;
    showCancel?: boolean;
  } = $props();

  // Fetch data for dropdowns
  const { data: categories } = useServiceCategories();
  const { data: clients } = useClients();

  // Form state
  let formData = $state({
    title: service?.title || '',
    description: service?.description || '',
    categoryId: service?.category?.id || 0,
    clientId: service?.client?.id || 0,
    assignedToId: service?.assignedTo?.id || 0,
    clientCopyMachineId: service?.clientCopyMachineId || 0,
    scheduledDate: service?.scheduledDate || '',
    estimatedDuration: service?.estimatedDuration || 0,
    notes: service?.notes || '',
    priority: service?.priority || ServicePriority.MEDIUM,
  });

  let errors = $state<Record<string, string>>({});

  // Priority options
  const priorityOptions = [
    { value: ServicePriority.LOW, label: 'Baixa' },
    { value: ServicePriority.MEDIUM, label: 'Média' },
    { value: ServicePriority.HIGH, label: 'Alta' },
    { value: ServicePriority.URGENT, label: 'Urgente' },
  ];

  const getCategoryLabel = (id: number) =>
    id ? (categories || []).find((category) => category.id === id)?.name || 'Selecione uma categoria' : 'Selecione uma categoria';

  const getClientLabel = (id: number) =>
    id ? (clients || []).find((client) => client.id === id)?.name || 'Selecione um cliente' : 'Selecione um cliente';

  const getPriorityLabel = (priority: ServicePriority) =>
    priorityOptions.find((option) => option.value === priority)?.label || 'Selecione a prioridade';

  const getAssignedLabel = (id: number) =>
    id ? `Responsável #${id}` : 'Selecione um responsável';

  function handleSubmit(event: Event) {
    event.preventDefault();
    
    // Clear previous errors
    errors = {};

    // Validate form
    const validation = validateForm(serviceSchema, formData);
    if (!validation.success) {
      errors = validation.errors;
      return;
    }

    // Dispatch submit event
    dispatch('submit', { data: formData });
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <FieldGroup>
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field>
        <FieldLabel for="title">Título *</FieldLabel>
        <Input
          id="title"
          bind:value={formData.title}
          placeholder="Título do serviço"
          class={getFieldError(errors, 'title') ? 'border-red-500' : ''}
          required
        />
        {#if getFieldError(errors, 'title')}
          <FieldError>{getFieldError(errors, 'title')}</FieldError>
        {/if}
      </Field>

      <Field>
        <FieldLabel for="categoryId">Categoria *</FieldLabel>
        <Select bind:value={formData.categoryId}>
          <SelectTrigger class={getFieldError(errors, 'categoryId') ? 'border-red-500' : ''}>
            <span class="block text-left text-sm">
              {getCategoryLabel(formData.categoryId)}
            </span>
          </SelectTrigger>
          <SelectContent>
            {#each categories || [] as category}
              <SelectItem value={category.id}>{category.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
        {#if getFieldError(errors, 'categoryId')}
          <FieldError>{getFieldError(errors, 'categoryId')}</FieldError>
        {/if}
      </Field>
    </div>

    <Field>
      <FieldLabel for="description">Descrição</FieldLabel>
      <textarea
        id="description"
        bind:value={formData.description}
        placeholder="Descrição do serviço"
        class="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {getFieldError(errors, 'description') ? 'border-red-500' : ''}"
      ></textarea>
      {#if getFieldError(errors, 'description')}
        <FieldError>{getFieldError(errors, 'description')}</FieldError>
      {/if}
    </Field>

    <!-- Client and Assignment -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field>
        <FieldLabel for="clientId">Cliente *</FieldLabel>
        <Select bind:value={formData.clientId}>
          <SelectTrigger class={getFieldError(errors, 'clientId') ? 'border-red-500' : ''}>
            <span class="block text-left text-sm">
              {getClientLabel(formData.clientId)}
            </span>
          </SelectTrigger>
          <SelectContent>
            {#each clients || [] as client}
              <SelectItem value={client.id}>{client.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
        {#if getFieldError(errors, 'clientId')}
          <FieldError>{getFieldError(errors, 'clientId')}</FieldError>
        {/if}
      </Field>

      <Field>
        <FieldLabel for="assignedToId">Responsável</FieldLabel>
        <Select bind:value={formData.assignedToId}>
          <SelectTrigger>
            <span class="block text-left text-sm">
              {getAssignedLabel(formData.assignedToId)}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={0}>Não atribuído</SelectItem>
            <!-- TODO: Add users list when available -->
          </SelectContent>
        </Select>
      </Field>
    </div>

    <!-- Scheduling -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field>
        <FieldLabel for="scheduledDate">Data Agendada</FieldLabel>
        <Input
          id="scheduledDate"
          type="datetime-local"
          bind:value={formData.scheduledDate}
          class={getFieldError(errors, 'scheduledDate') ? 'border-red-500' : ''}
        />
        {#if getFieldError(errors, 'scheduledDate')}
          <FieldError>{getFieldError(errors, 'scheduledDate')}</FieldError>
        {/if}
      </Field>

      <Field>
        <FieldLabel for="estimatedDuration">Duração Estimada (min)</FieldLabel>
        <Input
          id="estimatedDuration"
          type="number"
          bind:value={formData.estimatedDuration}
          placeholder="60"
          min="1"
          class={getFieldError(errors, 'estimatedDuration') ? 'border-red-500' : ''}
        />
        {#if getFieldError(errors, 'estimatedDuration')}
          <FieldError>{getFieldError(errors, 'estimatedDuration')}</FieldError>
        {/if}
      </Field>
    </div>

    <!-- Priority -->
    <Field>
      <FieldLabel for="priority">Prioridade</FieldLabel>
      <Select bind:value={formData.priority}>
        <SelectTrigger class={getFieldError(errors, 'priority') ? 'border-red-500' : ''}>
          <span class="block text-left text-sm">
            {getPriorityLabel(formData.priority)}
          </span>
        </SelectTrigger>
        <SelectContent>
          {#each priorityOptions as option}
            <SelectItem value={option.value}>{option.label}</SelectItem>
          {/each}
        </SelectContent>
      </Select>
      {#if getFieldError(errors, 'priority')}
        <FieldError>{getFieldError(errors, 'priority')}</FieldError>
      {/if}
    </Field>

    <!-- Notes -->
    <Field>
      <FieldLabel for="notes">Observações</FieldLabel>
      <Textarea
        id="notes"
        bind:value={formData.notes}
        placeholder="Observações adicionais sobre o serviço"
        class={getFieldError(errors, 'notes') ? 'border-red-500' : ''}
      />
      {#if getFieldError(errors, 'notes')}
        <FieldError>{getFieldError(errors, 'notes')}</FieldError>
      {/if}
    </Field>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4">
      {#if showCancel}
        <Button type="button" variant="outline" onclick={handleCancel}>
          {cancelText}
        </Button>
      {/if}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : submitText}
      </Button>
    </div>
  </FieldGroup>
</form>
