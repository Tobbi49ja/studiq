<script>
  export let suggestions = [];
</script>

<div
  style="
    background:linear-gradient(135deg, var(--bg-card), color-mix(in srgb, var(--bg-card) 70%, var(--accent-green))); 
    border:1px solid var(--border); border-radius:20px; padding:24px; position:relative; overflow:hidden;
  "
>
  <div style="position:absolute; top:-40px; right:-40px; width:160px; height:160px; border-radius:50%; background:color-mix(in srgb, var(--accent-green) 4%, transparent)"></div>
  <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px">
    <div style="width:32px; height:32px; border-radius:10px; background:color-mix(in srgb, var(--accent-green) 12%, transparent); display:flex; align-items:center; justify-content:center">
      <span style="font-size:16px">✦</span>
    </div>
    <div>
      <div style="color:var(--accent-green); font-size:13px; font-weight:700">AI Insights</div>
      <div style="color:var(--text-muted); font-size:11px">Personalised recommendations</div>
    </div>
  </div>
  <div style="display:flex; flex-direction:column; gap:10px">
    {#if suggestions.length}
      {#each suggestions as s, i (i)}
        <div
          style="
            background:var(--bg-surface); border-radius:12px; padding:12px 14px;
            border-left:3px solid {s.color}; display:flex; gap:10px; align-items:flex-start;
          "
        >
          <span style="font-size:14px">{s.icon}</span>
          <span style="color:var(--text-primary); font-size:12px; line-height:1.5">{s.text}</span>
        </div>
      {/each}
    {:else}
      <div style="background:var(--bg-surface); border-radius:12px; padding:12px 14px; color:var(--text-muted); font-size:12px">
        No recommendations yet — take a quiz and Studiq will suggest what to focus on.
      </div>
    {/if}
  </div>
</div>