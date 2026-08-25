<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { api, apiError } from '$lib/api/index.js';
  import { token, setAuth, clearAuth } from '$lib/stores/auth.js';
  import gsap from 'gsap';

  let loading = true;
  let saving = false;
  let deleting = false;
  let message = '';
  let error = '';

  // Form fields
  let name = '';
  let email = '';
  let password = '';
  let confirm = '';

  onMount(async () => {
    gsap.fromTo('.settings-head',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    gsap.fromTo('.settings-card',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 }
    );
    // Prefill from the store / server
    try {
      const { data } = await api.get('/auth/me');
      const u = data.data;
      name = u.name || '';
      email = u.email || '';
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  });

  async function save() {
    if (saving) return;
    error = '';
    message = '';

    if (password || confirm) {
      if (password !== confirm) {
        error = 'New password and confirmation do not match.';
        return;
      }
    }

    saving = true;
    try {
      const payload = { name, email };
      if (password) payload.password = password;
      const { data } = await api.put('/auth/me', payload);
      // Keep the updated profile in the store
      setAuth({ token: get(token), user: data.data });
      message = 'Profile updated successfully.';
      password = '';
      confirm = '';
    } catch (e) {
      error = apiError(e);
    } finally {
      saving = false;
    }
  }

  async function removeAccount() {
    if (deleting) return;
    error = '';
    const ok = confirm('Delete your account? This permanently removes your profile, notes, quizzes and performance history. This cannot be undone.');
    if (!ok) return;
    deleting = true;
    try {
      await api.delete('/auth/me');
      clearAuth();
      goto('/login');
    } catch (e) {
      error = apiError(e);
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Account Settings — Studiq</title>
</svelte:head>

<div class="page-padding" style="max-width:640px; margin:0 auto;">
  <div class="settings-head" style="margin-bottom:24px">
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:var(--text); margin:0 0 6px">
      Account <span style="color:var(--blue)">Settings</span> ⚙
    </h1>
    <p style="color:var(--muted); font-size:13px; margin:0">View and update your profile information.</p>
  </div>

  {#if loading}
    <div class="settings-card">
      <div class="skeleton" style="height:44px; border-radius:10px; margin-bottom:16px"></div>
      <div class="skeleton" style="height:44px; border-radius:10px; margin-bottom:16px"></div>
      <div class="skeleton" style="height:120px; border-radius:10px"></div>
    </div>
  {:else}
    <div class="settings-card" style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
      {#if error}
        <div style="background:rgba(239,68,68,.12); color:var(--red); border:1px solid rgba(239,68,68,.3); border-radius:10px; padding:10px 12px; font-size:12.5px; margin-bottom:16px">{error}</div>
      {/if}
      {#if message}
        <div style="background:rgba(22,163,74,.14); color:var(--green); border:1px solid rgba(22,163,74,.35); border-radius:10px; padding:10px 12px; font-size:12.5px; margin-bottom:16px">✓ {message}</div>
      {/if}

      <!-- View / edit -->
      <div style="display:flex; flex-direction:column; gap:14px">
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px" for="sname">Name</label>
          <input id="sname" type="text" bind:value={name} placeholder="Your name"
            style="width:100%; padding:11px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:13.5px; font-family:inherit; outline:none" />
        </div>

        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px" for="semail">Email</label>
          <input id="semail" type="email" bind:value={email} placeholder="you@example.com"
            style="width:100%; padding:11px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:13.5px; font-family:inherit; outline:none" />
        </div>

        <div style="border-top:1px solid var(--border); padding-top:14px; display:flex; flex-direction:column; gap:14px">
          <div style="font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.08em">Change Password</div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px" for="spass">New password</label>
            <input id="spass" type="password" bind:value={password} placeholder="Leave blank to keep current"
              style="width:100%; padding:11px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:13.5px; font-family:inherit; outline:none" />
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px" for="sconfirm">Confirm password</label>
            <input id="sconfirm" type="password" bind:value={confirm} placeholder="Re-enter new password"
              style="width:100%; padding:11px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:13.5px; font-family:inherit; outline:none" />
          </div>
        </div>

        <button onclick={save} disabled={saving}
          style="
            width:100%; padding:12px; border:none; border-radius:10px;
            background:var(--blue); color:#050A0F; font-size:14px; font-weight:700;
            cursor:pointer; font-family:inherit; margin-top:6px;
            {saving ? 'opacity:.6' : ''}
          "
        >{saving ? 'Saving…' : 'Save changes'}</button>

        <button onclick={removeAccount} disabled={deleting}
          style="
            width:100%; padding:11px; border:1px solid rgba(239,68,68,.4); border-radius:10px;
            background:transparent; color:var(--red); font-size:13px; font-weight:600;
            cursor:pointer; font-family:inherit; margin-top:8px;
            {deleting ? 'opacity:.6' : ''}
          "
        >{deleting ? 'Deleting…' : 'Delete account'}</button>
      </div>
    </div>
  {/if}
</div>