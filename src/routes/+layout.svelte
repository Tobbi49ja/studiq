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
  <!-- Mobile hamburger -->
  <button 
    class="hamburger" 
    class:hidden={sidebarOpen} 
    onclick={() => (sidebarOpen = !sidebarOpen)}
    aria-label="Open menu"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
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
    top: 14px;
    left: 14px;
    z-index: 60;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
      padding: 24px 16px 40px; 
    }
    .hamburger    { display: flex; }
    .overlay      { display: block; }
  }
</style>