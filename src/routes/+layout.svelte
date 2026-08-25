<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { theme } from '$lib/stores/theme';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let sidebarOpen = false;
  let lastPath = '';

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme)
  });

  // Auto-close the sidebar whenever the route changes.
  $: if ($page.url.pathname !== lastPath) {
    lastPath = $page.url.pathname;
    sidebarOpen = false;
  }

  // Public landing/auth routes render bare (no sidebar, no hamburger).
  $: publicRoutes = ['/home', '/login', '/register']
  $: isPublic = publicRoutes.some(r =>
    $page.url.pathname.startsWith(r)
  )
</script>

<svelte:head>
  <title>Studiq — AI Study Companion</title>
</svelte:head>

{#if isPublic}
  <slot />
{:else}
  <!-- Mobile hamburger: hidden while the drawer is open so it never floats
       over/in front of the open sidebar. Reappears once the drawer closes. -->
  <button class="hamburger" class:hidden={sidebarOpen} onclick={() => (sidebarOpen = !sidebarOpen)}>
    ☰
  </button>

  <!-- Overlay -->
  {#if sidebarOpen}
    <div
      class="overlay"
      role="button"
      aria-label="Close menu"
      tabindex="-1"
      onclick={() => (sidebarOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
    ></div>
  {/if}

  <Sidebar open={sidebarOpen} onNavigate={() => (sidebarOpen = false)} />

  <main class="main-content">
    <slot />
  </main>
{/if}

<style>
  .main-content {
    margin-left: var(--sidebar-w);
    min-height: 100vh;
    background: var(--bg);
    padding: 32px;
  }

  .hamburger {
    display: none;
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: 60;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .hamburger.hidden {
    display: none !important;
  }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 45;
  }

  @media (max-width: 768px) {
    .main-content { margin-left: 0; padding: 0; }
    .hamburger    { display: flex; }
    .overlay      { display: block; }
  }
</style>