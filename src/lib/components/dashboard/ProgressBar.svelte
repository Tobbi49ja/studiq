<script>
  export let pct = 0;
  export let color = '#0EA5E9';
</script>

<div style="background:var(--border); border-radius:99px; height:6px; overflow:hidden">
  <div
    style="height:100%; border-radius:99px; background:linear-gradient(90deg, {color}, {color}99); width:{pct}%; transition:width 1.2s cubic-bezier(.4,0,.2,1)"
  ></div>
</div>