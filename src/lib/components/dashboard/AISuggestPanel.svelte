<script>
  import Icon from '../Icon.svelte';
  export let suggestions = [];
</script>

<div
  class="premium-card"
  style="
    background: linear-gradient(135deg, var(--card), color-mix(in srgb, var(--card) 92%, var(--green))); 
    padding: 24px; position: relative; overflow: hidden;
  "
>
  <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: color-mix(in srgb, var(--green) 4%, transparent)"></div>
  
  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px">
    <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center">
      <Icon name="ask" size={16} />
    </div>
    <div>
      <div style="color: var(--green); font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em;">AI Insights</div>
      <div style="color: var(--muted); font-size: 11px; font-weight: 500;">Personalised recommendations</div>
    </div>
  </div>
  
  <div style="display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 2;">
    {#if suggestions.length}
      {#each suggestions as s, i (i)}
        <div
          style="
            background: var(--surface); border-radius: 8px; padding: 12px 14px;
            border-left: 3px solid {s.color || 'var(--green)'}; border-top: 1px solid var(--border);
            border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
            display: flex; gap: 10px; align-items: flex-start;
          "
        >
          <span style="color: var(--green); display: flex; align-items: center; margin-top: 2px;">
             <Icon name={s.icon || 'sparkles'} size={13} />
           </span>
          <span style="color: var(--text); font-size: 12.5px; font-weight: 500; line-height: 1.5">{s.text}</span>
        </div>
      {/each}
    {:else}
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; color: var(--muted); font-size: 12.5px; text-align: center; font-weight: 500;">
        No recommendations yet — take a quiz and Studiq will suggest what to focus on.
      </div>
    {/if}
  </div>
</div>