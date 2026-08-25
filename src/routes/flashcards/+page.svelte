<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import gsap from 'gsap';

  let notes = [];
  let loading = true;
  let error = '';

  function subjectColor(subject) {
    const colors = ['var(--blue)', 'var(--green)', 'var(--teal)', 'var(--purple)'];
    let h = 0;
    for (const c of subject) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return colors[h % colors.length];
  }

  function dateLabel(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  onMount(async () => {
    gsap.fromTo('.hub-head',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    gsap.fromTo('.flash-card',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
    );
    try {
      const { data } = await api.get('/notes');
      notes = data.data || [];
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Flashcards — Studiq</title>
</svelte:head>

<div class="page-padding">
  <div class="hub-head">
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:var(--text); margin:0 0 6px">
      Flash<span style="color:var(--green)">cards</span> ⊞
    </h1>
    <p style="color:var(--muted); font-size:13px; margin:0 0 28px">
      Choose a set of notes to review as digital flashcards.
    </p>
  </div>

  {#if loading}
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px">
      <div class="skeleton" style="height:150px; border-radius:14px"></div>
      <div class="skeleton" style="height:150px; border-radius:14px"></div>
      <div class="skeleton" style="height:150px; border-radius:14px"></div>
    </div>
  {:else if error}
    <div style="background:var(--card); border:1px solid var(--border); border-radius:14px; padding:40px; text-align:center; color:var(--muted); font-size:14px">{error}</div>
  {:else if !notes.length}
    <div style="background:var(--card); border:1px solid var(--border); border-radius:14px; padding:48px; text-align:center">
      <div style="font-size:40px; margin-bottom:8px">🃏</div>
      <p style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 4px">No notes to study yet</p>
      <p style="color:var(--muted); font-size:13px; margin:0 0 20px">Upload notes first, then come back here to review them as flashcards.</p>
      <button
        onclick={() => goto('/upload')}
        style="background:var(--blue); color:#050A0F; border:none; border-radius:10px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit"
      >Upload Notes →</button>
    </div>
  {:else}
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px">
      {#each notes as n}
        <button
          class="flash-card"
          onclick={() => goto(`/flashcards/${n._id}`)}
          style="
            text-align:left; font-family:inherit; cursor:pointer;
            background:var(--card); border:1px solid var(--border); border-radius:14px;
            padding:18px; transition:transform .18s, border-color .18s, box-shadow .18s;
          "
        >
          <div style="width:34px; height:34px; border-radius:9px; background:color-mix(in srgb, {subjectColor(n.subject)} 16%, transparent); display:flex; align-items:center; justify-content:center; font-size:15px; margin-bottom:14px">⊞</div>
          <div style="font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{n.title}</div>
          <div style="font-size:12px; color:var(--muted); margin-bottom:6px">{n.subject} · {dateLabel(n.createdAt)}</div>
          <div style="font-size:12px; color:var(--muted); margin-bottom:12px">{n.topics?.length || 0} topics</div>
          <div style="display:flex; align-items:center; justify-content:space-between">
            <span style="font-size:12px; font-weight:600; color:var(--green)">Review</span>
            <span style="font-size:13px; color:{subjectColor(n.subject)}">Study →</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .flash-card:hover {
    transform: translateY(-3px);
    border-color: var(--green);
    box-shadow: 0 8px 24px rgba(0,255,136,.12);
  }
</style>