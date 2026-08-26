<script>
  import Icon from '../Icon.svelte';

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

<div class="premium-card" style="padding: 24px">
  <h2 style="color: var(--text); font-size: 16px; font-weight: 700; margin-bottom: 18px">Recent Activity</h2>
  <div style="display: flex; flex-direction: column">
    {#if activities.length}
      {#each activities as a, i (a._id || i)}
        <div
          style="
            display: flex; gap: 14px; padding: 12px 0;
            border-bottom: {i < activities.length - 1 ? '1px solid var(--border)' : 'none'};
            align-items: center;
          "
        >
          <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; flex: 0 0 auto">
            <Icon name="quiz" size={14} />
          </div>
          <div style="flex: 1; min-width: 0">
            <div style="color: var(--text); font-size: 13px; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {a.noteTitle ? a.noteTitle : (a.subject || 'Quiz')}
            </div>
            <div style="display: flex; gap: 8px; align-items: center">
              <span style="color: var(--muted); font-size: 11px; font-weight: 500;">{a.subject || 'General'} · {relativeTime(a.createdAt)}</span>
            </div>
          </div>
          <div style="flex-shrink: 0;">
            {#if pct(a) !== null}
              <span style="
                color: {pct(a) >= 70 ? 'var(--green)' : pct(a) >= 50 ? 'var(--amber)' : 'var(--red)'}; 
                background: {pct(a) >= 70 ? 'var(--green-light)' : pct(a) >= 50 ? 'var(--amber-light)' : 'var(--red-light)'};
                font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px;
              ">
                {pct(a)}%
              </span>
            {/if}
          </div>
        </div>
      {/each}
    {:else}
      <div style="color: var(--muted); font-size: 13px; padding: 16px 0; text-align: center; font-weight: 500;">
        No activity yet — take a quiz to see it here.
      </div>
    {/if}
  </div>
</div>