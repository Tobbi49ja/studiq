<script>
  import { page } from '$app/stores';
  import { theme } from '$lib/stores/theme';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/index.js';
  import { logout } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  export let subjects = [];
  export let open = false;
  export let onNavigate = () => {};

  function handleLogoError(e) {
    e.target.style.display = 'none';
  }

  $: knownSubjects = Array.from(new Set([...subjects, ...($user?.subjects || [])]));

  const nav = [
    { label: 'Home',         href: '/home',        icon: 'dashboard' },
    { label: 'Dashboard',    href: '/',             icon: 'dashboard' },
    { label: 'Upload Notes', href: '/upload',       icon: 'upload' },
    { label: 'Quiz Mode',    href: '/quiz',         icon: 'quiz' },
    { label: 'Flashcards',   href: '/flashcards',   icon: 'flashcards' },
    { label: 'Ask AI',       href: '/ask',          icon: 'ask' },
    { label: 'Performance',  href: '/performance',  icon: 'performance' },
    { label: 'Admin',        href: '/admin',        icon: 'admin', adminOnly: true }
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
    <div class="logo-inner" onclick={() => { goto('/'); onNavigate(); }} style="cursor:pointer" role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (goto('/'), onNavigate())}>
      <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} />
    </div>
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
        <span class="nav-icon"><Icon name={item.icon} size={15} /></span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Subjects section -->
  <div class="nav-label" style="padding: 0 16px; margin-top: 12px;">SUBJECTS</div>
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
        <button type="submit" class="add-submit"><Icon name="check" size={12} /></button>
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
        <Icon name="sun" size={15} /> <span>Light Mode</span>
      {:else}
        <Icon name="moon" size={15} /> <span>Dark Mode</span>
      {/if}
    </button>

    <!-- Logout -->
    <button class="logout-btn" onclick={handleLogout}>
      <Icon name="logout" size={15} /> Log Out
    </button>

    <!-- User Profile Settings Button -->
    <button class="user-row" onclick={() => { goto('/settings'); onNavigate(); }}>
      <div class="avatar">{$user?.name?.[0] || 'S'}</div>
      <div class="user-info">
        <div class="user-name">{$user?.name || 'Student'}</div>
        <div class="user-sub">Account & Settings</div>
      </div>
      <Icon name="settings" size={14} className="user-settings-icon" />
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
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo-inner {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-inner img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
  }

  .nav {
    flex: 1.5;
    padding: 20px 12px 8px;
    overflow-y: auto;
  }

  .nav-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    color: var(--muted);
    text-transform: uppercase;
    padding: 0 8px;
    margin-bottom: 8px;
    margin-top: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--muted);
    text-decoration: none;
    transition: background .15s, color .15s;
    margin-bottom: 3px;
  }

  .nav-item:hover {
    background: var(--card);
    color: var(--text);
  }

  .nav-item.active {
    background: var(--blue-light);
    color: var(--blue);
  }

  .nav-icon {
    width: 26px;
    height: 26px;
    background: var(--bg);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: inherit;
    transition: background 0.15s;
  }

  .nav-item.active .nav-icon {
    background: var(--surface);
    color: var(--blue);
  }

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
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
  }

  .subject-item:hover {
    background: var(--card);
    color: var(--text);
  }

  .subject-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--blue);
    flex-shrink: 0;
  }

  .subject-empty {
    font-size: 12px;
    color: var(--muted);
    padding: 6px 12px;
  }

  .add-subject-btn {
    width: 100%;
    margin-top: 6px;
    padding: 8px 12px;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
  }

  .add-subject-btn:hover {
    color: var(--blue);
    border-color: var(--blue);
    background: var(--card);
  }

  .add-subject-form {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }

  .add-subject-form input {
    flex: 1;
    min-width: 0;
    padding: 6px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 12.5px;
    font-family: inherit;
    outline: none;
  }

  .add-subject-form input:focus {
    border-color: var(--blue);
  }

  .add-submit {
    padding: 0 10px;
    background: var(--blue);
    border: none;
    border-radius: 6px;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-bottom {
    padding: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
  }

  .theme-toggle:hover {
    color: var(--text);
    border-color: var(--blue);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--red);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .logout-btn:hover {
    background: var(--red-light);
    border-color: var(--red);
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color 0.15s;
  }

  .user-row:hover {
    border-color: var(--blue);
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-sub {
    font-size: 10px;
    color: var(--muted);
    font-weight: 500;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      width: 100%;
      max-width: 280px;
    }
    .sidebar.open {
      transform: translateX(0);
    }
  }
</style>