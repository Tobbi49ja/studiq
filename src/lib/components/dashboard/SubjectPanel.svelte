<script>
  import Badge from './Badge.svelte';
  import ProgressBar from './ProgressBar.svelte';

  const COLORS = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-teal)', 'var(--accent-violet)'];
  const ICONS = {
    Mathematics: '∑',
    Maths: '∑',
    Math: '∑',
    Biology: '⬡',
    Physics: '⚛',
    History: '⏳',
    Chemistry: '⚗',
    English: '✏',
    Geography: '🗺',
    Government: '🌍',
    Govt: '🌍'
  };

  export let subjects = [];

  const color = (i) => COLORS[i % COLORS.length];
  const icon = (s) => ICONS[s?.subject] || '📚';
  const doneCount = (s) => (s.weakTopics || []).length;
  const totalCount = (s) => Math.max(s.totalQuestions || 0, doneCount(s));
</script>

<div class="subject-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
    <h2 style="color:var(--text-primary); font-size:16px; font-weight:700; margin:0">Subject Progress</h2>
    <Badge text="{subjects.length} Active" color="var(--accent-green)" />
  </div>
  <div style="display:flex; flex-direction:column; gap:18px">
    {#if subjects.length}
      {#each subjects as s, i (s.subject)}
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <div style="display:flex; align-items:center; gap:10px">
              <span style="color:{color(i)}; font-size:18px">{icon(s)}</span>
              <span style="color:var(--text-primary); font-size:14px; font-weight:600">{s.subject}</span>
            </div>
            <span style="color:var(--text-muted); font-size:12px">{doneCount(s)}/{totalCount(s)} topics</span>
          </div>
          <ProgressBar pct={s.avgScore} color={color(i)} />
          <div style="color:var(--accent-blue); font-size:11px; margin-top:6px">{s.avgScore}% mastery</div>
        </div>
      {/each}
    {:else}
      <div style="color:var(--text-muted); font-size:13px; padding:12px 0; text-align:center">
        Take a quiz to see your subject progress here.
      </div>
    {/if}
  </div>
</div>