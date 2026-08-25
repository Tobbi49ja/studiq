<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { api } from '$lib/api/index.js';
  import { user, token } from '$lib/stores/auth.js';

  import ArcGauge from '$lib/components/dashboard/ArcGauge.svelte';
  import RadarChart from '$lib/components/dashboard/RadarChart.svelte';
  import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
  import AISuggestPanel from '$lib/components/dashboard/AISuggestPanel.svelte';
  import GapsPanel from '$lib/components/dashboard/GapsPanel.svelte';
  import StudyPlan from '$lib/components/dashboard/StudyPlan.svelte';

  gsap.registerPlugin(ScrollTrigger);

  const SUBJECT_COLORS = ['#0EA5E9', '#00FF88', '#06B6D4', '#818CF8'];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  let loading = true;
  let error = '';
  let summary = [];
  let history = [];
  let plan = [];

  const RING_R = 40;
  const RING_CIRC = 2 * Math.PI * RING_R;

  // Date string
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  $: firstName = $user?.name?.split(' ')[0] || 'there';

  $: subjects = summary.map((s, i) => ({ ...s, accentColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }));

  $: sessionsCount = summary.reduce((a, s) => a + (s.quizCount || 0), 0);
  $: overallProgress = (() => {
    const totalQ = summary.reduce((a, s) => a + s.totalQuestions, 0);
    const totalS = summary.reduce((a, s) => a + (s.avgScore || 0) * s.totalQuestions, 0);
    return totalQ ? Math.round(totalS / totalQ) : 0;
  })();
  $: masteredCount = summary.reduce(
    (a, s) => a + (s.weakTopics || []).filter((t) => t.avgScore >= 70).length,
    0
  );
  $: dayStreak = new Set(history.map((h) => h.createdAt ? String(h.createdAt).slice(0, 10) : '')).size;

  // Learning gaps from weak topics across subjects
  $: gaps = summary.flatMap((s) =>
    (s.weakTopics || []).map((t) => ({
      subject: s.subject,
      topic: t.topic,
      avgScore: t.avgScore,
      sessions: t.avgScore < 50 ? 0 : 1
    }))
  );

  // AI suggestions built from real weak topics
  $: aiSuggestions = (() => {
    const out = [];
    const high = gaps.find((g) => g.avgScore < 50);
    if (high) {
      out.push({
        icon: '⚡',
        text: `${high.subject}: "${high.topic}" is below 50% — schedule a focused review this week`,
        color: 'var(--accent-red)'
      });
    }
    const improved = history[0];
    if (improved && improved.total) {
      out.push({
        icon: '📈',
        text: `Quiz on ${improved.subject || 'recent material'} scored ${Math.round((improved.score / improved.total) * 100)}% — keep it up`,
        color: 'var(--accent-green)'
      });
    }
    if (history.length) {
      out.push({
        icon: '🔁',
        text: `${history.length} quizzes taken recently — spaced-review your weak topics to lock them in`,
        color: 'var(--accent-teal)'
      });
    }
    return out.slice(0, 1);
  })();

  // Bar colour helper
  function barColor(score) {
    if (score >= 70) return 'var(--accent-green)';
    if (score >= 50) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  }

  function quickAction(href) {
    goto(href);
  }

  function goStudy() {
    goto('/performance');
  }

  onMount(async () => {
    // Not authenticated -> send to public landing page.
    if (!$token) {
      goto('/home');
      return;
    }

    try {
      const [sumRes, histRes] = await Promise.all([
        api.get('/performance/summary'),
        api.get('/performance/history')
      ]);
      summary = sumRes.data.data || [];
      history = histRes.data.data || [];
    } catch (e) {
      error = e?.response?.data?.error || 'Failed to load dashboard';
    } finally {
      loading = false;
    }

    // Study plan is a slow AI-backed request — load it in the background so
    // the initial page renders instantly and the week section fills in.
    loadStudyPlan();

    await tick();
    if (error) return;
    runIntroAnimations();
  });

  async function loadStudyPlan() {
    try {
      const planRes = await api.post('/performance/studyplan', { daysAvailable: 7 });
      plan = planRes.data.data?.plan || [];
    } catch {
      plan = [];
    }
  }

  function runIntroAnimations() {
    // Topbar
    gsap.fromTo('.topbar',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );

    // Stat strip stagger
    gsap.fromTo('.stat-chip',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );

    // Score ring stroke animation
    const score = Math.min(overallProgress, 100) / 100;
    const ringOffset = RING_CIRC - RING_CIRC * score;
    gsap.fromTo('#overallRing',
      { strokeDashoffset: RING_CIRC },
      { strokeDashoffset: ringOffset, duration: 1.8, ease: 'power3.out', delay: 0.4 }
    );

    // Count-up for all stat numbers
    document.querySelectorAll('[data-count]').forEach((el, i) => {
      const target = +el.dataset.count;
      gsap.fromTo({ n: 0 }, { n: target }, {
        duration: 1.4, delay: 0.3 + i * 0.1,
        ease: 'power3.out',
        onUpdate() { el.textContent = Math.round(this.targets()[0].n); }
      });
    });

    // Scroll-triggered sections
    gsap.fromTo('.quick-actions',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '.quick-actions', start: 'top 85%' } }
    );

    gsap.fromTo('.gaps-section, .week-section',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.gaps-section', start: 'top 85%' } }
    );
  }
</script>

<svelte:head>
  <title>Dashboard — Studiq</title>
</svelte:head>

<div class="page-padding" style="max-width:1280px; margin:0 auto;">
  {#if loading}
    <div class="topbar" style="height:120px; display:flex; align-items:flex-end; gap:16px; margin-bottom:28px">
      <div class="skeleton" style="height:70px; flex:1"></div>
    </div>
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px">
      <div class="skeleton" style="height:110px"></div>
      <div class="skeleton" style="height:110px"></div>
      <div class="skeleton" style="height:110px"></div>
      <div class="skeleton" style="height:110px"></div>
    </div>
    <div class="skeleton" style="height:320px; margin-bottom:28px"></div>
  {:else if error}
    <div class="topbar" style="min-height:40vh; display:flex; align-items:center; justify-content:center">
      <div style="background:var(--card); border:1px solid var(--border); border-radius:20px; padding:40px; text-align:center; color:var(--muted); font-size:14px; max-width:460px">
        {error}
      </div>
    </div>
  {:else}
    <!-- SECTION 1 — Topbar (sticky) -->
    <header class="topbar dashboard-topbar" style="display:flex; justify-content:space-between; align-items:center; gap:16px; padding:8px 0 24px; border-bottom:1px solid var(--border); margin-bottom:28px;">
      <div>
        <h1 class="dashboard-title" style="font-size:24px; font-weight:800; margin:0 0 4px; letter-spacing:-.02em">
          {greeting}, <span style="color:var(--green)">{firstName}</span> ✦
        </h1>
        <p style="color:var(--muted); font-size:13px; margin:0">{today}</p>
      </div>
      <div style="display:flex; align-items:center; gap:8px; color:var(--green); font-size:13px; font-weight:600">
        <span style="position:relative; display:flex; width:8px; height:8px">
          <span style="position:absolute; inset:0; border-radius:50%; background:var(--green); animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite"></span>
          <span style="position:relative; width:8px; height:8px; border-radius:50%; background:var(--green)"></span>
        </span>
        Session active
      </div>
    </header>

    <!-- SECTION 2 — Stat strip -->
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px">
      <div class="stat-chip" style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--green); border-radius:12px; padding:16px; display:flex; align-items:center; gap:12px">
        <div style="width:40px; height:40px; border-radius:10px; background:rgba(0,255,136,.12); display:flex; align-items:center; justify-content:center; font-size:18px">✓</div>
        <div>
          <div style="font-size:22px; font-weight:800; color:var(--text)" data-count={masteredCount}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px">Topics Mastered</div>
        </div>
      </div>
      <div class="stat-chip" style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--blue); border-radius:12px; padding:16px; display:flex; align-items:center; gap:12px">
        <div style="width:40px; height:40px; border-radius:10px; background:rgba(14,165,233,.12); display:flex; align-items:center; justify-content:center; font-size:18px">◷</div>
        <div>
          <div style="font-size:22px; font-weight:800; color:var(--text)" data-count={sessionsCount}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px">Study Sessions</div>
        </div>
      </div>
      <div class="stat-chip" style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--teal); border-radius:12px; padding:16px; display:flex; align-items:center; gap:12px">
        <div style="width:40px; height:40px; border-radius:10px; background:rgba(6,182,212,.12); display:flex; align-items:center; justify-content:center; font-size:18px">🔥</div>
        <div>
          <div style="font-size:22px; font-weight:800; color:var(--text)" data-count={dayStreak}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px">Day Streak</div>
        </div>
      </div>
      <div class="stat-chip" style="background:var(--card); border:1px solid var(--border); border-top:3px solid var(--purple); border-radius:12px; padding:16px; display:flex; align-items:center; gap:12px">
        <div style="width:40px; height:40px; border-radius:10px; background:rgba(129,140,248,.12); display:flex; align-items:center; justify-content:center; font-size:18px">%</div>
        <div>
          <div style="font-size:22px; font-weight:800; color:var(--text)" data-count={overallProgress}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px">Overall Progress</div>
        </div>
      </div>
    </div>

    <!-- SECTION 3 — 3-column grid -->
    <div class="main-grid" style="display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:18px; margin-bottom:28px">
      <!-- Column 1: Score ring + subject breakdown -->
      <div style="display:flex; flex-direction:column; gap:18px">
        <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px; display:flex; flex-direction:column; align-items:center">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Overall Score</h2>
          <div style="position:relative; width:120px; height:120px">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--border)" stroke-width="12" />
              <circle
                id="overallRing"
                cx="60" cy="60" r={RING_R}
                fill="none"
                stroke="var(--green)"
                stroke-width="12"
                stroke-linecap="round"
                stroke-dasharray={RING_CIRC}
                stroke-dashoffset={RING_CIRC}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center">
              <span style="font-size:24px; font-weight:800; color:var(--text)">{overallProgress}%</span>
              <span style="font-size:11px; color:var(--muted)">avg</span>
            </div>
          </div>
        </div>

        <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 18px">Subject Breakdown</h2>
          {#if subjects.length}
            <div style="display:flex; flex-direction:column; gap:16px">
              {#each subjects as s}
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px">
                    <span style="font-size:13px; font-weight:600; color:var(--text)">{s.subject}</span>
                    <span style="font-size:13px; font-weight:700; color:{barColor(s.avgScore)}">{s.avgScore}%</span>
                  </div>
                  <div style="height:8px; border-radius:99px; background:var(--border)">
                    <div style="height:8px; border-radius:99px; width:{s.avgScore}%; background:{barColor(s.avgScore)}"></div>
                  </div>
                  <div style="margin-top:4px; font-size:11px; color:var(--muted)">{s.quizCount} quiz{s.quizCount === 1 ? '' : 'zes'} taken</div>
                </div>
              {/each}
            </div>
          {:else}
            <div style="color:var(--muted); font-size:13px; padding:24px 0; text-align:center">No subjects yet — upload notes to get started.</div>
          {/if}
        </div>
      </div>

      <!-- Column 2: Weak areas + AI insight -->
      <div style="display:flex; flex-direction:column; gap:18px">
        <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Weak Areas</h2>
          {#if gaps.length}
            <div style="display:flex; flex-direction:column; gap:10px">
              {#each gaps.slice(0, 4) as g}
                <div style="background:var(--surface); border-left:3px solid var(--amber); border-radius:10px; padding:12px 14px">
                  <div style="font-size:12px; font-weight:600; color:var(--text)">{g.topic}</div>
                  <div style="font-size:11px; color:var(--muted); margin-top:2px">{g.subject} · {g.avgScore}%</div>
                </div>
              {/each}
            </div>
          {:else}
            <div style="color:var(--muted); font-size:13px; padding:24px 0; text-align:center">No weak areas detected — keep it up!</div>
          {/if}
        </div>
        <AISuggestPanel suggestions={aiSuggestions} />
      </div>

      <!-- Column 3: Radar + activity -->
      <div style="display:flex; flex-direction:column; gap:18px">
        <div class="radar-wrap"><RadarChart subjects={subjects} /></div>
        <ActivityFeed activities={history.slice(0, 4)} />
      </div>
    </div>

    <!-- SECTION 4 — Quick actions -->
    <div class="quick-actions" style="margin-bottom:28px">
      <div class="quick-actions-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px">
        <button class="quick-btn" onclick={() => quickAction('/upload')}>
          <span class="quick-icon">📤</span>
          <span class="quick-label">Upload Notes</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/flashcards')}>
          <span class="quick-icon">⊞</span>
          <span class="quick-label">View Flashcards</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/quiz')}>
          <span class="quick-icon">◎</span>
          <span class="quick-label">Start Quiz</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/ask')}>
          <span class="quick-icon">✦</span>
          <span class="quick-label">Ask AI</span>
        </button>
      </div>
    </div>

    <!-- SECTION 5 — 2-column grid -->
    <div class="bottom-grid" style="display:grid; grid-template-columns:1fr 1.3fr; gap:18px; margin-bottom:28px">
      <div class="gaps-section">
        <GapsPanel gaps={gaps} onStudyNow={goStudy} />
      </div>
      <div class="week-section">
        <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Week Study Plan</h2>
          <StudyPlan {plan} />
        </div>
      </div>
    </div>

    <!-- SECTION 6 — Footer -->
    <footer class="footer" style="display:flex; align-items:center; justify-content:space-between; padding:24px 0; border-top:1px solid var(--border); margin-top:24px">
      <div style="display:flex; align-items:center; gap:16px">
        <div style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:var(--text)">
          <div style="width:26px; height:26px; background:linear-gradient(135deg, var(--green), var(--blue)); border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#050A0F">S</div>
          <span>Studiq</span>
        </div>
        <span style="font-size:11px; color:var(--muted)">AI BuildFest 2026 · Track 3 · AI for Everyday Life</span>
      </div>
      <div style="display:flex; align-items:center">
        <span style="font-size:13px; color:var(--muted)">Built by </span>
        <!-- tobbi glowing portfolio link -->
        <a
          href="https://tobbi-portfolio.onrender.com/"
          target="_blank"
          style="font-size:14px; font-weight:700; color:var(--green); text-decoration:none; animation:glow 2s ease-in-out infinite; transition:opacity .2s; margin-left:4px"
          class="footer-link"
        >tobbi →</a>
      </div>
    </footer>
  {/if}
</div>

<style>
  .quick-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  .quick-btn:hover {
    transform: translateY(-4px);
    border-color: var(--blue);
    box-shadow: 0 8px 24px rgba(14,165,233,.15);
  }

  .quick-icon {
    font-size: 24px;
  }

  .quick-label {
    font-size: 13px; font-weight: 600;
  }

  .footer-link { margin-left: 6px; }
</style>