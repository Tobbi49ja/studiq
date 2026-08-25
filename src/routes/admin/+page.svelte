<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import { token, user } from '$lib/stores/auth.js';

  let loading = true;
  let error = '';
  let stats = null;
  let users = [];
  let notes = [];

  async function loadAll() {
    try {
      const [statsRes, usersRes, notesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/notes')
      ]);
      stats = statsRes.data.data;
      users = usersRes.data.data || [];
      notes = notesRes.data.data || [];
    } catch (e) {
      error = apiError(e);
      if (e?.response?.status === 403) {
        error = 'Admin access required.';
        goto('/');
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!$token) {
      goto('/login');
      return;
    }
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
</script>

<svelte:head>
  <title>Admin — Studiq</title>
</svelte:head>

<div class="page-padding" style="max-width:1100px; margin:0 auto;">
  <div style="margin-bottom:24px">
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:var(--text); margin:0 0 6px">
      Admin <span style="color:var(--blue)">Panel</span> ⚙
    </h1>
    <p style="color:var(--muted); font-size:13px; margin:0">Platform overview, user and content management.</p>
  </div>

  {#if error}
    <div style="background:rgba(239,68,68,.12); color:var(--red); border:1px solid rgba(239,68,68,.3); border-radius:10px; padding:12px 14px; font-size:13px; margin-bottom:16px">{error}</div>
  {/if}

  {#if loading}
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px">
      <div class="skeleton" style="height:100px"></div>
      <div class="skeleton" style="height:100px"></div>
      <div class="skeleton" style="height:100px"></div>
      <div class="skeleton" style="height:100px"></div>
    </div>
    <div class="skeleton" style="height:300px"></div>
  {:else}
    <!-- Stats -->
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px">
      <div style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--blue); border-radius:12px; padding:18px">
        <div style="font-size:26px; font-weight:800; color:var(--text)">{stats?.totalUsers ?? 0}</div>
        <div style="font-size:12px; color:var(--muted); margin-top:4px">Total Users</div>
      </div>
      <div style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--green); border-radius:12px; padding:18px">
        <div style="font-size:26px; font-weight:800; color:var(--text)">{stats?.totalNotes ?? 0}</div>
        <div style="font-size:12px; color:var(--muted); margin-top:4px">Total Notes</div>
      </div>
      <div style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--teal); border-radius:12px; padding:18px">
        <div style="font-size:26px; font-weight:800; color:var(--text)">{stats?.totalQuizzes ?? 0}</div>
        <div style="font-size:12px; color:var(--muted); margin-top:4px">Total Quizzes</div>
      </div>
      <div style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--purple); border-radius:12px; padding:18px">
        <div style="font-size:26px; font-weight:800; color:var(--text)">{stats?.totalPerformances ?? 0}</div>
        <div style="font-size:12px; color:var(--muted); margin-top:4px">Quiz Attempts</div>
      </div>
    </div>

    <!-- Users -->
    <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px; margin-bottom:28px">
      <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Users ({users.length})</h2>
      {#if users.length}
        <div style="overflow-x:auto">
          <table style="width:100%; border-collapse:collapse; font-size:13px">
            <thead>
              <tr style="color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.06em; text-align:left">
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Name</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Email</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Role</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Notes</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Quizzes</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border)">Joined</th>
                <th style="padding:8px 10px; border-bottom:1px solid var(--border); text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as u (u.id)}
                <tr style="border-bottom:1px solid var(--border); color:var(--text)">
                  <td style="padding:10px; font-weight:600">{u.name}</td>
                  <td style="padding:10px; color:var(--muted)">{u.email}</td>
                  <td style="padding:10px">
                    <span style="
                      display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700;
                      background:{u.role === 'admin' ? 'rgba(14,165,233,.15)' : 'rgba(0,255,136,.12)'};
                      color:{u.role === 'admin' ? 'var(--blue)' : 'var(--green)'}
                    ">{u.role}</span>
                  </td>
                  <td style="padding:10px; color:var(--muted)">{u.notes}</td>
                  <td style="padding:10px; color:var(--muted)">{u.quizzes}</td>
                  <td style="padding:10px; color:var(--muted)">{fmtDate(u.createdAt)}</td>
                  <td style="padding:10px; text-align:right; white-space:nowrap">
                    {#if u.id !== $user?.id}
                      <button onclick={() => toggleRole(u)} style="
                        padding:6px 12px; border:1px solid var(--border); border-radius:8px;
                        background:transparent; color:var(--text); font-size:12px; font-weight:600;
                        cursor:pointer; font-family:inherit; margin-right:6px
                      ">{u.role === 'admin' ? 'Demote' : 'Make admin'}</button>
                      <button onclick={() => removeUser(u)} style="
                        padding:6px 12px; border:1px solid rgba(239,68,68,.4); border-radius:8px;
                        background:transparent; color:var(--red); font-size:12px; font-weight:600;
                        cursor:pointer; font-family:inherit
                      ">Delete</button>
                    {:else}
                      <span style="font-size:11px; color:var(--muted)">you</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div style="color:var(--muted); font-size:13px; padding:20px 0; text-align:center">No users yet.</div>
      {/if}
    </div>

    <!-- Notes -->
    <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
      <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Recent Notes ({notes.length})</h2>
      {#if notes.length}
        <div style="display:flex; flex-direction:column; gap:10px">
          {#each notes as n (n.id)}
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:12px 14px">
              <div style="min-width:0">
                <div style="font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{n.title}</div>
                <div style="font-size:11px; color:var(--muted); margin-top:2px">
                  {n.subject || 'General'} · {n.user?.name || 'Unknown'} · {fmtDate(n.createdAt)}
                </div>
              </div>
              <button onclick={() => removeNote(n)} style="
                flex-shrink:0; padding:6px 12px; border:1px solid rgba(239,68,68,.4); border-radius:8px;
                background:transparent; color:var(--red); font-size:12px; font-weight:600;
                cursor:pointer; font-family:inherit
              ">Delete</button>
            </div>
          {/each}
        </div>
      {:else}
        <div style="color:var(--muted); font-size:13px; padding:20px 0; text-align:center">No notes uploaded yet.</div>
      {/if}
    </div>
  {/if}
</div>
