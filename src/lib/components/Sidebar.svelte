<script>
  import { page } from '$app/stores';
  import { theme } from '$lib/stores/theme';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/index.js';
  import { logout } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  export let subjects = [];
  export let open = false;
  export let onNavigate = () => {};

  $: knownSubjects = Array.from(new Set([...subjects, ...($user?.subjects || [])]));

  const nav = [
    { label: 'Dashboard',    href: '/',             icon: '⬡' },
    { label: 'Upload Notes', href: '/upload',       icon: '↑' },
    { label: 'Quiz Mode',    href: '/quiz',         icon: '◎' },
    { label: 'Flashcards',   href: '/flashcards',   icon: '⊞' },
    { label: 'Ask AI',       href: '/ask',          icon: '✦' },
    { label: 'Performance',  href: '/performance',  icon: '▣' },
    { label: 'Admin',        href: '/admin',        icon: '⚙', adminOnly: true }
  ];

  $: visibleNav = nav.filter((item) => !item.adminOnly || $user?.role === 'admin');

  let addingSubject = false;
  let newSubject = '';

  onMount(async () => {
    try {
      const { data } = await api.get('/performance/summary');
      subjects = (data.data || []).map((s) => s.subject).filter(Boolean);
    } catch (e) {
      // server may be offline — sidebar still works, just empty subjects list
    }
  });

  async function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    try {
      const { data } = await api.post('/subjects/add', { name });
      subjects = Array.from(new Set([...subjects, name]));
      // also update the persisted user subjects from the server response
    } catch (e) {
      // server may be offline — keep local list for this session
      subjects = Array.from(new Set([...subjects, name]));
    }
    newSubject = '';
    addingSubject = false;
  }

  function toggleTheme() {
    theme.update(t => t === 'dark' ? 'light' : 'dark')
  }

  function handleLogout() {
    logout();
    goto('/home');
  }
</script>

<aside class="sidebar" class:open={open}>
  <!-- Logo -->
  <div class="logo">
    <img
      src="/logo/studiq-logo.png"
      alt="Studiq"
      class="logo-img"
      onerror={(e) => (e.target.style.display = 'none')}
    />
    <span class="logo-sub">AI Study Companion</span>
  </div>

  <!-- Nav -->
  <nav class="nav">
    <div class="nav-label">MAIN</div>
    {#each visibleNav as item}
      <a
        href={item.href}
        class="nav-item"
        class:active={$page.url.pathname === item.href}
        onclick={onNavigate}
      >
        <span class="nav-icon">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Subjects section -->
  <div class="nav-label" style="padding: 0 16px; margin-top: 8px;">SUBJECTS</div>
  <div class="subject-list" id="subjectList">
    {#each knownSubjects as s}
      <div class="subject-item"><span class="subject-dot"></span>{s}</div>
    {:else}
      <div class="subject-empty">No subjects yet</div>
    {/each}
    {#if addingSubject}
      <form class="add-subject-form" onsubmit={(e) => { e.preventDefault(); addSubject(); onNavigate(); }}>
        <input
          type="text"
          placeholder="Subject name…"
          bind:value={newSubject}
          onkeydown={(e) => e.key === 'Escape' && (addingSubject = false)}
        />
        <button type="submit" class="add-submit">✓</button>
      </form>
    {:else}
      <button class="add-subject-btn" onclick={() => (addingSubject = true)}>+ Add Subject</button>
    {/if}
  </div>

  <!-- Bottom -->
  <div class="sidebar-bottom">
    <!-- Theme toggle -->
    <button class="theme-toggle" onclick={toggleTheme}>
      {#if $theme === 'dark'}
        <span>☀️</span> <span>Light Mode</span>
      {:else}
        <span>🌙</span> <span>Dark Mode</span>
      {/if}
    </button>

    <!-- User -->
    <button class="logout-btn" onclick={handleLogout}>
      <span>⎋</span> Log Out
    </button>

    <button class="user-row" onclick={() => { goto('/settings'); onNavigate(); }} style="cursor:pointer; border:none; width:100%; text-align:left">
      <div class="avatar">{$user?.name?.[0] || 'S'}</div>
      <div>
        <div class="user-name">{$user?.name || 'Student'}</div>
        <div class="user-sub">Account · Settings</div>
      </div>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    height: 100vh;
    position: fixed;
    top: 0; left: 0;
    display: flex;
    flex-direction: column;
    z-index: 50;
    transition: transform 0.3s ease;
  }

  .logo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 22px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo-img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  :global([data-theme="dark"]) .logo-img {
    filter: brightness(0) invert(1) brightness(1.4) saturate(0.6);
  }

  .logo-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }

  .nav { flex: 1; padding: 16px 12px 8px; overflow-y: auto; }

  .nav-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: .1em;
    color: var(--muted);
    text-transform: uppercase;
    padding: 0 8px;
    margin-bottom: 6px;
    margin-top: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13.5px; font-weight: 500;
    color: var(--muted);
    text-decoration: none;
    transition: background .15s, color .15s;
    margin-bottom: 2px;
  }

  .nav-item:hover { background: var(--card); color: var(--text); }
  .nav-item.active { background: var(--card); color: var(--blue); }

  .nav-icon {
    width: 30px; height: 30px;
    background: var(--bg);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }

  .nav-item.active .nav-icon { background: rgba(14,165,233,.15); }

  .subject-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px 8px;
  }

  .subject-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    color: var(--muted);
  }

  .subject-item:hover { background: var(--card); color: var(--text); }

  .subject-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--blue);
    flex-shrink: 0;
  }

  .subject-empty {
    font-size: 12px; color: var(--muted);
    padding: 6px 12px;
  }

  .add-subject-btn {
    width: 100%;
    margin-top: 4px;
    padding: 8px 12px;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    transition: all .15s;
  }

  .add-subject-btn:hover { color: var(--blue); border-color: var(--blue); }

  .add-subject-form {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  .add-subject-form input {
    flex: 1;
    min-width: 0;
    padding: 7px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 12.5px;
    font-family: inherit;
    outline: none;
  }

  .add-subject-form input:focus { border-color: var(--blue); }

  .add-submit {
    padding: 0 10px;
    background: var(--blue);
    border: none;
    border-radius: 8px;
    color: #050A0F;
    font-size: 13px; font-weight: 700;
    cursor: pointer;
  }

  .sidebar-bottom {
    padding: 12px;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px;
  }

  .theme-toggle {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--muted);
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    transition: all .15s;
  }

  .theme-toggle:hover { color: var(--text); border-color: var(--blue); }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--red, #ef4444);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--red, #ef4444);
  }

  .user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px;
    background: var(--card);
    border-radius: 10px;
  }

  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }

  .user-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .user-sub  { font-size: 11px; color: var(--muted); }

  /* Mobile */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      width: 100%;
      max-width: 280px;
    }
    .sidebar.open { transform: translateX(0); }
  }
</style>