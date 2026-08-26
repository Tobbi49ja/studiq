<script>
  import Badge from './Badge.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import Icon from '../Icon.svelte';

  const COLORS = ['var(--blue)', 'var(--green)', 'var(--teal)', 'var(--purple)'];

  export let subjects = [];

  const color = (i) => COLORS[i % COLORS.length];
  const doneCount = (s) => (s.weakTopics || []).length;
  const totalCount = (s) => Math.max(s.totalQuestions || 0, doneCount(s));
</script>

<div class="subject-panel" style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:24px">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
    <h2 style="color:var(--text); font-size:16px; font-weight:700; margin:0">Subject Progress</h2>
    <Badge text="{subjects.length} Active" color="var(--green)" />
  </div>
  <div style="display:flex; flex-direction:column; gap:18px">
    {#if subjects.length}
      {#each subjects as s, i (s.subject)}
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <div style="display:flex; align-items:center; gap:10px">
              <span style="color:{color(i)}; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:color-mix(in srgb, {color(i)} 12%, transparent)">
                <Icon name="book" size={14} />
              </span>
              <span style="color:var(--text); font-size:14px; font-weight:600">{s.subject}</span>
            </div>
            <span style="color:var(--muted); font-size:12px">{doneCount(s)}/{totalCount(s)} topics</span>
          </div>
          <ProgressBar pct={s.avgScore} color={color(i)} />
          <div style="color:var(--blue); font-size:11px; margin-top:6px">{s.avgScore}% mastery</div>
        </div>
      {/each}
    {:else}
      <div style="color:var(--muted); font-size:13px; padding:12px 0; text-align:center">
        Take a quiz to see your subject progress here.
      </div>
    {/if}
  </div>
</div>