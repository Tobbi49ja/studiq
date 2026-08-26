<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { api } from '$lib/api/index.js';
  import { user, token } from '$lib/stores/auth.js';
  import Icon from '$lib/components/Icon.svelte';

  import RadarChart from '$lib/components/dashboard/RadarChart.svelte';
  import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
  import AISuggestPanel from '$lib/components/dashboard/AISuggestPanel.svelte';
  import GapsPanel from '$lib/components/dashboard/GapsPanel.svelte';
  import StudyPlan from '$lib/components/dashboard/StudyPlan.svelte';

  gsap.registerPlugin(ScrollTrigger);

  const SUBJECT_COLORS = ['var(--blue)', 'var(--green)', 'var(--teal)', 'var(--purple)'];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  let loading = $state(true);
  let error = $state('');
  let summary = $state([]);
  let history = $state([]);
  let plan = $state([]);

  const RING_R = 40;
  const RING_CIRC = 2 * Math.PI * RING_R;

  // Date string
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Reactive properties derived from summary & history
  let firstName = $derived($user?.name?.split(' ')[0] || 'there');
  let subjects = $derived(summary.map((s, i) => ({ ...s, accentColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] })));
  let sessionsCount = $derived(summary.reduce((a, s) => a + (s.quizCount || 0), 0));
  let overallProgress = $derived((() => {
    const totalQ = summary.reduce((a, s) => a + s.totalQuestions, 0);
    const totalS = summary.reduce((a, s) => a + (s.avgScore || 0) * s.totalQuestions, 0);
    return totalQ ? Math.round(totalS / totalQ) : 0;
  })());
  let masteredCount = $derived(summary.reduce(
    (a, s) => a + (s.weakTopics || []).filter((t) => t.avgScore >= 70).length,
    0
  ));
  let dayStreak = $derived(new Set(history.map((h) => h.createdAt ? String(h.createdAt).slice(0, 10) : '')).size);

  // Learning gaps from weak topics across subjects
  let gaps = $derived(summary.flatMap((s) =>
    (s.weakTopics || []).map((t) => ({
      subject: s.subject,
      topic: t.topic,
      avgScore: t.avgScore,
      sessions: t.avgScore < 50 ? 0 : 1
    }))
  ));

  // AI suggestions built from real weak topics
  let aiSuggestions = $derived((() => {
    const out = [];
    const high = gaps.find((g) => g.avgScore < 50);
    if (high) {
      out.push({
        icon: 'sparkles',
        text: `${high.subject}: "${high.topic}" is below 50% — schedule a focused review this week`,
        color: 'var(--red)'
      });
    }
    const improved = history[0];
    if (improved && improved.total) {
      out.push({
        icon: 'chart',
        text: `Quiz on ${improved.subject || 'recent material'} scored ${Math.round((improved.score / improved.total) * 100)}% — keep it up`,
        color: 'var(--green)'
      });
    }
    if (history.length) {
      out.push({
        icon: 'sparkles',
        text: `${history.length} quizzes taken recently — spaced-review your weak topics to lock them in`,
        color: 'var(--teal)'
      });
    }
    return out.slice(0, 1);
  })());

  // Bar colour helper
  function barColor(score) {
    if (score >= 70) return 'var(--green)';
    if (score >= 50) return 'var(--amber)';
    return 'var(--red)';
  }

  function quickAction(href) {
    goto(href);
  }

  function handleLogoError(e) {
    e.target.style.display = 'none';
  }

  onMount(async () => {
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

    // Study plan is a slow AI-backed request — load it in the background
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
      <div class="skeleton animate-pulse" style="height:70px; flex:1; border-radius: 8px;"></div>
    </div>
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px">
      <div class="skeleton animate-pulse" style="height:110px; border-radius: 12px;"></div>
      <div class="skeleton animate-pulse" style="height:110px; border-radius: 12px;"></div>
      <div class="skeleton animate-pulse" style="height:110px; border-radius: 12px;"></div>
      <div class="skeleton animate-pulse" style="height:110px; border-radius: 12px;"></div>
    </div>
    <div class="skeleton animate-pulse" style="height:320px; margin-bottom:28px; border-radius: 12px;"></div>
  {:else if error}
    <div class="topbar" style="min-height:40vh; display:flex; align-items:center; justify-content:center">
      <div style="background:var(--card); border:1px solid var(--border); border-radius:12px; padding:40px; text-align:center; color:var(--muted); font-size:14px; max-width:460px">
        {error}
      </div>
    </div>
  {:else}
    <!-- SECTION 1 — Topbar -->
    <header class="topbar dashboard-topbar" style="display:flex; justify-content:space-between; align-items:center; gap:16px; padding:8px 0 24px; border-bottom:1px solid var(--border); margin-bottom:28px;">
      <div>
        <h1 class="dashboard-title" style="font-size:26px; font-weight:800; margin:0 0 6px; letter-spacing:-.03em; font-family:'Plus Jakarta Sans', sans-serif;">
          {greeting}, <span style="color:var(--blue)">{firstName}</span> ✦
        </h1>
        <p style="color:var(--muted); font-size:13.5px; margin:0; font-weight:500;">{today}</p>
      </div>
      <div style="display:flex; align-items:center; gap:8px; color:var(--green); font-size:13px; font-weight:700">
        <span style="position:relative; display:flex; width:8px; height:8px">
          <span style="position:absolute; inset:0; border-radius:50%; background:var(--green); animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite"></span>
          <span style="position:relative; width:8px; height:8px; border-radius:50%; background:var(--green)"></span>
        </span>
        Session Active
      </div>
    </header>

    {#if subjects.length === 0 && history.length === 0}
    <!-- ONBOARDING: New user guide -->
    <div class="onboarding" style="margin-bottom:28px">
      <div class="premium-card" style="padding:32px; background:linear-gradient(135deg, var(--card), color-mix(in srgb, var(--card) 95%, var(--blue))); border:1px solid var(--border)">
        <div style="display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap">
          <div style="flex:1; min-width:280px">
            <h2 style="font-size:20px; font-weight:800; color:var(--text); margin:0 0 8px; font-family:'Plus Jakarta Sans', sans-serif;">
              Welcome to Studiq! ✦
            </h2>
            <p style="color:var(--muted); font-size:14px; margin:0 0 20px; line-height:1.6">
              Transform your notes into AI-powered quizzes, flashcards, and study plans. Here's how to get started:
            </p>
            <div style="display:flex; flex-direction:column; gap:12px">
              <div style="display:flex; align-items:center; gap:12px">
                <div style="width:32px; height:32px; border-radius:8px; background:var(--blue-light); color:var(--blue); display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  <span style="font-size:14px; font-weight:800;">1</span>
                </div>
                <div>
                  <div style="font-size:14px; font-weight:600; color:var(--text)">Upload your notes</div>
                  <div style="font-size:12px; color:var(--muted)">PDF, DOCX, or paste text — Studiq will analyze it</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px">
                <div style="width:32px; height:32px; border-radius:8px; background:var(--green-light); color:var(--green); display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  <span style="font-size:14px; font-weight:800;">2</span>
                </div>
                <div>
                  <div style="font-size:14px; font-weight:600; color:var(--text)">Take AI-generated quizzes</div>
                  <div style="font-size:12px; color:var(--muted)">Questions adapt to your level as you improve</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px">
                <div style="width:32px; height:32px; border-radius:8px; background:var(--purple-light); color:var(--purple); display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  <span style="font-size:14px; font-weight:800;">3</span>
                </div>
                <div>
                  <div style="font-size:14px; font-weight:600; color:var(--text)">Track your progress</div>
                  <div style="font-size:12px; color:var(--muted)">See weak areas and follow study plans</div>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; min-width:200px">
            <a href="/upload" class="btn-primary" style="padding:12px 20px; font-size:14px; border-radius:var(--radius); text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px">
              <Icon name="upload" size={16} /> Upload Notes
            </a>
            <a href="/ask" class="btn-secondary" style="padding:12px 20px; font-size:14px; border-radius:var(--radius); text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px">
              <Icon name="ask" size={16} /> Ask AI a Question
            </a>
          </div>
        </div>
      </div>
    </div>
    {/if}

    <!-- SECTION 2 — Stat strip -->
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px">
      <div class="stat-chip premium-card" style="border-top:3px solid var(--green); padding:18px 20px; display:flex; align-items:center; gap:14px">
        <div style="width:38px; height:38px; border-radius:8px; background:var(--green-light); color:var(--green); display:flex; align-items:center; justify-content:center;">
          <Icon name="check" size={16} />
        </div>
        <div>
          <div style="font-size:24px; font-weight:800; color:var(--text); line-height:1.1; font-family:'Plus Jakarta Sans';" data-count={masteredCount}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Mastered</div>
        </div>
      </div>
      
      <div class="stat-chip premium-card" style="border-top:3px solid var(--blue); padding:18px 20px; display:flex; align-items:center; gap:14px">
        <div style="width:38px; height:38px; border-radius:8px; background:var(--blue-light); color:var(--blue); display:flex; align-items:center; justify-content:center;">
          <Icon name="quiz" size={16} />
        </div>
        <div>
          <div style="font-size:24px; font-weight:800; color:var(--text); line-height:1.1; font-family:'Plus Jakarta Sans';" data-count={sessionsCount}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Sessions</div>
        </div>
      </div>
      
      <div class="stat-chip premium-card" style="border-top:3px solid var(--teal); padding:18px 20px; display:flex; align-items:center; gap:14px">
        <div style="width:38px; height:38px; border-radius:8px; background:rgba(6,182,212,.1); color:var(--teal); display:flex; align-items:center; justify-content:center;">
          <Icon name="ask" size={16} />
        </div>
        <div>
          <div style="font-size:24px; font-weight:800; color:var(--text); line-height:1.1; font-family:'Plus Jakarta Sans';" data-count={dayStreak}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Day Streak</div>
        </div>
      </div>
      
      <div class="stat-chip premium-card" style="border-top:3px solid var(--purple); padding:18px 20px; display:flex; align-items:center; gap:14px">
        <div style="width:38px; height:38px; border-radius:8px; background:rgba(139,92,246,.1); color:var(--purple); display:flex; align-items:center; justify-content:center;">
          <Icon name="performance" size={16} />
        </div>
        <div>
          <div style="font-size:24px; font-weight:800; color:var(--text); line-height:1.1; font-family:'Plus Jakarta Sans';" data-count={overallProgress}>0</div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Progress (%)</div>
        </div>
      </div>
    </div>

    <!-- SECTION 3 — Grid Widgets -->
    <div class="main-grid" style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:20px; margin-bottom:28px">
      <!-- Column 1: Score circle + subject breakdown -->
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="premium-card" style="padding:24px; display:flex; flex-direction:column; align-items:center">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Overall Score</h2>
          <div style="position:relative; width:120px; height:120px">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--border)" stroke-width="10" />
              <circle
                id="overallRing"
                cx="60" cy="60" r={RING_R}
                fill="none"
                stroke="var(--blue)"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray={RING_CIRC}
                stroke-dashoffset={RING_CIRC}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center">
              <span style="font-size:24px; font-weight:800; color:var(--text); font-family:'Plus Jakarta Sans';">{overallProgress}%</span>
              <span style="font-size:11px; color:var(--muted); font-weight:600;">average</span>
            </div>
          </div>
        </div>

        <div class="premium-card" style="padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 18px">Subject Breakdown</h2>
          {#if subjects.length}
            <div style="display:flex; flex-direction:column; gap:16px">
              {#each subjects as s}
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px">
                    <span style="font-size:13px; font-weight:600; color:var(--text)">{s.subject}</span>
                    <span style="font-size:13px; font-weight:700; color:{barColor(s.avgScore)}">{s.avgScore}%</span>
                  </div>
                  <div style="height:6px; border-radius:99px; background:var(--border)">
                    <div style="height:6px; border-radius:99px; width:{s.avgScore}%; background:{barColor(s.avgScore)}"></div>
                  </div>
                  <div style="margin-top:6px; font-size:11px; color:var(--muted); font-weight:500;">{s.quizCount} quiz{s.quizCount === 1 ? '' : 'zes'} taken</div>
                </div>
              {/each}
            </div>
          {:else}
            <div style="color:var(--muted); font-size:13px; padding:24px 0; text-align:center; font-weight:500;">No subjects yet — upload notes to get started.</div>
          {/if}
        </div>
      </div>

      <!-- Column 2: Weak areas + AI suggestions -->
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="premium-card" style="padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Weak Areas</h2>
          {#if gaps.length}
            <div style="display:flex; flex-direction:column; gap:10px">
              {#each gaps.slice(0, 4) as g}
                <div style="background:var(--surface); border-left:3px solid var(--amber); border-top:1px solid var(--border); border-right:1px solid var(--border); border-bottom:1px solid var(--border); border-radius:8px; padding:12px 14px">
                  <div style="font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{g.topic}</div>
                  <div style="font-size:11px; color:var(--muted); margin-top:4px; font-weight:500;">{g.subject} · {g.avgScore}%</div>
                </div>
              {/each}
            </div>
          {:else}
            <div style="color:var(--muted); font-size:13px; padding:24px 0; text-align:center; font-weight:500;">No weak areas detected — keep it up!</div>
          {/if}
        </div>
        <AISuggestPanel suggestions={aiSuggestions} />
      </div>

      <!-- Column 3: Radar Chart + activity log -->
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="radar-wrap"><RadarChart subjects={subjects} /></div>
        <ActivityFeed activities={history.slice(0, 4)} />
      </div>
    </div>

    <!-- SECTION 4 — Quick actions -->
    <div class="quick-actions" style="margin-bottom:28px">
      <div class="quick-actions-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px">
        <button class="quick-btn" onclick={() => quickAction('/upload')}>
          <span class="quick-icon"><Icon name="upload" size={20} /></span>
          <span class="quick-label">Upload Notes</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/flashcards')}>
          <span class="quick-icon"><Icon name="flashcards" size={20} /></span>
          <span class="quick-label">View Flashcards</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/quiz')}>
          <span class="quick-icon"><Icon name="quiz" size={20} /></span>
          <span class="quick-label">Start Quiz</span>
        </button>
        <button class="quick-btn" onclick={() => quickAction('/ask')}>
          <span class="quick-icon"><Icon name="ask" size={20} /></span>
          <span class="quick-label">Ask AI</span>
        </button>
      </div>
    </div>

    <!-- SECTION 5 — Bottom study planners -->
    <div class="bottom-grid" style="display:grid; grid-template-columns:1fr 1.3fr; gap:20px; margin-bottom:28px">
      <div class="gaps-section">
        <GapsPanel gaps={gaps} onStudyNow={goStudy} />
      </div>
      <div class="week-section">
        <div class="premium-card" style="padding:24px">
          <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0 0 16px">Week Study Plan</h2>
          <StudyPlan {plan} />
        </div>
      </div>
    </div>

    <!-- SECTION 6 — Footer -->
    <footer class="footer" style="display:flex; align-items:center; justify-content:space-between; padding:24px 0; border-top:1px solid var(--border); margin-top:24px">
      <div style="display:flex; align-items:center; gap:16px">
        <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} style="height:40px;width:60px;object-fit:cover;border-radius:8px" />
        <span style="font-size:11px; color:var(--muted); font-weight:500;">AI BuildFest 2026 · Track 3 · AI for Everyday Life</span>
      </div>
      <div style="display:flex; align-items:center; gap:16px">
        <a href="/home" style="font-size:13px; color:var(--muted); font-weight:600; text-decoration:none; transition:color .15s" onmouseenter={(e) => e.target.style.color = 'var(--blue)'} onmouseleave={(e) => e.target.style.color = 'var(--muted)'}>← Back to Home</a>
        <span style="font-size:13px; color:var(--muted); font-weight:500;">Built by </span>
        <a
          href="https://tobbi-portfolio.onrender.com/"
          target="_blank"
          style="font-size:13.5px; font-weight:700; color:var(--green); text-decoration:none; animation:glow 2s ease-in-out infinite; transition:opacity .2s;"
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
    padding: 20px 16px;
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
    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.15);
  }

  .quick-icon {
    display: flex;
    align-items: center;
    color: var(--blue);
  }

  .quick-label {
    font-size: 13px; 
    font-weight: 700;
  }

  .footer-link { margin-left: 6px; }
</style>