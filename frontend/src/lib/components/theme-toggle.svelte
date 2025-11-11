<script lang="ts">
  import { themeStore, isDark } from '$lib/stores/theme.svelte.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import SunIcon from '@lucide/svelte/icons/sun';
  import MoonIcon from '@lucide/svelte/icons/moon';

  function setTheme(theme: 'light' | 'dark' | 'system') {
    themeStore.setTheme(theme);
  }

  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<div class="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onclick={toggleTheme}
    class="h-9 w-9 p-0"
    title="Alternar tema"
  >
    {#if $isDark}
      <SunIcon class="h-4 w-4" />
    {:else}
      <MoonIcon class="h-4 w-4" />
    {/if}
  </Button>
</div>
