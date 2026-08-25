<script>
  export let s = 'low';
  const c = { high: 'var(--accent-red)', medium: 'var(--accent-amber)', low: 'var(--accent-green)' }[s] || 'var(--text-muted)';
</script>

<span style="width:8px; height:8px; border-radius:50%; background:{c}; display:inline-block; box-shadow:0 0 6px {c}"></span>