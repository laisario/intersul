<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { useClients } from '$lib/hooks/queries/use-clients.svelte.js';
	import { useClientCopyMachines } from '$lib/hooks/queries/use-copy-machines.svelte.js';
	import { useUsers } from '$lib/hooks/queries/use-users.svelte.js';
	import { AcquisitionType } from '$lib/api/types/copy-machine.types.js';
	import type { MachineUserMapping } from '$lib/api/types/billing.types.js';
	import type { ClientCopyMachine } from '$lib/api/types/copy-machine.types.js';
	import { Loader2 } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils/formatting.js';

	interface Props {
		open: boolean;
		cityId: number;
		onConfirm: (machines: MachineUserMapping[]) => void;
		onCancel: () => void;
	}

	let { open = $bindable(false), cityId, onConfirm, onCancel }: Props = $props();

	const clientsQuery = useClients();
	const usersQuery = useUsers();
	const clients = $derived(clientsQuery.data ?? []);
	const users = $derived(usersQuery.data?.filter((u) => u.active) ?? []);
	const managerUsers = $derived(users.filter((u) => u.role === 'MANAGER'));

	// Filter clients by city
	const cityClients = $derived(
		clients.filter((client) => client.address?.neighborhood?.city?.id === cityId && client.active)
	);

	let machineUserMap = $state<Map<number, number>>(new Map());
	let machineExpirationMap = $state<Map<number, string>>(new Map());
	let machinePaymentMethodMap = $state<Map<number, string>>(new Map());
	let machineBoletoServiceUserMap = $state<Map<number, number>>(new Map());
	let machineBoletoServiceExpirationMap = $state<Map<number, string>>(new Map());

	$effect(() => {
		if (!open) {
			machineUserMap.clear();
			machineExpirationMap.clear();
			machinePaymentMethodMap.clear();
			machineBoletoServiceUserMap.clear();
			machineBoletoServiceExpirationMap.clear();
		}
	});

	// Get machine model name
	function getMachineModel(machine: ClientCopyMachine): string {
		return (
			machine.catalogCopyMachine?.model ||
			machine.external_model ||
			`${machine.external_manufacturer || ''} ${machine.external_model || ''}`.trim() ||
			'Machine'
		);
	}

	// Get last counter for machine
	function getLastCounter(machine: ClientCopyMachine): number | null {
		return machine.ultimo_contador ?? null;
	}

	// Calculate suggested price (franchise quantity * unit price)
	function getSuggestedPrice(machine: ClientCopyMachine): number | null {
		if (!machine.franchise) return null;
		const quantity = machine.franchise.quantity ?? 0;
		// Handle both camelCase (unitPrice) and snake_case (unit_price) from API
		const unitPrice = (machine.franchise as any).unitPrice ?? (machine.franchise as any).unit_price ?? 0;
		if (!quantity || !unitPrice) return null;
		return quantity * unitPrice;
	}

	function handleConfirm() {
		const machines: MachineUserMapping[] = [];
		machineUserMap.forEach((userId, machineId) => {
			if (userId) {
				const expirationDate = machineExpirationMap.get(machineId);
				const paymentMethod = machinePaymentMethodMap.get(machineId);
				const boletoServiceUserId = machineBoletoServiceUserMap.get(machineId);
				const boletoServiceExpiration = machineBoletoServiceExpirationMap.get(machineId);
				machines.push({
					copy_machine_id: machineId,
					responsible_user_id: userId,
					datetime_expiration: expirationDate || undefined,
					payment_method: paymentMethod || undefined,
					boleto_service_responsible_user_id: boletoServiceUserId || undefined,
					boleto_service_expiration_date: boletoServiceExpiration || undefined,
				});
			}
		});

		if (machines.length === 0) {
			return;
		}

		onConfirm(machines);
		machineUserMap.clear();
		machineExpirationMap.clear();
		machinePaymentMethodMap.clear();
		machineBoletoServiceUserMap.clear();
		machineBoletoServiceExpirationMap.clear();
	}

	function handleCancel() {
		machineUserMap.clear();
		machineExpirationMap.clear();
		machinePaymentMethodMap.clear();
		machineBoletoServiceUserMap.clear();
		machineBoletoServiceExpirationMap.clear();
		onCancel();
	}

	// Format date for input (dd/mm/yyyy)
	function formatDateForInput(dateString: string | null | undefined): string {
		if (!dateString) return '';
		try {
			const date = new Date(dateString);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			return `${day}/${month}/${year}`;
		} catch {
			return '';
		}
	}

	// Convert date input (dd/mm/yyyy) to ISO string
	function handleDateChange(machineId: number, value: string) {
		// Remove all non-digit characters
		let digits = value.replace(/\D/g, '');
		
		// Limit to 8 digits (ddmmyyyy)
		if (digits.length > 8) {
			digits = digits.slice(0, 8);
		}
		
		// Format as dd/mm/yyyy
		let formatted = digits;
		if (digits.length > 2) {
			formatted = digits.slice(0, 2) + '/' + digits.slice(2);
		}
		if (digits.length > 4) {
			formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
		}
		
		// Update the input value
		const inputElement = document.getElementById(`expiration-${machineId}`) as HTMLInputElement;
		if (inputElement) {
			inputElement.value = formatted;
		}
		
		// Parse and convert to ISO string when complete (8 digits)
		if (digits.length === 8) {
			const day = parseInt(digits.slice(0, 2), 10);
			const month = parseInt(digits.slice(2, 4), 10) - 1; // Month is 0-indexed
			const year = parseInt(digits.slice(4, 8), 10);
			
			// Validate date
			if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
				const date = new Date(year, month, day);
				// Validate the date is valid (e.g., not 31/02)
				if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
					date.setHours(23, 59, 59, 999);
					machineExpirationMap.set(machineId, date.toISOString());
					// Reassign to trigger reactivity
					machineExpirationMap = new Map(machineExpirationMap);
					return;
				}
			}
		}
		
		// If incomplete or invalid, remove from map
		if (digits.length === 0) {
			machineExpirationMap.delete(machineId);
			// Reassign to trigger reactivity
			machineExpirationMap = new Map(machineExpirationMap);
		}
	}

	// Convert boleto service date input (dd/mm/yyyy) to ISO string
	function handleBoletoServiceDateChange(machineId: number, value: string) {
		// Remove all non-digit characters
		let digits = value.replace(/\D/g, '');
		
		// Limit to 8 digits (ddmmyyyy)
		if (digits.length > 8) {
			digits = digits.slice(0, 8);
		}
		
		// Format as dd/mm/yyyy
		let formatted = digits;
		if (digits.length > 2) {
			formatted = digits.slice(0, 2) + '/' + digits.slice(2);
		}
		if (digits.length > 4) {
			formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
		}
		
		// Update the input value
		const inputElement = document.getElementById(`boleto-service-expiration-${machineId}`) as HTMLInputElement;
		if (inputElement) {
			inputElement.value = formatted;
		}
		
		// Parse and convert to ISO string when complete (8 digits)
		if (digits.length === 8) {
			const day = parseInt(digits.slice(0, 2), 10);
			const month = parseInt(digits.slice(2, 4), 10) - 1; // Month is 0-indexed
			const year = parseInt(digits.slice(4, 8), 10);
			
			// Validate date
			if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
				const date = new Date(year, month, day);
				// Validate the date is valid (e.g., not 31/02)
				if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
					date.setHours(23, 59, 59, 999);
					machineBoletoServiceExpirationMap.set(machineId, date.toISOString());
					// Reassign to trigger reactivity
					machineBoletoServiceExpirationMap = new Map(machineBoletoServiceExpirationMap);
					return;
				}
			}
		}
		
		// If incomplete or invalid, remove from map
		if (digits.length === 0) {
			machineBoletoServiceExpirationMap.delete(machineId);
			// Reassign to trigger reactivity
			machineBoletoServiceExpirationMap = new Map(machineBoletoServiceExpirationMap);
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Selecionar Responsáveis</DialogTitle>
			<DialogDescription>
				Selecione um usuário responsável para cada máquina ALUGADA. Os fechamentos, serviços e etapas serão criados automaticamente.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6 py-4">
			{#if clientsQuery.isLoading}
				<div class="space-y-4">
					{#each Array(3) as _}
						<Skeleton class="h-32 w-full" />
					{/each}
				</div>
			{:else if cityClients.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					<p>Nenhum cliente ativo encontrado nesta cidade.</p>
				</div>
			{:else}
				{#each cityClients as client (client.id)}
					{@const clientMachinesQuery = useClientCopyMachines(client.id)}
					{@const clientMachines = clientMachinesQuery?.data ?? []}
					{@const rentMachines = clientMachines.filter((m) => m.acquisition_type === AcquisitionType.RENT && m.franchise)}

					{#if clientMachinesQuery?.isLoading}
						<Card>
							<CardContent class="p-6">
								<Skeleton class="h-24 w-full" />
							</CardContent>
						</Card>
					{:else if rentMachines.length > 0}
						<Card>
							<CardHeader>
								<CardTitle class="text-lg">{client.name}</CardTitle>
								<p class="text-sm text-muted-foreground">
									Cliente #{client.id}
									{#if client.phone}
										• {client.phone}
									{/if}
								</p>
							</CardHeader>
							<CardContent class="space-y-4">
								{#each rentMachines as machine (machine.id)}
									{@const suggestedPrice = getSuggestedPrice(machine)}
									<div class="border rounded-lg p-4 space-y-3">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="font-medium">{getMachineModel(machine)}</h4>
												<div class="text-sm text-muted-foreground space-y-1 mt-1">
													<p>Franquia: {machine.franchise?.quantity ?? 'N/A'} páginas</p>
													<p>Último contador: {getLastCounter(machine) ?? 'N/A'}</p>
													{#if suggestedPrice !== null}
														<p class="text-primary font-medium">
															Preço sugerido: {formatCurrency(suggestedPrice)}
														</p>
													{/if}
												</div>
											</div>
										</div>
										<div class="space-y-3">
											<div class="space-y-2">
												<Label for="user-{machine.id}">Usuário Responsável *</Label>
												<Select
													type="single"
													value={machineUserMap.get(machine.id)?.toString() || ''}
													onValueChange={(value: string) => {
														if (value) {
															machineUserMap.set(machine.id, parseInt(value));
															// Reassign to trigger reactivity
															machineUserMap = new Map(machineUserMap);
														} else {
															machineUserMap.delete(machine.id);
															// Reassign to trigger reactivity
															machineUserMap = new Map(machineUserMap);
														}
													}}
												>
													<SelectTrigger id="user-{machine.id}">
														{#if !machineUserMap.get(machine.id)}
															<span class="text-muted-foreground">Selecione um usuário</span>
														{:else}
															{users.find((u) => u.id === machineUserMap.get(machine.id))?.name || 'Usuário'}
														{/if}
													</SelectTrigger>
													<SelectContent>
														{#if usersQuery.isLoading}
															<SelectItem value="" disabled>Carregando...</SelectItem>
														{:else if !users.length}
															<SelectItem value="" disabled>Nenhum usuário disponível</SelectItem>
														{:else}
															{#each users as user (user.id)}
																<SelectItem value={user.id.toString()}>{user.name}</SelectItem>
															{/each}
														{/if}
													</SelectContent>
												</Select>
											</div>
											<div class="space-y-2">
												<Label for="expiration-{machine.id}">Data de Expiração</Label>
												<Input
													id="expiration-{machine.id}"
													type="text"
													value={formatDateForInput(machineExpirationMap.get(machine.id))}
													oninput={(e) => handleDateChange(machine.id, e.currentTarget.value)}
													placeholder="dd/mm/aaaa"
													maxlength={10}
												/>
											</div>
											<div class="space-y-2">
												<Label for="payment-method-{machine.id}">Forma de Pagamento</Label>
												<Select
													type="single"
													value={machinePaymentMethodMap.get(machine.id) || ''}
													onValueChange={(value: string) => {
														if (value) {
															machinePaymentMethodMap.set(machine.id, value);
															machinePaymentMethodMap = new Map(machinePaymentMethodMap);
														} else {
															machinePaymentMethodMap.delete(machine.id);
															machinePaymentMethodMap = new Map(machinePaymentMethodMap);
															// Clear boleto-specific fields
															machineBoletoServiceUserMap.delete(machine.id);
															machineBoletoServiceExpirationMap.delete(machine.id);
															machineBoletoServiceUserMap = new Map(machineBoletoServiceUserMap);
															machineBoletoServiceExpirationMap = new Map(machineBoletoServiceExpirationMap);
														}
													}}
												>
													<SelectTrigger id="payment-method-{machine.id}">
														{machinePaymentMethodMap.get(machine.id) 
															? (() => {
																const method = machinePaymentMethodMap.get(machine.id);
																if (method === 'Cash') return 'Dinheiro';
																if (method === 'PIX') return 'PIX';
																if (method === 'Debit Card') return 'Cartão de Débito';
																if (method === 'Credit Card') return 'Cartão de Crédito';
																if (method === 'Bank Slip') return 'Boleto';
																if (method === 'Transfer') return 'Transferência';
																return method || 'Selecione a forma de pagamento';
															})()
															: 'Selecione a forma de pagamento'}
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">Nenhuma</SelectItem>
														<SelectItem value="Cash">Dinheiro</SelectItem>
														<SelectItem value="PIX">PIX</SelectItem>
														<SelectItem value="Debit Card">Cartão de Débito</SelectItem>
														<SelectItem value="Credit Card">Cartão de Crédito</SelectItem>
														<SelectItem value="Bank Slip">Boleto</SelectItem>
														<SelectItem value="Transfer">Transferência</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<!-- Boleto Service Fields: only show when payment method is Boleto -->
											{#if (machinePaymentMethodMap.get(machine.id)?.toLowerCase() === 'bank slip' || machinePaymentMethodMap.get(machine.id)?.toLowerCase() === 'boleto')}
												<div class="border-t pt-4 space-y-3">
													<p class="text-sm font-medium text-muted-foreground">Configurações do Serviço de Boleto</p>
													
													<div class="space-y-2">
														<Label for="boleto-service-user-{machine.id}">Responsável pelo Serviço de Boleto *</Label>
														<Select
															type="single"
															value={machineBoletoServiceUserMap.get(machine.id)?.toString() || ''}
															onValueChange={(value: string) => {
																if (value) {
																	machineBoletoServiceUserMap.set(machine.id, parseInt(value));
																	machineBoletoServiceUserMap = new Map(machineBoletoServiceUserMap);
																} else {
																	machineBoletoServiceUserMap.delete(machine.id);
																	machineBoletoServiceUserMap = new Map(machineBoletoServiceUserMap);
																}
															}}
														>
															<SelectTrigger id="boleto-service-user-{machine.id}">
																{#if !machineBoletoServiceUserMap.get(machine.id)}
																	<span class="text-muted-foreground">Selecione um gerente</span>
																{:else}
																	{managerUsers.find((u) => u.id === machineBoletoServiceUserMap.get(machine.id))?.name || 'Gerente'}
																{/if}
															</SelectTrigger>
															<SelectContent>
																{#if usersQuery.isLoading}
																	<SelectItem value="" disabled>Carregando...</SelectItem>
																{:else if !managerUsers.length}
																	<SelectItem value="" disabled>Nenhum gerente disponível</SelectItem>
																{:else}
																	{#each managerUsers as manager (manager.id)}
																		<SelectItem value={manager.id.toString()}>{manager.name}</SelectItem>
																	{/each}
																{/if}
															</SelectContent>
														</Select>
														<p class="text-xs text-muted-foreground">Apenas usuários com role de Gerente podem ser responsáveis pelo serviço de boleto</p>
													</div>

													<div class="space-y-2">
														<Label for="boleto-service-expiration-{machine.id}">Data de Expiração do Serviço</Label>
														<Input
															id="boleto-service-expiration-{machine.id}"
															type="text"
															value={formatDateForInput(machineBoletoServiceExpirationMap.get(machine.id))}
															oninput={(e) => handleBoletoServiceDateChange(machine.id, e.currentTarget.value)}
															placeholder="dd/mm/aaaa"
															maxlength={10}
														/>
													</div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</CardContent>
						</Card>
					{/if}
				{/each}
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleCancel}>
				Cancelar
			</Button>
			<Button
				onclick={handleConfirm}
				disabled={machineUserMap.size === 0 || clientsQuery.isLoading || usersQuery.isLoading}
			>
				Confirmar e Criar
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

