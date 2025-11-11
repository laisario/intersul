<!--
  Toast provider component using svelte-sonner
  Provides toast notifications throughout the app
-->

<script lang="ts">
  import { Toaster } from 'svelte-sonner';
  import { themeStore } from '$lib/stores/theme.svelte.js';

  let { children } = $props();
</script>

{@render children?.()}

<Toaster 
  position="top-right" 
  theme={$themeStore.resolvedTheme}
  richColors={true}
  closeButton={true}
  duration={4000}
/>
