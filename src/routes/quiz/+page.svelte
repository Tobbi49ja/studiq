<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let quizzes = $state([]);
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
      const { data } = await api.get('/quiz');
      quizzes = data.data || [];
      await new Promise(r => setTimeout(r, 10));
      gsap.fromTo('.quiz-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' });
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Quiz Mode — Studiq</title>
</svelte:head>

<div class="page-padding">
  <div class="hub-head" style="margin-bottom: 28px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Quiz <span style="color: var(--blue)">Mode</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500;">
      Pick a saved quiz to practise, or upload new notes to generate a fresh one.
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
  {:else if !quizzes.length}
    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 56px 32px; text-align: center">
      <div style="width: 60px; height: 60px; border-radius: 16px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px">
        <Icon name="quiz" size={28} />
      </div>
      <p style="color: var(--text); font-size: 16px; font-weight: 700; margin: 0 0 6px">No quizzes yet</p>
      <p style="color: var(--muted); font-size: 13px; margin: 0 0 24px; font-weight: 500;">Upload your notes and Studiq will auto-generate a WAEC/JAMB-level quiz.</p>
      <button
        onclick={() => goto('/upload')}
        class="btn-primary"
        style="font-size: 14px; padding: 11px 24px; border-radius: 10px"
      >Upload Notes →</button>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px">
      {#each quizzes as q (q._id)}
        <button
          class="quiz-card"
          onclick={() => goto(`/quiz/${q._id}`)}
          style="
            text-align: left; font-family: inherit; cursor: pointer;
            background: var(--card); border: 1px solid var(--border); border-radius: 14px;
            padding: 20px; transition: transform .18s, border-color .18s, box-shadow .18s;
            display: flex; flex-direction: column;
          "
        >
          <div style="
            width: 36px; height: 36px; border-radius: 10px; 
            background: color-mix(in srgb, {subjectColor(q.subject)} 14%, transparent);
            color: {subjectColor(q.subject)};
            display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
          ">
            <Icon name="quiz" size={16} />
          </div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{q.title}</div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: auto; font-weight: 500;">{q.subject} · {dateLabel(q.createdAt)}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px">
            <span style="font-size: 12px; font-weight: 600; color: var(--blue); background: var(--blue-light); padding: 4px 8px; border-radius: 6px">{q.questionCount} questions</span>
            <span style="font-size: 13px; font-weight: 700; color: {subjectColor(q.subject)}">Start →</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .quiz-card:hover {
    transform: translateY(-4px);
    border-color: var(--blue);
    box-shadow: 0 12px 32px -8px rgba(79, 70, 229, 0.15);
  }
</style>