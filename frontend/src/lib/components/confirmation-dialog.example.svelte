<!--
	Example usage of ConfirmationDialog component
	
	This file shows different ways to use the ConfirmationDialog component
	in various scenarios throughout your application.
-->

<script lang="ts">
	import ConfirmationDialog from './confirmation-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	// Example 1: Delete confirmation
	let showDeleteDialog = $state(false);
	let itemToDelete = $state<{ id: number; name: string } | null>(null);

	function openDeleteDialog(id: number, name: string) {
		itemToDelete = { id, name };
		showDeleteDialog = true;
	}

	async function handleDelete() {
		if (!itemToDelete) return;
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		console.log('Deleted item:', itemToDelete);
		
		// Close dialog
		showDeleteDialog = false;
		itemToDelete = null;
	}

	// Example 2: Warning confirmation
	let showWarningDialog = $state(false);

	function openWarningDialog() {
		showWarningDialog = true;
	}

	async function handleWarningAction() {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1500));
		console.log('Warning action executed');
		
		showWarningDialog = false;
	}

	// Example 3: Info confirmation
	let showInfoDialog = $state(false);

	function openInfoDialog() {
		showInfoDialog = true;
	}

	async function handleInfoAction() {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 800));
		console.log('Info action executed');
		
		showInfoDialog = false;
	}
</script>

<div class="space-y-4 p-6">
	<h2 class="text-2xl font-bold">ConfirmationDialog Examples</h2>
	
	<div class="space-y-2">
		<h3 class="text-lg font-semibold">Delete Confirmation (Destructive)</h3>
		<Button 
			variant="destructive" 
			onclick={() => openDeleteDialog(1, 'Sample Item')}
		>
			Delete Item
		</Button>
	</div>

	<div class="space-y-2">
		<h3 class="text-lg font-semibold">Warning Confirmation</h3>
		<Button 
			variant="outline" 
			onclick={openWarningDialog}
		>
			Show Warning
		</Button>
	</div>

	<div class="space-y-2">
		<h3 class="text-lg font-semibold">Info Confirmation</h3>
		<Button 
			variant="outline" 
			onclick={openInfoDialog}
		>
			Show Info
		</Button>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Excluir Item"
	description="Tem certeza que deseja excluir '{itemToDelete?.name}'? Esta ação não pode ser desfeita."
	confirmText="Excluir"
	cancelText="Cancelar"
	variant="destructive"
	icon="trash"
	onConfirm={handleDelete}
	onCancel={() => showDeleteDialog = false}
/>

<!-- Warning Confirmation Dialog -->
<ConfirmationDialog
	bind:open={showWarningDialog}
	title="Atenção"
	description="Esta ação pode afetar outros usuários. Deseja continuar?"
	confirmText="Continuar"
	cancelText="Cancelar"
	variant="warning"
	icon="warning"
	onConfirm={handleWarningAction}
	onCancel={() => showWarningDialog = false}
/>

<!-- Info Confirmation Dialog -->
<ConfirmationDialog
	bind:open={showInfoDialog}
	title="Confirmar Ação"
	description="Esta ação irá processar os dados selecionados. Confirma?"
	confirmText="Confirmar"
	cancelText="Cancelar"
	variant="info"
	icon="info"
	onConfirm={handleInfoAction}
	onCancel={() => showInfoDialog = false}
/>
