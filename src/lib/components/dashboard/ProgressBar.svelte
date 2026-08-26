<script>
  export let pct = 0;
  export let color = 'var(--blue)';
</script>

<div style="background:var(--border); border-radius:99px; height:6px; overflow:hidden">
  <div
    style="height:100%; border-radius:99px; background:{color}; width:{pct}%; transition:width 1.2s cubic-bezier(.4,0,.2,1)"
  ></div>
</div>