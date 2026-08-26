<script>
  export let label = '';
  export let value = 0;
  export let unit = '';
  export let color = 'var(--blue)';
</script>

<div
  class="stat-card"
  style="
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 22px 26px; display: flex; flex-direction: column; gap: 6px;
    position: relative; overflow: hidden;
    transition: transform .25s, box-shadow .25s;
  "
  onmouseenter={(e) => {
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.boxShadow = `0 8px 32px color-mix(in srgb, {color} 13%, transparent)`;
  }}
  onmouseleave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
>
  <div style="position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, {color}, transparent)"></div>
  <span style="color:var(--muted); font-size:var(--text-sm); font-weight:600; letter-spacing:.08em; text-transform:uppercase">{label}</span>
  <span style="color:{color}; font-size:36px; font-weight:800; line-height:1">
    <span class="stat-value" data-target={value}>{0}</span
    ><span style="font-size:16px; color:var(--muted); margin-left:4px">{unit}</span>
  </span>
</div>