<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Upload, X, Image as ImageIcon } from 'lucide-svelte';

    interface Props {
        value?: File | null;
        onChange: (value: File | null) => void;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		accept?: string;
		maxSize?: number; // in MB
	}

    let {
        value = $bindable<File | null>(null),
		onChange,
		label = 'Imagem',
		placeholder = 'URL da imagem ou faça upload',
		disabled = false,
		accept = 'image/*',
		maxSize = 10
	}: Props = $props();

    let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let error = $state('');

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;

		// Validate file size
		if (file.size > maxSize * 1024 * 1024) {
			error = `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`;
			return;
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Por favor, selecione apenas arquivos de imagem';
			return;
		}

        error = '';
        isUploading = true;
        try {
            onChange(file);
        } finally {
            isUploading = false;
        }
	}

    // URL input removed – only file upload supported

    function clearImage() {
        onChange(null);
		error = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	// Validate URL format
    let previewUrl = $derived(value ? URL.createObjectURL(value) : '');
</script>

<div class="space-y-2">
	<Label for="image-upload">{label}</Label>
	
	<!-- Image Preview -->
    {#if value}
		<div class="relative group">
			<div class="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                <img 
                    src={previewUrl} 
                    alt="Preview" 
                    class="w-full h-full object-cover"
                    onerror={() => error = 'Erro ao carregar a imagem'}
                />
				
				<!-- Remove button -->
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onclick={clearImage}
					class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
					disabled={disabled}
				>
					<X class="w-4 h-4" />
				</Button>
			</div>
		</div>
	{/if}

    <!-- File Upload Button -->
    <div class="space-y-2">
		<div class="flex items-center space-x-2">
			<Button
				type="button"
				variant="outline"
				onclick={triggerFileInput}
				disabled={disabled || isUploading}
				class="flex items-center space-x-2"
			>
				{#if isUploading}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span>Enviando...</span>
				{:else}
					<Upload class="w-4 h-4" />
					<span>Upload de Arquivo</span>
				{/if}
			</Button>
			
			<span class="text-sm text-gray-500">
				Máx. {maxSize}MB
			</span>
		</div>
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept={accept}
		onchange={handleFileSelect}
		class="hidden"
		disabled={disabled || isUploading}
	/>

	<!-- Error message -->
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	<!-- Help text -->
    <p class="text-sm text-gray-500">
        Faça upload de um arquivo (JPG, PNG, GIF, WebP)
    </p>
</div>
