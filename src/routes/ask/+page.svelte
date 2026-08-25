<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api/index.js';
  import gsap from 'gsap';

  let input = '';
  let messages = [];
  let loading = false;
  let error = '';

  onMount(() => {
    gsap.fromTo('.ask-head',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    gsap.fromTo('.ask-card',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 }
    );
  });

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    messages = [...messages, { role: 'user', text: userMsg }];
    input = '';
    loading = true;

    try {
      const res = await api.post('/ask', { question: userMsg });
      messages = [...messages, {
        role: 'ai',
        text: res.data.answer || res.data.data?.answer || 'No answer returned.'
      }];
    } catch {
      messages = [...messages, {
        role: 'ai',
        text: 'Sorry, I could not process that. Try again.'
      }];
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Ask AI — Studiq</title>
</svelte:head>

<div class="page-padding" style="max-width:820px; margin:0 auto; padding:32px;">
  <div class="ask-head" style="margin-bottom:24px">
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:var(--text); margin:0 0 6px">
      Ask <span style="color:var(--green)">AI</span> ✦
    </h1>
    <p style="color:var(--muted); font-size:13px; margin:0">
      Ask about any concept — Studiq explains it in simple, exam-ready language.
    </p>
  </div>

  <div class="ask-card" style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden">
    <!-- Messages -->
    <div style="max-height:420px; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:14px">
      {#if messages.length}
        {#each messages as m, i (i)}
          <div style="display:flex; justify-content:{m.role === 'user' ? 'flex-end' : 'flex-start'}">
            <div
              style="
                max-width:85%;
                padding:12px 14px;
                border-radius:12px;
                font-size:13px; line-height:1.6;
                white-space:pre-wrap;
                {m.role === 'user'
                  ? 'background:var(--blue); color:#050A0F;'
                  : 'background:var(--surface); color:var(--text); border:1px solid var(--border);'}
              "
            >{m.text}</div>
          </div>
        {/each}
      {:else}
        <div style="color:var(--muted); font-size:13px; padding:40px 0; text-align:center">
          Ask a question like "Explain photosynthesis" or "What is a redox reaction?"
        </div>
      {/if}
      {#if loading}
        <div style="align-self:flex-start; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:13px; color:var(--muted)">
          🤖 Thinking…
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div style="padding:16px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:12px">
      {#if error}
        <div style="background:rgba(239,68,68,.12); color:var(--red); border:1px solid rgba(239,68,68,.3); border-radius:10px; padding:10px 12px; font-size:12.5px">{error}</div>
      {/if}
      <div style="display:flex; gap:10px">
        <input
          type="text"
          bind:value={input}
          placeholder="Type a concept to explain…"
          onkeydown={(e) => e.key === 'Enter' && sendMessage()}
          style="
            flex:1; padding:12px 14px;
            background:var(--bg); border:1px solid var(--border); border-radius:10px;
            color:var(--text); font-size:13.5px; font-family:inherit; outline:none;
          "
        />
        <button onclick={sendMessage} disabled={loading || !input.trim()}
          style="
            padding:0 22px; border:none; border-radius:10px;
            background:var(--blue); color:#050A0F;
            font-size:14px; font-weight:700; cursor:pointer; font-family:inherit;
            {loading || !input.trim() ? 'opacity:.5;' : ''}
          "
        >Ask</button>
      </div>
    </div>
  </div>
</div>