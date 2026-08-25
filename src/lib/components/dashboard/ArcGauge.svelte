<script>
  export let pct = 0;
  export let color = '#0EA5E9';
  export let size = 96;

  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
</script>

<div class="arc-gauge" style="display:flex">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <circle {cx} {cy} {r} fill="none" stroke="var(--border)" stroke-width="7" />
    <circle
      {cx}
      {cy}
      {r}
      fill="none"
      stroke={color}
      stroke-width="7"
      stroke-dasharray="{dash} {circ - dash}"
      stroke-dashoffset={circ * 0.25}
      stroke-linecap="round"
      style="transition: stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)"
    />
    <text x={cx} y={cy + 5} text-anchor="middle" fill="var(--text-primary)" font-size="15" font-weight="700">{pct}%</text>
  </svg>
</div>