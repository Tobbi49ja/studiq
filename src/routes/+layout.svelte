<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Icon from '$lib/components/Icon.svelte';
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
  <!-- Mobile hamburger -->
  <button 
    class="hamburger" 
    class:hidden={sidebarOpen} 
    onclick={() => (sidebarOpen = !sidebarOpen)}
    aria-label="Open menu"
  >
    <Icon name="menu" size={18} />
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
    <div class="main-container">
      <slot />
    </div>
  </main>
{/if}

<style>
  .main-content {
    margin-left: var(--sidebar-w);
    min-height: 100vh;
    background: var(--bg);
    padding: 40px;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .main-container {
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeUp 0.4s ease-out;
  }

  .hamburger {
    display: none;
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 60;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background 0.2s, border-color 0.2s;
  }

  .hamburger:hover {
    background: var(--card);
    border-color: var(--blue);
    color: var(--blue);
  }

  .hamburger.hidden {
    display: none !important;
  }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 45;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .main-content { 
      margin-left: 0; 
      padding: 56px 16px 40px; 
    }
    .hamburger    { display: flex; }
    .overlay      { display: block; }
  }
</style>