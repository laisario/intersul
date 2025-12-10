<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { authStore, user } from "$lib/stores/auth.svelte.js";
	import { useLogout } from "$lib/hooks/queries/use-auth.svelte.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { goto } from '$app/navigation';

	const { mutate: logout } = useLogout();

	function handleLogout() {
		logout();
		goto('/login');
	}

</script>

<header
	class="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<div class="ml-auto flex items-center gap-2">
			<ThemeToggle />
			{#if $user}
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">{$user.name}</span>
					<Button
						variant="ghost"
						size="sm"
						onclick={handleLogout}
					>
						Sair
					</Button>
				</div>
			{/if}
		</div>
	</div>
</header>
