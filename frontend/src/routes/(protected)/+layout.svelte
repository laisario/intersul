<!--
  Protected layout for authenticated pages
  Includes sidebar navigation and auth guard
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { Toaster } from 'svelte-sonner';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import SiteHeader from '$lib/components/site-header.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  onMount(() => {
    // Redirect to login if not authenticated
    if (!$authStore.isAuthenticated) {
      goto('/login');
    }
  });
</script>

<svelte:head>
  <title>Intersul cópias- Sistema de Gestão</title>
  <meta name="description" content="Sistema de gestão para máquinas copiadoras" />
</svelte:head>

{#if $authStore.isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{:else if $authStore.isAuthenticated}
  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AppSidebar variant="inset" />
    <Sidebar.Inset>
      <SiteHeader />
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <slot />
          </div>
        </div>
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">Redirecionando...</h1>
      <p class="mt-2 text-gray-600">Você será redirecionado para a página de login.</p>
    </div>
  </div>
{/if}

<!-- Toast notifications are handled by the root layout -->
