<!--
  Public layout for unauthenticated pages
  Used for login, register, and other public pages
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.svelte.js';
  import { Toaster } from 'svelte-sonner';

  onMount(() => {
    const { isAuthenticated } = get(authStore);
    const { url } = get(page);
    const shouldBypassRedirect = url.pathname.startsWith('/register');

    if (isAuthenticated && !shouldBypassRedirect) {
      goto('/dashboard');
    }
  });
</script>

<svelte:head>
  <title>Intersul - Sistema de Gestão</title>
  <meta name="description" content="Sistema de gestão para máquinas copiadoras" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if $authStore.isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <slot />
  {/if}
</div>

<!-- Toast notifications are handled by the root layout -->
