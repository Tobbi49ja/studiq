<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { api, apiError } from '$lib/api/index.js';
  import { token, setAuth, clearAuth } from '$lib/stores/auth.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let loading = $state(true);
  let saving = $state(false);
  let deleting = $state(false);
  let message = $state('');
  let error = $state('');

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirm = $state('');

  onMount(async () => {
    gsap.fromTo('.settings-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.settings-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 });
    try {
      const { data } = await api.get('/auth/me');
      name = data.data.name || '';
      email = data.data.email || '';
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  });

  async function save() {
    if (saving) return;
    error = ''; message = '';
    if (password || confirm) {
      if (password !== confirm) { error = 'New password and confirmation do not match.'; return; }
    }
    saving = true;
    try {
      const payload = { name, email };
      if (password) payload.password = password;
      const { data } = await api.put('/auth/me', payload);
      setAuth({ token: get(token), user: data.data });
      message = 'Profile updated successfully.';
      password = ''; confirm = '';
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

<div style="max-width: 600px; margin: 0 auto">
  <!-- Header -->
  <div class="settings-head" style="margin-bottom: 28px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Account <span style="color: var(--blue)">Settings</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500">View and update your profile information.</p>
  </div>

  {#if loading}
    <div class="settings-card">
      {#each Array(3) as _, i (i)}
        <div class="skeleton animate-pulse" style="height: 44px; border-radius: 10px; margin-bottom: 16px"></div>
      {/each}
    </div>
  {:else}
    <div class="settings-card premium-card" style="padding: 28px">
      <!-- Alerts -->
      {#if error}
        <div style="
          background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red);
          border: 1px solid color-mix(in srgb, var(--red) 25%, transparent);
          border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 500; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        ">
          <Icon name="x" size={13} /> {error}
        </div>
      {/if}
      {#if message}
        <div style="
          background: color-mix(in srgb, var(--green) 10%, transparent); color: var(--green);
          border: 1px solid color-mix(in srgb, var(--green) 25%, transparent);
          border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 500; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        ">
          <Icon name="check" size={13} /> {message}
        </div>
      {/if}

      <!-- Profile section -->
      <div style="margin-bottom: 24px">
        <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 14px">Profile Information</div>
        <div style="display: flex; flex-direction: column; gap: 14px">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px" for="sname">Full Name</label>
            <input id="sname" type="text" bind:value={name} placeholder="Your name" class="premium-input" style="width: 100%; box-sizing: border-box" />
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px" for="semail">Email Address</label>
            <input id="semail" type="email" bind:value={email} placeholder="you@example.com" class="premium-input" style="width: 100%; box-sizing: border-box" />
          </div>
        </div>
      </div>

      <!-- Password section -->
      <div style="border-top: 1px solid var(--border); padding-top: 20px; margin-bottom: 24px">
        <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 14px">Change Password</div>
        <div style="display: flex; flex-direction: column; gap: 14px">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px" for="spass">New Password</label>
            <input id="spass" type="password" bind:value={password} placeholder="Leave blank to keep current" class="premium-input" style="width: 100%; box-sizing: border-box" />
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px" for="sconfirm">Confirm New Password</label>
            <input id="sconfirm" type="password" bind:value={confirm} placeholder="Re-enter new password" class="premium-input" style="width: 100%; box-sizing: border-box" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <button
        onclick={save}
        disabled={saving}
        class="btn-primary"
        style="width: 100%; padding: 13px; font-size: 14px; border-radius: 12px; margin-bottom: 12px; {saving ? 'opacity: .7; cursor: not-allowed' : ''}"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      <div style="border-top: 1px solid var(--border); padding-top: 20px; margin-top: 8px">
        <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px">Danger Zone</div>
        <button
          onclick={removeAccount}
          disabled={deleting}
          style="
            width: 100%; padding: 12px; border: 1.5px solid color-mix(in srgb, var(--red) 35%, var(--border));
            border-radius: 12px; background: transparent; color: var(--red); font-size: 13.5px; font-weight: 600;
            cursor: pointer; font-family: inherit; transition: background .18s;
            {deleting ? 'opacity: .6' : ''}
          "
        >
          {deleting ? 'Deleting account…' : 'Delete account'}
        </button>
        <p style="color: var(--muted); font-size: 11.5px; margin: 8px 0 0; font-weight: 500; text-align: center">This permanently removes your profile, notes, quizzes and performance data.</p>
      </div>
    </div>
  {/if}
</div>