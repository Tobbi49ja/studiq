<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import { token, user } from '$lib/stores/auth.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let loading = $state(true);
  let error = $state('');
  let stats = $state(null);
  let users = $state([]);
  let notes = $state([]);
  let auditLogs = $state([]);

  async function loadAll() {
    try {
      const [statsRes, usersRes, notesRes, auditRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/notes'),
        api.get('/admin/audit')
      ]);
      stats = statsRes.data.data;
      users = usersRes.data.data || [];
      notes = notesRes.data.data || [];
      auditLogs = auditRes.data.data || [];

      await new Promise(r => setTimeout(r, 10));
      gsap.fromTo('.admin-stat', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    } catch (e) {
      error = apiError(e);
      if (e?.response?.status === 403) { error = 'Admin access required.'; goto('/'); }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!$token) { goto('/login'); return; }
    gsap.fromTo('.admin-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    loadAll();
  });

  async function toggleRole(u) {
    const next = u.role === 'admin' ? 'student' : 'admin';
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role: next });
      u.role = next;
      users = [...users];
    } catch (e) {
      error = apiError(e);
    }
  }

  async function removeUser(u) {
    const ok = confirm(`Delete ${u.name} (${u.email})? This removes their notes, quizzes and performance history. This cannot be undone.`);
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      users = users.filter((x) => x.id !== u.id);
    } catch (e) {
      error = apiError(e);
    }
  }

  async function removeNote(n) {
    const ok = confirm(`Delete note "${n.title}"?`);
    if (!ok) return;
    try {
      await api.delete(`/admin/notes/${n.id}`);
      notes = notes.filter((x) => x.id !== n.id);
    } catch (e) {
      error = apiError(e);
    }
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', color: 'var(--blue)', icon: 'dashboard' },
    { key: 'totalNotes', label: 'Notes Uploaded', color: 'var(--green)', icon: 'upload' },
    { key: 'totalQuizzes', label: 'Quizzes Generated', color: 'var(--teal)', icon: 'quiz' },
    { key: 'totalPerformances', label: 'Quiz Attempts', color: 'var(--purple)', icon: 'performance' },
  ];
</script>

<svelte:head>
  <title>Admin — Studiq</title>
</svelte:head>

<div style="max-width: 1200px; margin: 0 auto">
  <!-- Header -->
  <div class="admin-head" style="margin-bottom: 28px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Admin <span style="color: var(--blue)">Panel</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500">Platform overview, user and content management.</p>
  </div>

  {#if error}
    <div style="
      background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red);
      border: 1px solid color-mix(in srgb, var(--red) 25%, transparent);
      border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px;
    ">{error}</div>
  {/if}

  {#if loading}
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px">
      {#each Array(4) as _, i (i)}
        <div class="skeleton animate-pulse" style="height: 100px; border-radius: 12px"></div>
      {/each}
    </div>
    <div class="skeleton animate-pulse" style="height: 320px; border-radius: 14px"></div>
  {:else}
    <!-- Stats strip -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px">
      {#each statCards as s}
        <div class="admin-stat premium-card" style="border-top: 3px solid {s.color}; padding: 18px 20px; display: flex; align-items: center; gap: 14px">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: color-mix(in srgb, {s.color} 12%, transparent); color: {s.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0">
            <Icon name={s.icon} size={16} />
          </div>
          <div>
            <div style="font-size: 26px; font-weight: 800; color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif">{stats?.[s.key] ?? 0}</div>
            <div style="font-size: 11px; color: var(--muted); font-weight: 600; margin-top: 2px">{s.label}</div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Users table -->
    <div class="premium-card" style="padding: 24px; margin-bottom: 24px">
      <h2 style="color: var(--text); font-size: 16px; font-weight: 700; margin: 0 0 18px">Users ({users.length})</h2>
      {#if users.length}
        <div style="overflow-x: auto">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px">
            <thead>
              <tr style="color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; text-align: left">
                {#each ['Name', 'Email', 'Role', 'Notes', 'Quizzes', 'Joined', ''] as col}
                  <th style="padding: 8px 10px; border-bottom: 1px solid var(--border); font-weight: 700">{col}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each users as u (u.id)}
                <tr style="border-bottom: 1px solid var(--border); transition: background .15s">
                  <td style="padding: 12px 10px; font-weight: 600; color: var(--text)">{u.name}</td>
                  <td style="padding: 12px 10px; color: var(--muted)">{u.email}</td>
                  <td style="padding: 12px 10px">
                    <span style="
                      display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
                      background: {u.role === 'admin' ? 'var(--blue-light)' : 'var(--green-light)'};
                      color: {u.role === 'admin' ? 'var(--blue)' : 'var(--green)'};
                    ">{u.role}</span>
                  </td>
                  <td style="padding: 12px 10px; color: var(--muted)">{u.notes}</td>
                  <td style="padding: 12px 10px; color: var(--muted)">{u.quizzes}</td>
                  <td style="padding: 12px 10px; color: var(--muted)">{fmtDate(u.createdAt)}</td>
                  <td style="padding: 12px 10px; text-align: right; white-space: nowrap">
                    {#if u.id !== $user?.id}
                      <button onclick={() => toggleRole(u)} style="
                        padding: 6px 12px; border: 1px solid var(--border); border-radius: 7px;
                        background: transparent; color: var(--text); font-size: 11.5px; font-weight: 600;
                        cursor: pointer; font-family: inherit; margin-right: 6px; transition: border-color .15s;
                      ">{u.role === 'admin' ? 'Demote' : 'Make admin'}</button>
                      <button onclick={() => removeUser(u)} style="
                        padding: 6px 12px; border: 1px solid color-mix(in srgb, var(--red) 35%, var(--border)); border-radius: 7px;
                        background: transparent; color: var(--red); font-size: 11.5px; font-weight: 600;
                        cursor: pointer; font-family: inherit; transition: background .15s;
                      ">Delete</button>
                    {:else}
                      <span style="font-size: 11px; color: var(--muted)">you</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div style="color: var(--muted); font-size: 13px; padding: 20px 0; text-align: center; font-weight: 500">No users yet.</div>
      {/if}
    </div>

    <!-- Recent notes -->
    <div class="premium-card" style="padding: 24px; margin-bottom: 24px">
      <h2 style="color: var(--text); font-size: 16px; font-weight: 700; margin: 0 0 18px">Recent Notes ({notes.length})</h2>
      {#if notes.length}
        <div style="display: flex; flex-direction: column; gap: 10px">
          {#each notes as n (n.id)}
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px">
              <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0">
                  <Icon name="upload" size={14} />
                </div>
                <div style="min-width: 0">
                  <div style="font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{n.title}</div>
                  <div style="font-size: 11px; color: var(--muted); margin-top: 2px; font-weight: 500">{n.subject || 'General'} · {n.user?.name || 'Unknown'} · {fmtDate(n.createdAt)}</div>
                </div>
              </div>
              <button onclick={() => removeNote(n)} style="
                flex-shrink: 0; padding: 6px 12px; border: 1px solid color-mix(in srgb, var(--red) 35%, var(--border));
                border-radius: 7px; background: transparent; color: var(--red); font-size: 12px; font-weight: 600;
                cursor: pointer; font-family: inherit; transition: background .15s;
              ">Delete</button>
            </div>
          {/each}
        </div>
      {:else}
        <div style="color: var(--muted); font-size: 13px; padding: 20px 0; text-align: center; font-weight: 500">No notes uploaded yet.</div>
      {/if}
    </div>

    <!-- Audit log -->
    <div class="premium-card" style="padding: 24px">
      <h2 style="color: var(--text); font-size: 16px; font-weight: 700; margin: 0 0 18px">Audit Log ({auditLogs.length})</h2>
      {#if auditLogs.length}
        <div style="overflow-x: auto">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px">
            <thead>
              <tr style="color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; text-align: left">
                {#each ['Time', 'Email', 'Action', 'Detail'] as col}
                  <th style="padding: 8px 10px; border-bottom: 1px solid var(--border); font-weight: 700">{col}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each auditLogs as log (log._id)}
                <tr style="border-bottom: 1px solid var(--border)">
                  <td style="padding: 10px; color: var(--muted); white-space: nowrap">{fmtDate(log.createdAt)}</td>
                  <td style="padding: 10px; color: var(--muted)">{log.email || '—'}</td>
                  <td style="padding: 10px">
                    <span style="
                      display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
                      background: {log.action.startsWith('admin') ? 'color-mix(in srgb, var(--red) 12%, transparent)' : log.action.startsWith('auth') ? 'var(--blue-light)' : 'var(--green-light)'};
                      color: {log.action.startsWith('admin') ? 'var(--red)' : log.action.startsWith('auth') ? 'var(--blue)' : 'var(--green)'};
                    ">{log.action}</span>
                  </td>
                  <td style="padding: 10px; color: var(--text)">{log.detail || '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div style="color: var(--muted); font-size: 13px; padding: 20px 0; text-align: center; font-weight: 500">No audit entries yet.</div>
      {/if}
    </div>
  {/if}
</div>
