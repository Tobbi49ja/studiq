<script>
  import Badge from './Badge.svelte';
  import SeverityDot from './SeverityDot.svelte';
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  export let gaps = [];
  export let onStudyNow = () => {};

  let el;

  const severity = (g) => {
    const s = g.avgScore;
    if (s == null) return 'medium';
    if (s < 50) return 'high';
    if (s < 70) return 'medium';
    return 'low';
  };
  const sessionText = (g) => (g.sessions === 0 ? 'Never studied' : `${g.sessions} session${g.sessions > 1 ? 's' : ''}`);

  onMount(() => {
    const items = el?.querySelectorAll('.gap-item');
    if (items?.length) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      );
    }
  });
</script>

<div bind:this={el} class="gaps-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
    <h2 style="color:var(--text-primary); font-size:16px; font-weight:700; margin:0">Learning Gaps</h2>
    <Badge text="Needs Attention" color="var(--accent-red)" />
  </div>
  <div style="display:flex; flex-direction:column; gap:12px">
    {#if gaps.length}
      {#each gaps as g, i (i)}
        {@const sev = severity(g)}
        <div
          class="gap-item"
          style="
            display:flex; align-items:center; justify-content:space-between;
            background:var(--bg-surface); border-radius:12px; padding:12px 16px;
            border:1px solid {sev === 'high' ? 'color-mix(in srgb, var(--accent-red) 15%, transparent)' : 'var(--border)'};
          "
        >
          <div style="display:flex; align-items:center; gap:10px; min-width:0">
            <SeverityDot s={sev} />
            <div style="min-width:0">
              <div style="color:var(--text-primary); font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{g.topic}</div>
              <div style="color:var(--text-muted); font-size:11px">{g.subject} · {sessionText(g)}</div>
            </div>
          </div>
          <button
            onclick={onStudyNow}
            style="
              background:transparent; border:1px solid var(--border); color:var(--accent-blue);
              font-size:11px; font-weight:700; padding:5px 12px; border-radius:8px; cursor:pointer;
              letter-spacing:.04em; flex:0 0 auto; font-family:inherit;
            "
          >Study Now</button>
        </div>
      {/each}
    {:else}
      <div style="color:var(--text-muted); font-size:13px; padding:12px 0; text-align:center">
        No learning gaps detected — great work! 🎉
      </div>
    {/if}
  </div>
</div>