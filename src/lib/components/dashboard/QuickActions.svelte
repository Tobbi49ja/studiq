<script>
  export let handle = () => {};

  const actions = [
    { label: 'Upload Notes', icon: '↑', color: 'var(--accent-blue)', sub: 'PDF, DOCX, TXT' },
    { label: 'Start Quiz', icon: '◎', color: 'var(--accent-green)', sub: 'Adaptive difficulty' },
    { label: 'Flashcard Review', icon: '⊞', color: 'var(--accent-teal)', sub: 'Spaced repetition' },
    { label: 'Ask AI Tutor', icon: '✦', color: 'var(--accent-violet)', sub: 'Explain anything' }
  ];
</script>

<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:24px">
  <h2 style="color:var(--text-primary); font-size:16px; font-weight:700; margin:0 0 16px">Quick Actions</h2>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
    {#each actions as a (a.label)}
      <button
        onclick={() => handle(a.label)}
        style="
          background:color-mix(in srgb, {a.color} 7%, transparent); border:1px solid color-mix(in srgb, {a.color} 20%, transparent);
          border-radius:14px; padding:14px 16px; cursor:pointer;
          display:flex; flex-direction:column; align-items:flex-start; gap:6px;
          transition:background .2s, transform .2s, box-shadow .2s;
          text-align:left; font-family:inherit;
        "
        onmouseenter={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = `0 4px 20px color-mix(in srgb, ${a.color} 15%, transparent)`;
        }}
        onmouseleave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style="font-size:20px">{a.icon}</span>
        <div style="color:var(--text-primary); font-size:13px; font-weight:700">{a.label}</div>
        <div style="color:var(--text-muted); font-size:11px">{a.sub}</div>
      </button>
    {/each}
  </div>
</div>