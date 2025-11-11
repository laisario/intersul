<script lang="ts">
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from '$lib/components/ui/sheet/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatDate } from '$lib/utils/formatting.js';
	import type { Category } from '$lib/api/types/service.types.js';
	import { List, ListOrdered, ClipboardList } from 'lucide-svelte';

	interface Props {
		open: boolean;
		category?: Category | null;
		onClose?: () => void;
	}

	let { open = $bindable(false), category = null, onClose }: Props = $props();

	$effect(() => {
		if (!open) {
			category = category ?? null;
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

<Sheet bind:open>
	<SheetContent class="sm:max-w-[700px] overflow-y-auto">
		<SheetHeader>
			<SheetTitle class="flex items-center gap-2">
				<List class="w-5 h-5" />
				Detalhes da Categoria
			</SheetTitle>
			<SheetDescription>
				Visualize todas as informações da categoria e suas etapas template.
			</SheetDescription>
		</SheetHeader>

		{#if category}
			<div class="space-y-6 mt-6 px-6 pb-6">
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">{category.name}</CardTitle>
						{#if category.description}
							<CardDescription class="pt-1 text-sm text-muted-foreground">
								{category.description}
							</CardDescription>
						{/if}
					</CardHeader>
					<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-muted-foreground">Data de criação</span>
							<p class="font-medium">{formatDate(category.createdAt)}</p>
						</div>
						{#if category.updatedAt && category.updatedAt !== category.createdAt}
							<div>
								<span class="text-muted-foreground">Última atualização</span>
								<p class="font-medium">{formatDate(category.updatedAt)}</p>
							</div>
						{/if}
						<div class="col-span-full">
							<Badge variant="outline">
								{category.steps?.length || 0} {category.steps?.length === 1 ? 'etapa template' : 'etapas template'}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-start justify-between gap-2">
						<div>
							<CardTitle class="text-lg flex items-center gap-2">
								<ClipboardList class="w-5 h-5" />
								Etapas da Categoria
							</CardTitle>
							<CardDescription>
								Lista de etapas sugeridas para serviços dessa categoria.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						{#if category.steps && category.steps.length > 0}
							<ol class="space-y-4">
								{#each category.steps as step, index}
									<li class="border rounded-lg p-4">
										<div class="flex items-start justify-between gap-2">
											<div>
												<h4 class="font-semibold text-sm flex items-center gap-2">
													<ListOrdered class="w-4 h-4 text-muted-foreground" />
													Etapa {index + 1}: {step.name}
												</h4>
												<p class="text-sm text-muted-foreground mt-2 leading-relaxed">
													{step.description}
												</p>
											</div>
										</div>
									</li>
								{/each}
							</ol>
						{:else}
							<div class="text-center py-10 text-sm text-muted-foreground">
								Nenhuma etapa cadastrada para esta categoria.
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		{:else}
			<div class="flex items-center justify-center py-12 text-muted-foreground">
				Nenhuma categoria selecionada.
			</div>
		{/if}

		<SheetFooter class="mt-6">
			<Button variant="outline" type="button" onclick={handleClose}>
				Fechar
			</Button>
		</SheetFooter>
	</SheetContent>
</Sheet>

