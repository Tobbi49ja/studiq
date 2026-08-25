<script>
  import TypeIcon from './TypeIcon.svelte';

  export let activities = [];

  function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }

  const pct = (a) => (a.total ? Math.round((a.score / a.total) * 100) : null);
</script>

<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px">
  <h2 style="color:var(--text-primary); font-size:16px; font-weight:700; margin:0 0 18px">Recent Activity</h2>
  <div style="display:flex; flex-direction:column">
    {#if activities.length}
      {#each activities as a, i (a._id || i)}
        <div
          style="
            display:flex; gap:14px; padding:14px 0;
            border-bottom:{i < activities.length - 1 ? '1px solid color-mix(in srgb, var(--border) 15%, transparent)' : 'none'};
            align-items:flex-start;
          "
        >
          <div style="width:36px; height:36px; border-radius:10px; background:var(--bg-surface); display:flex; align-items:center; justify-content:center; flex:0 0 auto">
            <TypeIcon type="quiz" />
          </div>
          <div style="flex:1; min-width:0">
            <div style="color:var(--text-primary); font-size:13px; font-weight:500; margin-bottom:3px; overflow-wrap:break-word">
              {a.noteTitle ? a.noteTitle : (a.subject || 'Quiz')}
            </div>
            <div style="display:flex; gap:8px; align-items:center">
              <span style="color:var(--text-muted); font-size:11px">{a.subject || 'General'} · {relativeTime(a.createdAt)}</span>
              {#if pct(a) !== null}
                <span style="color:{pct(a) >= 75 ? 'var(--accent-green)' : pct(a) >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'}; font-size:11px; font-weight:700">
                  {pct(a)}%
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div style="color:var(--text-muted); font-size:13px; padding:12px 0; text-align:center">
        No activity yet — take a quiz to see it here.
      </div>
    {/if}
  </div>
</div>