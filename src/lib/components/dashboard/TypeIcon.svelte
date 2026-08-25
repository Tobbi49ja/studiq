<script>
  export let type = 'quiz';
  const map = {
    quiz: { icon: '◎', c: 'var(--accent-blue)' },
    flashcard: { icon: '⊞', c: 'var(--accent-green)' },
    summary: { icon: '≡', c: 'var(--accent-teal)' },
    plan: { icon: '◈', c: 'var(--accent-violet)' }
  };
  const { icon = '·', c = 'var(--text-muted)' } = map[type] || {};
</script>

<span style="color:{c}; font-size:16px; font-weight:700">{icon}</span>