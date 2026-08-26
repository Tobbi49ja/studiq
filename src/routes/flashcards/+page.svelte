<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let notes = $state([]);
  let loading = $state(true);
  let error = $state('');

  const SUBJECT_COLORS = ['var(--blue)', 'var(--green)', 'var(--teal)', 'var(--purple)'];

  function subjectColor(subject) {
    let h = 0;
    for (const c of subject) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
  }

  function dateLabel(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  onMount(async () => {
    gsap.fromTo('.hub-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    try {
      const { data } = await api.get('/notes');
      notes = data.data || [];
      await new Promise(r => setTimeout(r, 10));
      gsap.fromTo('.flash-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' });
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
  <div class="hub-head" style="margin-bottom: 28px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Flash<span style="color: var(--green)">cards</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500;">
      Choose a set of notes to review as digital flashcards.
    </p>
  </div>

  {#if loading}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px">
      {#each Array(6) as _, i (i)}
        <div class="skeleton animate-pulse" style="height: 160px; border-radius: 14px"></div>
      {/each}
    </div>
  {:else if error}
    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 40px; text-align: center; color: var(--muted); font-size: 14px">{error}</div>
  {:else if !notes.length}
    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 56px 32px; text-align: center">
      <div style="width: 60px; height: 60px; border-radius: 16px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px">
        <Icon name="flashcards" size={28} />
      </div>
      <p style="color: var(--text); font-size: 16px; font-weight: 700; margin: 0 0 6px">No notes to study yet</p>
      <p style="color: var(--muted); font-size: 13px; margin: 0 0 24px; font-weight: 500;">Upload notes first, then come back here to review them as flashcards.</p>
      <button onclick={() => goto('/upload')} class="btn-primary" style="font-size: 14px; padding: 11px 24px; border-radius: 10px">
        Upload Notes →
      </button>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px">
      {#each notes as n (n._id)}
        <button
          class="flash-card"
          onclick={() => goto(`/flashcards/${n._id}`)}
          style="
            text-align: left; font-family: inherit; cursor: pointer;
            background: var(--card); border: 1px solid var(--border); border-radius: 14px;
            padding: 20px; transition: transform .18s, border-color .18s, box-shadow .18s;
            display: flex; flex-direction: column;
          "
        >
          <div style="
            width: 36px; height: 36px; border-radius: 10px; 
            background: color-mix(in srgb, {subjectColor(n.subject)} 14%, transparent);
            color: {subjectColor(n.subject)};
            display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
          ">
            <Icon name="flashcards" size={16} />
          </div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{n.title}</div>
          <div style="font-size: 12px; color: var(--muted); font-weight: 500;">{n.subject} · {dateLabel(n.createdAt)}</div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: auto; font-weight: 500;">{n.topics?.length || 0} topics</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px">
            <span style="font-size: 12px; font-weight: 600; color: var(--green); background: var(--green-light); padding: 4px 8px; border-radius: 6px">Review</span>
            <span style="font-size: 13px; font-weight: 700; color: {subjectColor(n.subject)}">Study →</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .flash-card:hover {
    transform: translateY(-4px);
    border-color: var(--green);
    box-shadow: 0 12px 32px -8px rgba(16, 185, 129, 0.15);
  }
</style>