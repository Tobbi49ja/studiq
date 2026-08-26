<script>
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import { setAuth } from '$lib/stores/auth.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let googleLoading = $state(false);
  let error = $state('');

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

  onMount(() => {
    initGoogle();
  });

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

  function handleLogoError(e) {
    e.target.style.display = 'none';
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
        <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} />
      </div>
      <h1 class="auth-title">Welcome Back</h1>
      <p class="auth-sub">Sign in to your AI study companion</p>
    </div>

    {#if error}
      <div class="auth-error">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    {/if}

    <form onsubmit={submit}>
      <div class="form-group">
        <label class="field-label" for="email">Email Address</label>
        <input id="email" type="email" bind:value={email} required class="field-input" placeholder="you@example.com" />
      </div>

      <div class="form-group">
        <label class="field-label" for="password">Password</label>
        <input id="password" type="password" bind:value={password} required class="field-input" placeholder="••••••••" />
      </div>

      <button type="submit" class="auth-btn btn-primary" disabled={loading}>
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
    <button type="button" class="google-fallback btn-secondary" onclick={initGoogle}>
      Continue with Google
    </button>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 70px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: 24px;
  }
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px;
    color: var(--text);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  }
  .auth-head { 
    text-align: center; 
    margin-bottom: 28px; 
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .auth-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
  }
  .auth-logo img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
  }

  .auth-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 4px;
    color: var(--text);
    letter-spacing: -0.02em;
  }
  .auth-sub { 
    color: var(--muted); 
    font-size: 13.5px; 
    margin: 0;
    font-weight: 500;
  }
  
  .auth-error {
    background: var(--red-light);
    color: var(--red);
    border: 1px solid var(--red);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .field-label {
    display: block;
    color: var(--muted);
    font-size: 12.5px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .field-input {
    width: 100%;
    box-sizing: border-box;
  }
  .auth-btn {
    width: 100%;
    margin-top: 8px;
  }
  .auth-switch {
    text-align: center;
    color: var(--muted);
    font-size: 13.5px;
    margin: 24px 0 0;
    font-weight: 500;
  }
  .auth-switch a { 
    color: var(--blue); 
    font-weight: 700; 
    text-decoration: none; 
  }
  .auth-switch a:hover { 
    text-decoration: underline; 
  }
  
  .google-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    margin: 20px 0 16px;
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
  }
</style>