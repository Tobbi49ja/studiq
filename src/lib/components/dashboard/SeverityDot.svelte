<script>
  export let s = 'low';
  const c = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' }[s] || 'var(--muted)';
</script>

<span style="width:8px; height:8px; border-radius:50%; background:{c}; display:inline-block; box-shadow:0 0 6px {c}"></span>