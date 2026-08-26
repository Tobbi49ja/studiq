<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api/index.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let summary = $state([]);
  let history = $state([]);
  let loading = $state(true);
  let error = $state('');

  let studyPlan = $state(null);
  let planLoading = $state(false);
  let planError = $state('');
  let planGeneratedAt = $state(null);

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  let overall = $derived((() => {
    const totalQ = summary.reduce((a, s) => a + (s.totalQuestions || 0), 0);
    const totalS = summary.reduce((a, s) => a + (s.totalScore || 0), 0);
    return totalQ ? Math.round((totalS / totalQ) * 100) : 0;
  })());

  let weakTopics = $derived(summary.flatMap((s) => s.weakTopics || []).sort((a, b) => a.avgScore - b.avgScore).slice(0, 6));
  let bestSubject = $derived([...summary].sort((a, b) => b.avgScore - a.avgScore)[0]);

  function barColor(score) {
    if (score >= 70) return 'var(--green)';
    if (score >= 50) return 'var(--amber)';
    return 'var(--red)';
  }

  function dateLabel(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

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
    } catch {}
  }

  function savePlan(plan) {
    try {
      const payload = { ...plan, generatedAt: new Date().toISOString() };
      localStorage.setItem('studiq-study-plan', JSON.stringify(payload));
      planGeneratedAt = payload.generatedAt;
    } catch {}
  }

  async function generatePlan() {
    planError = ''; planLoading = true;
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
    studyPlan = null; planGeneratedAt = null;
    try { localStorage.removeItem('studiq-study-plan'); } catch {}
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

    const score = Math.min(overall, 100) / 100;
    const offset = CIRC - CIRC * score;

    gsap.fromTo('#scoreRing',
      { strokeDashoffset: CIRC },
      { strokeDashoffset: offset, duration: 1.8, ease: 'power3.out' }
    );

    const obj = { val: 0 };
    gsap.to(obj, {
      val: overall, duration: 1.8, ease: 'power3.out',
      onUpdate: () => { const el = document.getElementById('scoreValue'); if (el) el.textContent = Math.round(obj.val) + '%'; }
    });

    gsap.fromTo('.stat-card',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );

    gsap.fromTo('.weak-card',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)', delay: 0.4 }
    );
  });
</script>

<svelte:head>
  <title>Performance — Studiq</title>
</svelte:head>

<div style="max-width: 1200px; margin: 0 auto">
  <!-- Page header -->
  <div style="margin-bottom: 28px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      <span style="color: var(--purple)">Performance</span> Overview
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500">Track your progress and identify where to focus next.</p>
  </div>

  {#if loading}
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px">
      {#each Array(3) as _, i (i)}
        <div class="skeleton animate-pulse" style="height: 280px; border-radius: 14px"></div>
      {/each}
    </div>
  {:else if error}
    <div style="background: color-mix(in srgb, var(--red) 8%, transparent); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 12px; padding: 24px; text-align: center; color: var(--red)">{error}</div>
  {:else}
    <!-- Stats grid -->
    <div class="perf-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px">
      <!-- Score ring -->
      <div class="stat-card premium-card">
        <div class="stat-card-inner">
          <h2 class="stat-card-title">Overall Score</h2>
          <div class="score-ring-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" stroke-width="12" />
              <circle id="scoreRing" cx="70" cy="70" r={R} fill="none" stroke="var(--purple)"
                stroke-width="12" stroke-linecap="round" stroke-dasharray={CIRC} stroke-dashoffset={CIRC}
                transform="rotate(-90 70 70)" />
            </svg>
            <div class="score-ring-inner">
              <span id="scoreValue">0%</span>
              <span class="score-sub">average</span>
            </div>
          </div>
          <p class="score-foot">
            {#if bestSubject}
              Best: <strong>{bestSubject.subject}</strong> at {bestSubject.avgScore}%
            {:else}
              Complete a quiz to see your score.
            {/if}
          </p>
        </div>
      </div>

      <!-- Subject breakdown -->
      <div class="stat-card premium-card">
        <div class="stat-card-inner">
          <h2 class="stat-card-title">Subject Breakdown</h2>
          {#if summary.length}
            <div class="subject-list">
              {#each summary as s}
                <div class="subject-row">
                  <div class="subject-head">
                    <span class="subject-name">{s.subject}</span>
                    <span class="subject-score" style="color: {barColor(s.avgScore)}">{s.avgScore}%</span>
                  </div>
                  <div class="subject-bar">
                    <div class="subject-bar-fill" style="width: {s.avgScore}%; background: {barColor(s.avgScore)}"></div>
                  </div>
                  <div class="subject-meta">{s.quizCount} quiz{s.quizCount === 1 ? '' : 'zes'} taken</div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">No subjects yet — take your first quiz.</div>
          {/if}
        </div>
      </div>

      <!-- Weak areas -->
      <div class="stat-card premium-card">
        <div class="stat-card-inner">
          <h2 class="stat-card-title">Weak Areas</h2>
          {#if weakTopics.length}
            <div class="weak-list">
              {#each weakTopics as t}
                <div class="weak-card">
                  <div class="weak-tag">Needs work</div>
                  <div class="weak-topic">{t.topic}</div>
                  <div class="weak-bar-wrap">
                    <div class="weak-bar">
                      <div class="weak-bar-fill" style="width: {t.avgScore}%"></div>
                    </div>
                    <span class="weak-score">{t.avgScore}%</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">No weak areas yet — keep quizzing!</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Personalised Study Plan -->
    <div class="premium-card" style="padding: 28px; margin-bottom: 24px">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 20px">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 4px">Personalised Study Plan</h2>
          <p style="color: var(--muted); font-size: 13px; margin: 0; font-weight: 500">A 7-day AI plan built from your weak topics.</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          {#if studyPlan}
            <button onclick={clearPlan} class="btn-secondary" style="font-size: 12px; padding: 8px 14px; border-radius: 8px">Clear</button>
          {/if}
          <button onclick={generatePlan} disabled={planLoading} class="btn-primary" style="font-size: 13px; padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 7px; {planLoading ? 'opacity: .7' : ''}">
            <Icon name="ask" size={13} />
            {planLoading ? 'Generating…' : 'Generate My Study Plan'}
          </button>
        </div>
      </div>

      {#if planError}
        <div style="background: color-mix(in srgb, var(--red) 8%, transparent); color: var(--red); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 10px; padding: 12px 16px; font-size: 13px">{planError}</div>
      {:else if planLoading}
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px">
          {#each Array(6) as _, i (i)}
            <div class="skeleton animate-pulse" style="height: 140px; border-radius: 10px"></div>
          {/each}
        </div>
      {:else if studyPlan?.plan?.length}
        {#if planGeneratedAt}
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 14px; font-weight: 500">
            Generated {new Date(planGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · Focusing on: {studyPlan.weakTopics?.slice(0, 3).join(', ') || 'weak topics'}
          </div>
        {/if}
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px">
          {#each studyPlan.plan as day}
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px">
                <span style="font-size: 13px; font-weight: 800; color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif">Day {day.day}</span>
                <span style="font-size: 10px; font-weight: 700; color: var(--blue); background: var(--blue-light); padding: 3px 8px; border-radius: 6px">{day.date}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px">
                {#each day.sessions || [] as s}
                  <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 3px">
                      <span style="font-size: 11px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{s.subject}</span>
                      <span style="flex-shrink: 0; font-size: 10px; font-weight: 600; color: var(--muted); background: var(--border); padding: 2px 6px; border-radius: 4px">{s.duration}</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--blue); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{s.topic}</div>
                    <div style="font-size: 11px; color: var(--muted); margin-top: 2px">{s.activity}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 36px; text-align: center">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px">
            <Icon name="performance" size={22} />
          </div>
          <p style="font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 6px">No study plan yet</p>
          <p style="font-size: 13px; color: var(--muted); margin: 0; font-weight: 500">Take a few quizzes, then generate a personalised 7-day plan targeting your weakest topics.</p>
        </div>
      {/if}
    </div>

    <!-- Quiz history -->
    <div class="premium-card" style="padding: 28px">
      <h2 style="font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 20px">Quiz History</h2>
      {#if history.length}
        <div style="display: flex; flex-direction: column">
          {#each history as h, i (h._id || i)}
            {@const pct = h.total ? Math.round((h.score / h.total) * 100) : 0}
            <div style="
              display: flex; align-items: center; gap: 14px; padding: 14px 0;
              border-bottom: {i < history.length - 1 ? '1px solid var(--border)' : 'none'};
            ">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0">
                <Icon name="quiz" size={16} />
              </div>
              <div style="flex: 1; min-width: 0">
                <div style="font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{h.noteTitle || 'Untitled Quiz'}</div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px; font-weight: 500">{h.subject || 'General'} · {dateLabel(h.createdAt)}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0">
                <div style="font-size: 13px; font-weight: 800; color: {barColor(pct)}">{h.score}/{h.total}</div>
                <div style="font-size: 11px; color: var(--muted); font-weight: 600">{pct}%</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div style="color: var(--muted); font-size: 13px; padding: 24px 0; text-align: center; font-weight: 500">No quizzes taken yet — upload notes and start practising.</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .stat-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .stat-card-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .stat-card-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 16px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .score-ring-wrap {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto;
    flex-shrink: 0;
  }

  .score-ring-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .score-ring-inner span:first-child {
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    line-height: 1;
  }

  .score-sub {
    font-size: 10px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .score-foot {
    margin-top: 14px;
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
    text-align: center;
  }

  .subject-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .subject-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .subject-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subject-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .subject-score {
    font-size: 13px;
    font-weight: 700;
  }

  .subject-bar {
    height: 6px;
    border-radius: 99px;
    background: var(--border);
    overflow: hidden;
  }

  .subject-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1s ease;
  }

  .subject-meta {
    font-size: 11px;
    color: var(--muted);
    font-weight: 500;
  }

  .weak-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .weak-card {
    background: color-mix(in srgb, var(--amber) 8%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--amber) 20%, var(--border));
    border-radius: 10px;
    padding: 12px;
  }

  .weak-tag {
    font-size: 10px;
    font-weight: 700;
    color: var(--amber);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .weak-topic {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
  }

  .weak-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .weak-bar {
    flex: 1;
    height: 5px;
    border-radius: 99px;
    background: color-mix(in srgb, var(--amber) 20%, var(--border));
    overflow: hidden;
  }

  .weak-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: var(--amber);
  }

  .weak-score {
    font-size: 11px;
    font-weight: 700;
    color: var(--amber);
    flex-shrink: 0;
  }

  .empty-state {
    color: var(--muted);
    font-size: 13px;
    padding: 24px 0;
    text-align: center;
    font-weight: 500;
  }

  @media (max-width: 1024px) {
    .perf-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .stat-card:first-child {
      grid-column: span 2;
    }
  }

  @media (max-width: 768px) {
    .perf-grid {
      grid-template-columns: 1fr !important;
    }
    .stat-card:first-child {
      grid-column: span 1;
    }
  }
</style>
