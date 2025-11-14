<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-svelte';
	import { stepsApi } from '$lib/api/endpoints/steps.js';
	import { env } from '$lib/config/env.js';
	import type { Image } from '$lib/api/types/service.types.js';

	interface Props {
		stepId: number;
		images?: Image[];
		disabled?: boolean;
		onImageUploaded?: () => void;
		onImageDeleted?: () => void;
		onImageClick?: (image: Image) => void;
	}

	let {
		stepId,
		images = [],
		disabled = false,
		onImageUploaded = () => {},
		onImageDeleted = () => {},
		onImageClick = () => {},
	}: Props = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let error = $state('');

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		error = '';
		isUploading = true;

		try {
			// Upload each file
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Validate file type
				if (!file.type.startsWith('image/')) {
					error = `Arquivo "${file.name}" não é uma imagem válida`;
					continue;
				}

				// Validate file size (max 10MB)
				if (file.size > 10 * 1024 * 1024) {
					error = `Arquivo "${file.name}" é muito grande (máx. 10MB)`;
					continue;
				}

				// Upload image using API
				await stepsApi.uploadImage(stepId, file);
			}

			// Clear input
			if (fileInput) {
				fileInput.value = '';
			}

			onImageUploaded();
		} catch (err: any) {
			error = err?.response?.data?.message || err?.message || 'Erro ao fazer upload das imagens';
		} finally {
			isUploading = false;
		}
	}

	async function handleDeleteImage(imageId: number) {
		if (!confirm('Tem certeza que deseja excluir esta imagem?')) {
			return;
		}

		try {
			await stepsApi.deleteImage(stepId, imageId);
			onImageDeleted();
		} catch (err: any) {
			error = err?.response?.data?.message || err?.message || 'Erro ao excluir a imagem';
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	function getImageUrl(path: string): string {
		if (path.startsWith('http')) {
			return path;
		}
		return `${env.API_URL}${path}`;
	}
</script>

<div class="space-y-4">
	<Label>Imagens</Label>
	
	<!-- Warning message -->
	<div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
		<p class="text-sm text-blue-800 dark:text-blue-200">
			<strong>Atenção:</strong> Anexe imagens apenas se necessário para documentar esta etapa.
		</p>
	</div>

	<!-- Upload Button -->
	<div class="flex items-center gap-2">
		<Button
			type="button"
			variant="outline"
			onclick={triggerFileInput}
			disabled={disabled || isUploading}
			class="flex items-center gap-2"
		>
			{#if isUploading}
				<Loader2 class="w-4 h-4 animate-spin" />
				<span>Enviando...</span>
			{:else}
				<Upload class="w-4 h-4" />
				<span>Adicionar Imagens</span>
			{/if}
		</Button>
		<span class="text-sm text-muted-foreground">Selecione uma ou múltiplas imagens</span>
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		onchange={handleFileSelect}
		class="hidden"
		disabled={disabled || isUploading}
	/>

	<!-- Error message -->
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	<!-- Images Grid -->
	{#if images && images.length > 0}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each images as image (image.id)}
				<div class="relative group">
					<div 
						class="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
						onclick={() => onImageClick(image)}
					>
						<img
							src={getImageUrl(image.path)}
							alt="Imagem da etapa"
							class="w-full h-full object-cover"
							onerror={(e) => {
								(e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EErro%3C/text%3E%3C/svg%3E';
							}}
						/>
					</div>
					{#if !disabled}
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								handleDeleteImage(image.id);
							}}
							class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<X class="w-4 h-4" />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{:else if !isUploading}
		<div class="border-2 border-dashed rounded-lg p-8 text-center">
			<ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
			<p class="text-sm text-muted-foreground">Nenhuma imagem adicionada ainda</p>
		</div>
	{/if}
</div>

