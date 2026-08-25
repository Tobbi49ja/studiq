<script>
  import Badge from './Badge.svelte';

  const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const SUBJECT_COLORS = {
    Physics: 'var(--accent-violet)',
    Maths: 'var(--accent-blue)',
    Math: 'var(--accent-blue)',
    Mathematics: 'var(--accent-blue)',
    Biology: 'var(--accent-green)',
    History: 'var(--accent-teal)',
    Chemistry: 'var(--accent-blue)',
    English: 'var(--accent-violet)',
    Geography: 'var(--accent-green)'
  };

  export let plan = [];

  const color = (s) => SUBJECT_COLORS[s] || 'var(--accent-blue)';

  // Map a plan entry's date string (e.g. "Monday") to a 0-6 index for today highlighting
  const dayIdx = (entry) => {
    const d = entry?.date;
    if (!d) return -1;
    const idx = DAY_ORDER.findIndex((x) => x.toLowerCase() === String(d).toLowerCase());
    return idx;
  };

  const todayIdx = new Date().getDay();
  const durationMins = (dur) => {
    if (dur == null) return '';
    const m = parseInt(String(dur), 10);
    return Number.isNaN(m) ? String(dur) : `${m}m`;
  };
</script>

<div class="week-plan" style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
    <h2 style="color:var(--text-primary); font-size:16px; font-weight:700; margin:0">This Week's Plan</h2>
    <Badge text="AI Generated" color="var(--accent-blue)" />
  </div>

  {#if plan.length}
    <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:8px">
      {#each plan as d, i (i)}
        {@const idx = dayIdx(d) === -1 ? -1 : dayIdx(d)}
        {@const isToday = idx !== -1 && idx === todayIdx}
        <div
          style="
            background:{isToday ? 'color-mix(in srgb, var(--accent-blue) 12%, transparent)' : 'var(--bg-surface)'};
            border:1px solid {isToday ? 'var(--accent-blue)' : 'var(--border)'};
            border-radius:12px; padding:10px 6px; display:flex; flex-direction:column; align-items:center; gap:6px;
          "
        >
          <span style="color:{isToday ? 'var(--accent-blue)' : 'var(--text-muted)'}; font-size:11px; font-weight:700">
            {d.date ? d.date.slice(0, 3) : `Day ${d.day ?? i + 1}`}
          </span>
          <div style="display:flex; flex-direction:column; gap:4px; width:100%">
            {#each d.sessions || [] as s, j (j)}
              <div
                style="
                  background:color-mix(in srgb, {color(s.subject)} 15%, transparent); border-radius:6px; padding:4px 0;
                  display:flex; flex-direction:column; align-items:center;
                "
              >
                <span style="font-size:9px; color:{color(s.subject)}; font-weight:700; line-height:1; max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
                  {s.subject?.slice(0, 4)}
                </span>
                <span style="font-size:9px; color:var(--text-muted)">{durationMins(s.duration)}</span>
              </div>
            {/each}
            {#if !(d.sessions && d.sessions.length)}
              <span style="color:var(--text-muted); font-size:10px; text-align:center">Rest</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div style="color:var(--text-muted); font-size:13px; padding:12px 0; text-align:center">
      Take a quiz first so Studiq can generate your study plan.
    </div>
  {/if}
</div>