<script>
  import { onMount, tick } from 'svelte';
  import { api } from '$lib/api/index.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let input = $state('');
  let messages = $state([]);
  let loading = $state(false);
  let error = $state('');
  let msgListEl;

  const PROMPTS = [
    'Explain photosynthesis in simple terms',
    'What is a redox reaction?',
    'How does Newton\'s second law work?',
    'Summarise the causes of World War 1',
  ];

  onMount(() => {
    gsap.fromTo('.ask-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.ask-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 });
    gsap.fromTo('.prompt-chip', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.3 });
  });

  async function scrollBottom() {
    await tick();
    if (msgListEl) msgListEl.scrollTop = msgListEl.scrollHeight;
  }

  async function sendMessage(text) {
    const userMsg = (text || input).trim();
    if (!userMsg) return;
    input = '';
    error = '';
    messages = [...messages, { role: 'user', text: userMsg }];
    await scrollBottom();
    loading = true;
    messages = [...messages, { role: 'ai', text: '', thinking: true }];
    await scrollBottom();

    try {
      const res = await api.post('/ask', { question: userMsg });
      const aiText = res.data.answer || res.data.data?.answer || 'No answer returned.';
      messages = [...messages.slice(0, -1), { role: 'ai', text: aiText, thinking: false }];
    } catch {
      messages = [...messages.slice(0, -1), { role: 'ai', text: 'Sorry, I could not process that. Please try again.', thinking: false }];
    } finally {
      loading = false;
      await scrollBottom();
    }
  }
</script>

<svelte:head>
  <title>Ask AI — Studiq</title>
</svelte:head>

<div style="max-width: 820px; margin: 0 auto">
  <!-- Header -->
  <div class="ask-head" style="margin-bottom: 24px">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Ask <span style="color: var(--green)">AI</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500;">
      Ask about any concept — Studiq explains it in simple, exam-ready language.
    </p>
  </div>

  <!-- Prompt suggestion chips -->
  {#if !messages.length}
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px">
      {#each PROMPTS as p}
        <button
          class="prompt-chip"
          onclick={() => sendMessage(p)}
          style="
            background: var(--surface); border: 1px solid var(--border); border-radius: 99px;
            padding: 8px 16px; font-size: 12.5px; font-weight: 600; color: var(--text);
            cursor: pointer; font-family: inherit; transition: border-color .18s, background .18s;
          "
        >{p}</button>
      {/each}
    </div>
  {/if}

  <!-- Chat window -->
  <div class="ask-card premium-card" style="display: flex; flex-direction: column; overflow: hidden; min-height: 420px">
    <!-- Messages list -->
    <div bind:this={msgListEl} style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth">
      {#if !messages.length}
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px">
            <Icon name="ask" size={24} />
          </div>
          <p style="color: var(--muted); font-size: 14px; font-weight: 500; margin: 0">
            Ask a question above or pick a suggestion to get started
          </p>
        </div>
      {:else}
        {#each messages as m, i (i)}
          <div style="display: flex; justify-content: {m.role === 'user' ? 'flex-end' : 'flex-start'}; align-items: flex-end; gap: 8px">
            {#if m.role === 'ai'}
              <div style="width: 28px; height: 28px; border-radius: 8px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-bottom: 2px">
                <Icon name="ask" size={13} />
              </div>
            {/if}
            <div style="
              max-width: 82%; padding: 13px 16px; border-radius: 14px;
              font-size: 13.5px; line-height: 1.65; white-space: pre-wrap; word-break: break-word;
              {m.role === 'user'
                ? 'background: var(--blue); color: #050A0F; border-bottom-right-radius: 4px;'
                : 'background: var(--surface); color: var(--text); border: 1px solid var(--border); border-bottom-left-radius: 4px;'}
            ">
              {#if m.thinking}
                <div style="display: flex; align-items: center; gap: 8px; color: var(--muted)">
                  <span style="display: flex; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: bounce 1.2s ease-in-out infinite"></span>
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: bounce 1.2s ease-in-out .2s infinite"></span>
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: bounce 1.2s ease-in-out .4s infinite"></span>
                  </span>
                  Thinking…
                </div>
              {:else}
                {m.text}
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Input bar -->
    <div style="padding: 16px 20px; border-top: 1px solid var(--border); background: var(--card)">
      {#if error}
        <div style="background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 10px">{error}</div>
      {/if}
      <div style="display: flex; gap: 10px; align-items: flex-end">
        <textarea
          bind:value={input}
          rows="1"
          placeholder="Type a concept to explain…"
          onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          style="
            flex: 1; padding: 12px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
            color: var(--text); font-size: 13.5px; font-family: inherit; outline: none; resize: none;
            line-height: 1.5; max-height: 120px; transition: border-color .2s;
          "
        ></textarea>
        <button
          onclick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style="
            width: 42px; height: 42px; flex-shrink: 0; border: none; border-radius: 10px;
            background: var(--blue); color: #050A0F; font-size: 18px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: opacity .18s, transform .18s;
            {loading || !input.trim() ? 'opacity: .45; cursor: not-allowed' : ''}
          "
          aria-label="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
      <div style="color: var(--muted); font-size: 11px; margin-top: 7px; font-weight: 500">
        Press <kbd style="background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-size: 10px">Enter</kbd> to send · Shift+Enter for new line
      </div>
    </div>
  </div>
</div>

<style>
  .prompt-chip:hover {
    border-color: var(--green);
    background: var(--green-light);
    color: var(--green);
  }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
</style>