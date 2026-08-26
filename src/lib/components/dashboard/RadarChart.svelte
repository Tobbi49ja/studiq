<script>
  export let subjects = [];

  const cx = 130;
  const cy = 130;
  const r = 85;
  const n = Math.max(subjects.length, 1);
  const angles = subjects.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);

  const value = (i) => Math.min(Math.max(subjects[i]?.avgScore || 0, 0), 100) / 100;

  const gridPts = (scale) =>
    subjects.map((_, i) => ({
      x: cx + Math.cos(angles[i]) * r * scale,
      y: cy + Math.sin(angles[i]) * r * scale
    }));

  const dataPts = () =>
    subjects.map((_, i) => ({
      x: cx + Math.cos(angles[i]) * r * value(i),
      y: cy + Math.sin(angles[i]) * r * value(i)
    }));

  const polyPts = (arr) => arr.map((p) => `${p.x},${p.y}`).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const labelX = (i) => cx + Math.cos(angles[i]) * (r + 20);
  const labelY = (i) => cy + Math.sin(angles[i]) * (r + 20);
</script>

<div class="premium-card" style="padding: 24px">
  <h2 style="color: var(--text); font-size: 16px; font-weight: 700; margin-bottom: 12px">Performance Radar</h2>
  {#if subjects.length >= 3}
    <div style="display: flex; justify-content: center; align-items: center; padding-top: 10px;">
      <svg width="260" height="260" viewBox="0 0 260 260">
        <!-- Grid circles/polygons -->
        {#each gridLevels as lvl, li (li)}
          <polygon points={polyPts(gridPts(lvl))} fill="none" stroke="var(--border)" stroke-width="1.2" stroke-dasharray="3,3" />
        {/each}
        
        <!-- Axis lines -->
        {#each angles as a, i}
          <line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="var(--border)" stroke-width="1.2" />
        {/each}
        
        <!-- Data Polygon -->
        {#if subjects.length >= 3}
          <polygon
            points={polyPts(dataPts())}
            fill="color-mix(in srgb, var(--blue) 12%, transparent)"
            stroke="var(--blue)"
            stroke-width="2.5"
          />
        {/if}
        
        <!-- Points & Labels -->
        {#each subjects as s, i (i)}
          <g>
            <circle cx={cx + Math.cos(angles[i]) * r * value(i)} cy={cy + Math.sin(angles[i]) * r * value(i)} r="4.5" fill={s.accentColor || 'var(--blue)'} stroke="var(--card)" stroke-width="1" />
            <text 
              x={labelX(i)} 
              y={labelY(i) + 4} 
              text-anchor="middle" 
              fill="var(--text)" 
              font-family="'Plus Jakarta Sans', sans-serif" 
              font-size="10.5" 
              font-weight="700"
            >
              {s.subject.slice(0, 4)}
            </text>
          </g>
        {/each}
      </svg>
    </div>
  {:else}
    <div style="color: var(--muted); font-size: 13px; padding: 48px 0; text-align: center; font-weight: 500;">
      Complete quizzes in 3 or more subjects to see your performance radar.
    </div>
  {/if}
</div>