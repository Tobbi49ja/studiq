<script>
  import { onMount, tick } from 'svelte';
  import { api, apiError, withRetry, isNetworkError } from '$lib/api/index.js';
  import { cacheSet, cacheGet } from '$lib/utils/cache.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let input = $state('');
  let messages = $state([]);
  let loading = $state(false);
  let error = $state('');
  let msgListEl = $state(null);
  let textareaEl = $state(null);
  let showScrollBtn = $state(false);

  // Distance from the bottom (px) within which we still auto-follow new content.
  const NEAR_BOTTOM_PX = 80;
  const INPUT_MAX_H = 120;

  const PROMPTS = [
    'Explain photosynthesis in simple terms',
    'What is a redox reaction?',
    'How does Newton\'s second law work?',
    'Summarise the causes of World War 1',
  ];

  const CHAT_HISTORY_KEY = 'ask_history';

  onMount(async () => {
    loadChatHistory();
    gsap.fromTo('.ask-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.ask-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 });
    gsap.fromTo('.prompt-chip', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.3 });

    // A restored long history starts at the top, so seed the "near bottom"
    // state from the real scroll position instead of assuming it.
    await tick();
    updateScrollState();
  });

  function loadChatHistory() {
    const saved = cacheGet(CHAT_HISTORY_KEY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      messages = saved;
    }
  }

  function saveChatHistory() {
    cacheSet(CHAT_HISTORY_KEY, messages, 24 * 60 * 60 * 1000);
  }

  function isNearBottom() {
    if (!msgListEl) return true;
    return msgListEl.scrollHeight - msgListEl.scrollTop - msgListEl.clientHeight <= NEAR_BOTTOM_PX;
  }

  // Track whether the user is pinned to the bottom. Used to gate auto-scroll
  // and to show/hide the jump-to-latest button.
  function updateScrollState() {
    const near = isNearBottom();
    showScrollBtn = !near;
  }

  async function scrollBottom() {
    await tick();
    if (!msgListEl) return;
    // Only follow the conversation if the user is already reading the newest
    // message. If they scrolled up to read something, never yank them down.
    if (!isNearBottom()) {
      showScrollBtn = true;
      return;
    }
    msgListEl.scrollTop = msgListEl.scrollHeight;
    showScrollBtn = false;
  }

  // Explicit user action — always goes to the bottom, regardless of position.
  async function jumpToBottom() {
    await tick();
    if (!msgListEl) return;
    msgListEl.scrollTop = msgListEl.scrollHeight;
    showScrollBtn = false;
  }

  // Grow the textarea with its content, then scroll internally past ~5 lines.
  $effect(() => {
    // `input` is the dependency so this also re-runs when the field is cleared.
    input;
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, INPUT_MAX_H) + 'px';
  });

  async function sendMessage(text) {
    const userMsg = (text || input).trim();
    if (!userMsg) return;
    input = '';
    error = '';
    messages = [...messages, { role: 'user', text: userMsg }];
    saveChatHistory();
    await scrollBottom();
    loading = true;
    messages = [...messages, { role: 'ai', text: '', thinking: true, failed: false }];
    await scrollBottom();

    try {
      const res = await withRetry(
        () => api.post('/ask', { question: userMsg }),
        { retries: 3 }
      );
      const aiText = res.data.answer || res.data.data?.answer || 'No answer returned.';
      messages = [...messages.slice(0, -1), { role: 'ai', text: aiText, thinking: false, failed: false }];
    } catch (e) {
      const errMsg = isNetworkError(e)
        ? 'Could not reach Studiq AI right now. Please check your connection and try again.'
        : apiError(e);
      messages = [...messages.slice(0, -1), { role: 'ai', text: errMsg, thinking: false, failed: true, originalQuestion: userMsg }];
    } finally {
      loading = false;
      saveChatHistory();
      await scrollBottom();
    }
  }

  async function retryMessage(question) {
    const idx = messages.findIndex(m => m.role === 'user' && m.text === question);
    if (idx === -1) return;
    messages = messages.slice(0, idx + 1);
    saveChatHistory();
    await scrollBottom();
    loading = true;
    messages = [...messages, { role: 'ai', text: '', thinking: true, failed: false }];
    await scrollBottom();

    try {
      const res = await withRetry(
        () => api.post('/ask', { question }),
        { retries: 3 }
      );
      const aiText = res.data.answer || res.data.data?.answer || 'No answer returned.';
      messages = [...messages.slice(0, -1), { role: 'ai', text: aiText, thinking: false, failed: false }];
    } catch (e) {
      const errMsg = isNetworkError(e)
        ? 'Could not reach Studiq AI right now. Please check your connection and try again.'
        : apiError(e);
      messages = [...messages.slice(0, -1), { role: 'ai', text: errMsg, thinking: false, failed: true, originalQuestion: question }];
    } finally {
      loading = false;
      saveChatHistory();
      await scrollBottom();
    }
  }
</script>

<svelte:head>
  <title>Ask AI — Studiq</title>
</svelte:head>

<div class="ask-shell">
  <!-- Header — pinned, never scrolls -->
  <div class="ask-head">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Ask <span style="color: var(--green)">AI</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500;">
      Ask about any concept — Studiq explains it in simple, exam-ready language.
    </p>
  </div>

  <!-- Prompt suggestion chips -->
  {#if !messages.length}
    <div class="prompt-row">
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

  <!-- Chat window: only the message list inside it scrolls -->
  <div class="ask-card premium-card">
    <div class="ask-scroll">
      <!-- Messages list -->
      <div bind:this={msgListEl} class="ask-messages" onscroll={updateScrollState}>
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
            <div class="msg-row" style="justify-content: {m.role === 'user' ? 'flex-end' : 'flex-start'}">
              {#if m.role === 'ai'}
                <div style="width: 28px; height: 28px; border-radius: 8px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-bottom: 2px">
                  <Icon name="ask" size={13} />
                </div>
              {/if}
              <div class="msg-bubble" style="
                {m.role === 'user'
                  ? 'background: var(--blue); color: #050A0F; border-bottom-right-radius: 4px;'
                  : m.failed
                    ? 'background: var(--red-light); color: var(--text); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-bottom-left-radius: 4px;'
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
                  {#if m.failed && m.originalQuestion}
                    <button
                      onclick={() => retryMessage(m.originalQuestion)}
                      style="margin-top: 8px; background: var(--blue); color: #fff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;"
                    >Retry</button>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Jump to latest — only while the user is scrolled up -->
      {#if showScrollBtn}
        <button
          class="scroll-bottom"
          onclick={jumpToBottom}
          aria-label="Scroll to latest message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      {/if}
    </div>

    <!-- Input bar — static at the bottom -->
    <div class="ask-input" style="padding: 16px 20px; border-top: 1px solid var(--border); background: var(--card)">
      {#if error}
        <div style="background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 10px">{error}</div>
      {/if}
      <div style="display: flex; gap: 10px; align-items: flex-end">
        <textarea
          bind:this={textareaEl}
          bind:value={input}
          rows="1"
          placeholder="Type a concept to explain…"
          onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          style="
            flex: 1; min-width: 0; padding: 12px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
            color: var(--text); font-size: 13.5px; font-family: inherit; outline: none; resize: none;
            line-height: 1.5; max-height: 120px; overflow-y: auto; transition: border-color .2s;
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
  /* ── Page shell: fixed viewport height, header / body / input pinned ── */
  /* Height offset = the layout's .main-content vertical padding (40px top +
     40px bottom). See the 768px override below for the mobile value.
     100vh is kept first purely as a fallback for very old engines. */
  .ask-shell {
    height: 100vh;
    height: calc(100dvh - 80px);
    max-width: 820px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  /* .main-content hardcodes min-height:100vh, which is taller than the
     dynamic viewport on mobile and makes the body scroll behind the chat.
     Scoped to this route only via :has() so no other page is affected. */
  :global(.main-content:has(.ask-shell)) {
    min-height: 100dvh;
  }

  /* ── Header: never scrolls, never moves ── */
  .ask-head {
    flex: 0 0 auto;
    margin-bottom: 24px;
  }

  .prompt-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    flex: 0 0 auto;
  }

  /* ── Middle: takes all remaining height, only its inner list scrolls ── */
  .ask-card {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Positioning context for the jump-to-latest button. */
  .ask-scroll {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .ask-messages {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }

  /* min-width:0 lets the bubble shrink inside the flex row so long words or
     code wrap instead of forcing the list to scroll sideways. */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: 0;
  }

  .msg-bubble {
    max-width: 82%;
    min-width: 0;
    padding: 13px 16px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* ── Jump to latest: floats over the list, clears the input bar ── */
  .scroll-bottom {
    position: absolute;
    right: 20px;
    bottom: 12px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
    transition: border-color .18s, color .18s, transform .18s;
  }

  .scroll-bottom:hover {
    border-color: var(--blue);
    color: var(--blue);
  }

  .scroll-bottom:active {
    transform: scale(0.94);
  }

  .prompt-chip:hover {
    border-color: var(--green);
    background: var(--green-light);
    color: var(--green);
  }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  @media (max-width: 768px) {
    /* Matches the layout's mobile .main-content padding (56px top, 40px
       bottom) so the shell fits exactly and the body never scrolls. */
    .ask-shell {
      height: calc(100dvh - 96px);
    }

    .ask-messages {
      padding: 16px;
      gap: 14px;
    }

    .msg-bubble {
      max-width: 88%;
    }
  }
</style>
