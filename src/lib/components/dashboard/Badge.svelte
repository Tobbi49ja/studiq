<script>
  export let text = '';
  export let color = 'var(--blue)';
</script>

<span style="background:color-mix(in srgb, {color} 10%, transparent); color:{color}; font-size:var(--text-xs); font-weight:700; padding:2px 10px; border-radius:99px; border:1px solid color-mix(in srgb, {color} 20%, transparent); letter-spacing:.04em">{text}</span>