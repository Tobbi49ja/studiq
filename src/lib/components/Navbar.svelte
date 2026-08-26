<script>
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
  });

  function toggleTheme() {
    theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function handleLogoError(e) {
  e.target.style.display = 'none';
}
</script>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label="Studiq home">
      <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} />
    </a>

    <div class="nav-links">
      <a href="/#about" onclick={(e) => { e.preventDefault(); scrollTo('about'); }}>Features</a>
      <a href="/#about-us" onclick={(e) => { e.preventDefault(); scrollTo('about-us'); }}>About</a>
      <a href="/#contact" onclick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Contact</a>
    </div>

    <div class="nav-actions">
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Icon name="sun" size={16} />
        {:else}
          <Icon name="moon" size={16} />
        {/if}
      </button>
      <a href="/login" class="ghost-btn">Login</a>
      <a href="/register" class="solid-btn">Register</a>
    </div>
  </div>
</nav>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(8px);
  }
  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    text-decoration: none;
    display: flex;
    align-items: center;
  }
  .brand img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
  }
  .nav-links {
    display: flex;
    gap: 28px;
  }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    transition: color 0.15s;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .theme-toggle {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .theme-toggle:hover {
    border-color: var(--blue);
    color: var(--blue);
  }
  .ghost-btn,
  .solid-btn {
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    transition: background 0.15s, opacity 0.15s;
  }
  .ghost-btn {
    color: var(--text);
    border: 1px solid var(--border);
    background: transparent;
  }
  .ghost-btn:hover {
    background: var(--card);
    border-color: var(--blue);
  }
  .solid-btn {
    color: #ffffff !important;
    background: var(--blue);
  }
  .solid-btn:hover { opacity: 0.95; }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .nav-inner { padding: 14px 16px; }
  }
  @media (max-width: 425px) {
    .ghost-btn { display: none; }
  }
</style>
