<script>
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import { setAuth } from '$lib/stores/auth.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let loading = false;
  let googleLoading = false;
  let error = '';

  async function submit(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data);
      goto('/');
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  }

  // Auto-render the Google button on load so it's immediately clickable.
  onMount(() => {
    initGoogle();
  });

  // Load the Google Identity Services library, then render the sign-in button.
  function initGoogle() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      error = 'Google sign-in is not configured yet.';
      return;
    }
    googleLoading = true;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential
      });
      google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill' }
      );
      googleLoading = false;
    };
    document.head.appendChild(script);
  }

  async function handleGoogleCredential(response) {
    try {
      const { data } = await api.post('/auth/google', { credential: response.credential });
      setAuth(data.data);
      goto('/');
    } catch (e) {
      error = apiError(e);
    }
  }
</script>

<svelte:head>
  <title>Login — Studiq</title>
</svelte:head>

<Navbar />

<div class="auth-page">
  <div class="auth-card">
    <div class="auth-head">
      <div class="auth-logo">
        <img src="/logo/studiq-logo.png" alt="Studiq" onerror={(e) => (e.target.style.display = 'none')} />
      </div>
      <h1 class="auth-title">Welcome back to <span>Studi<span class="accent">q</span></span></h1>
      <p class="auth-sub">Sign in to your study companion</p>
    </div>

    {#if error}
      <div class="auth-error">{error}</div>
    {/if}

    <form onsubmit={submit}>
      <label class="field-label" for="email">Email</label>
      <input id="email" type="email" bind:value={email} required class="field-input" placeholder="you@example.com" />

      <label class="field-label" for="password">Password</label>
      <input id="password" type="password" bind:value={password} required class="field-input" placeholder="••••••••" />

      <button type="submit" class="auth-btn" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>

    <p class="auth-switch">
      Don't have an account?
      <a href="/register">Register</a>
    </p>

    <div class="google-divider">
      <span>or</span>
    </div>

    <div id="googleBtn" class="google-btn-wrap">
      {#if googleLoading}
        <div class="google-loading">Loading Google sign-in…</div>
      {/if}
    </div>
    <button type="button" class="google-fallback" onclick={initGoogle}>
      Continue with Google
    </button>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 67px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: 24px;
  }
  .auth-card {
    width: 100%;
    max-width: 400px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 36px;
    color: var(--text);
  }
  .auth-head { text-align: center; margin-bottom: 28px; }
  .auth-logo img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    margin: 0 auto 16px;
  }
  :global([data-theme="dark"]) .auth-logo img {
    filter: brightness(0) invert(1) brightness(1.4) saturate(0.6);
  }
  .auth-title {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 6px;
    color: var(--text);
  }
  .auth-title .accent { color: var(--blue); }
  .auth-sub { color: var(--muted); font-size: 14px; margin: 0; }
  .auth-error {
    background: color-mix(in srgb, var(--red) 12%, transparent);
    color: var(--red);
    border: 1px solid var(--red);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    margin-bottom: 18px;
  }
  .field-label {
    display: block;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 6px;
  }
  .field-input {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    margin-bottom: 18px;
    box-sizing: border-box;
  }
  .field-input:focus { border-color: var(--blue); }
  .auth-btn {
    width: 100%;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 13px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .auth-btn:hover { opacity: 0.85; }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-switch {
    text-align: center;
    color: var(--muted);
    font-size: 14px;
    margin: 24px 0 0;
  }
  .auth-switch a { color: var(--blue); font-weight: 600; text-decoration: none; }
  .auth-switch a:hover { text-decoration: underline; }
  .google-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 12px;
    margin: 18px 0 14px;
  }
  .google-divider::before,
  .google-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .google-btn-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }
  .google-loading {
    font-size: 12px;
    color: var(--muted);
  }
  .google-fallback {
    width: 100%;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .google-fallback:hover { border-color: var(--blue); }
</style>