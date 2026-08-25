<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api/index.js';
  import gsap from 'gsap';

  let summary = [];
  let history = [];
  let loading = true;
  let error = '';

  // FEATURE 4: Personalised study plan
  let studyPlan = null;
  let planLoading = false;
  let planError = '';
  let planGeneratedAt = null;

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  $: overall = (() => {
    const totalQ = summary.reduce((a, s) => a + (s.totalQuestions || 0), 0);
    const totalS = summary.reduce((a, s) => a + (s.totalScore || 0), 0);
    return totalQ ? Math.round((totalS / totalQ) * 100) : 0;
  })();
  $: weakTopics = summary.flatMap((s) => s.weakTopics || []).sort((a, b) => a.avgScore - b.avgScore).slice(0, 6);
  $: bestSubject = [...summary].sort((a, b) => b.avgScore - a.avgScore)[0];

  function subjectEmoji(subject) {
    const map = {
      Chemistry: '⚗️',
      Biology: '🔬',
      Physics: '⚡',
      Maths: '📐',
      Mathematics: '📐',
      Geography: '🗺️',
      History: '📜',
      Govt: '🌍',
      Government: '🌍',
      English: '✏️'
    };
    return map[subject] || '📚';
  }

  function barColor(score) {
    if (score >= 70) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  function scoreClass(score) {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  }

  function dateLabel(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // FEATURE 4: generate / load study plan
  function loadSavedPlan() {
    try {
      const saved = localStorage.getItem('studiq-study-plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.plan)) {
          studyPlan = parsed;
          planGeneratedAt = parsed.generatedAt || null;
        }
      }
    } catch (e) {
      // ignore corrupted storage
    }
  }

  function savePlan(plan) {
    try {
      const payload = { ...plan, generatedAt: new Date().toISOString() };
      localStorage.setItem('studiq-study-plan', JSON.stringify(payload));
      planGeneratedAt = payload.generatedAt;
    } catch (e) {
      // storage may be unavailable — plan still shown this session
    }
  }

  async function generatePlan() {
    planError = '';
    planLoading = true;
    try {
      const { data } = await api.post('/performance/studyplan', { daysAvailable: 7 });
      studyPlan = data.data;
      savePlan(data.data);
    } catch (e) {
      planError = e?.response?.data?.error || 'Failed to generate study plan';
    } finally {
      planLoading = false;
    }
  }

  function clearPlan() {
    studyPlan = null;
    planGeneratedAt = null;
    try {
      localStorage.removeItem('studiq-study-plan');
    } catch (e) {
      // ignore
    }
  }

  onMount(async () => {
    loadSavedPlan();
    try {
      const [s, h] = await Promise.all([api.get('/performance/summary'), api.get('/performance/history')]);
      summary = s.data.data;
      history = h.data.data;
    } catch (e) {
      error = e?.response?.data?.error || 'Failed to load performance';
    } finally {
      loading = false;
    }

    // ANIMATION 1: score ring, count-up, stat cards, weak cards
    const score = Math.min(overall, 100) / 100;
    const offset = 251 - 251 * score;

    gsap.fromTo('#scoreRing',
      { strokeDashoffset: 251 },
      { strokeDashoffset: offset, duration: 1.8, ease: 'power3.out' }
    );

    const obj = { val: 0 };
    gsap.to(obj, {
      val: overall,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => {
        const el = document.getElementById('scoreValue');
        if (el) el.textContent = Math.round(obj.val) + '%';
      }
    });

    gsap.fromTo('.stat-card',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );

    gsap.fromTo('.weak-card',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)', delay: 0.5 }
    );
  });
</script>

<svelte:head>
  <title>Performance — Studiq</title>
</svelte:head>

{#if loading}
  <div class="grid gap-4 md:grid-cols-2">
    <div class="h-64 animate-pulse rounded-2xl bg-slate-200"></div>
    <div class="h-64 animate-pulse rounded-2xl bg-slate-200"></div>
  </div>
{:else if error}
  <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-danger">{error}</div>
{:else}
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Score ring -->
    <div class="stat-card">
      <h3 class="mb-4 text-base font-bold text-ink">Overall Score</h3>
      <div class="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#e2e8f0" stroke-width="12" />
          <circle
            id="scoreRing"
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="#2563eb"
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray={CIRC}
            stroke-dashoffset={CIRC}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span id="scoreValue" class="text-3xl font-bold text-ink">{overall}%</span>
          <span class="text-xs text-muted">avg</span>
        </div>
      </div>
      <p class="mt-4 text-center text-sm text-muted">
        {#if bestSubject}
          Best subject: <span class="font-semibold text-ink">{bestSubject.subject}</span> at {bestSubject.avgScore}%
        {:else}
          Complete a quiz to see your score.
        {/if}
      </p>
    </div>

    <!-- Subject breakdown -->
    <div class="stat-card">
      <h3 class="mb-4 text-base font-bold text-ink">Subject Breakdown</h3>
      {#if summary.length}
        <div class="space-y-4">
          {#each summary as s}
            <div>
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="font-semibold text-ink">{subjectEmoji(s.subject)} {s.subject}</span>
                <span class="font-bold {scoreClass(s.avgScore)}">{s.avgScore}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-slate-100">
                <div class="h-2.5 rounded-full {barColor(s.avgScore)}" style="width:{s.avgScore}%"></div>
              </div>
              <div class="mt-0.5 text-xs text-muted">{s.quizCount} quiz{s.quizCount === 1 ? '' : 'zes'} taken</div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="py-10 text-center text-sm text-muted">No subjects yet — take your first quiz.</div>
      {/if}
    </div>

    <!-- Weak areas (third column) -->
    <div class="stat-card">
      <h3 class="mb-4 text-base font-bold text-ink">Weak Areas</h3>
      {#if weakTopics.length}
        <div class="flex flex-col gap-3">
          {#each weakTopics as t}
            <div class="weak-card rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-amber-600">Needs work</div>
              <div class="mt-1 truncate text-sm font-bold text-ink">{t.topic}</div>
              <div class="mt-2 flex items-center gap-2">
                <div class="h-1.5 flex-1 rounded-full bg-amber-200">
                  <div class="h-1.5 rounded-full bg-warning" style="width:{t.avgScore}%"></div>
                </div>
                <span class="text-xs font-bold text-warning">{t.avgScore}%</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="py-8 text-center text-sm text-muted">No weak areas yet — keep quizzing!</div>
      {/if}
    </div>
  </div>

  <!-- FEATURE 4: Personalised Study Plan -->
  <div class="mt-6">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-bold text-ink">Personalised Study Plan</h3>
        <p class="text-xs text-muted">A 7-day plan built from your weak topics.</p>
      </div>
      <div class="flex items-center gap-2">
        {#if studyPlan}
          <button onclick={clearPlan} class="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-50">Clear</button>
        {/if}
        <button
          onclick={generatePlan}
          disabled={planLoading}
          class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {planLoading ? '🤖 Generating…' : '✨ Generate My Study Plan'}
        </button>
      </div>
    </div>

    {#if planError}
      <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">{planError}</div>
    {:else if planLoading}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i}
          <div class="h-40 animate-pulse rounded-2xl bg-slate-200"></div>
        {/each}
      </div>
    {:else if studyPlan && studyPlan.plan?.length}
      <div class="mb-2 text-xs text-muted">
        {#if planGeneratedAt}
          Generated {new Date(planGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ·
        {/if}
        Focusing on: {studyPlan.weakTopics?.slice(0, 4).join(', ') || 'your weak topics'}
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each studyPlan.plan as day}
          <div class="flex flex-col rounded-2xl border border-line bg-white p-4">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-bold text-ink">Day {day.day}</span>
              <span class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-primary">{day.date}</span>
            </div>
            <div class="space-y-2">
              {#each day.sessions || [] as s}
                <div class="rounded-xl bg-slate-50 p-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate text-xs font-bold text-ink">{s.subject}</span>
                    <span class="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted">{s.duration}</span>
                  </div>
                  <div class="mt-0.5 truncate text-xs font-medium text-primary">{s.topic}</div>
                  <div class="mt-1 text-[11px] text-muted">{s.activity}</div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-line bg-white p-6 text-center">
        <div class="text-3xl">🗓️</div>
        <p class="mt-2 text-sm font-semibold text-ink">No study plan yet</p>
        <p class="mt-1 text-xs text-muted">Take a few quizzes, then generate a personalised 7-day plan targeting your weakest topics.</p>
      </div>
    {/if}
  </div>

  <!-- History -->
  <div class="mt-6">
    <h3 class="mb-3 text-base font-bold text-ink">Quiz History</h3>
    {#if history.length}
      <div class="rounded-2xl border border-line bg-white">
        {#each history as h}
          <div class="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">{subjectEmoji(h.subject)}</div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-ink">{h.noteTitle || 'Untitled Quiz'}</div>
              <div class="text-xs text-muted">{h.subject || 'General'} · {dateLabel(h.createdAt)}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold {scoreClass(Math.round((h.score / h.total) * 100))}">{h.score}/{h.total}</div>
              <div class="text-xs text-muted">{Math.round((h.score / h.total) * 100)}%</div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">No quizzes taken yet.</div>
    {/if}
  </div>
{/if}
