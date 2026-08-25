<script>
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
  });

  function toggleTheme() {
    theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label="Studiq home">
      <img src="/logo/studiq-logo.png" alt="Studiq" class="brand-logo" onerror={(e) => (e.target.style.display = 'none')} />
    </a>

    <div class="nav-links">
      <a href="/#about" onclick={(e) => { e.preventDefault(); scrollTo('about'); }}>Features</a>
      <a href="/#about-us" onclick={(e) => { e.preventDefault(); scrollTo('about-us'); }}>About</a>
      <a href="/#contact" onclick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Contact</a>
    </div>

    <div class="nav-actions">
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {$theme === 'dark' ? '☀️' : '🌙'}
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
  }
  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .brand-logo {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  :global([data-theme="dark"]) .brand-logo {
    filter: brightness(0) invert(1) brightness(1.4) saturate(0.6);
  }
  .nav-links {
    display: flex;
    gap: 24px;
  }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 14px;
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
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 16px;
    cursor: pointer;
  }
  .ghost-btn,
  .solid-btn {
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    padding: 9px 18px;
    border-radius: 10px;
    transition: opacity 0.15s;
  }
  .ghost-btn {
    color: var(--text);
    border: 1px solid var(--border);
    background: transparent;
  }
  .solid-btn {
    color: #fff;
    background: var(--blue);
  }
  .ghost-btn:hover, .solid-btn:hover { opacity: 0.85; }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .nav-inner { padding: 12px 16px; }
  }

  @media (max-width: 425px) {
    .ghost-btn { display: none; }
  }
</style>
