<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let flashcards = $state([]);
  let subject = $state('');
  let loading = $state(true);
  let error = $state('');
  let current = $state(0);
  let flipped = $state(false);
  let known = $state([]);
  let learning = $state([]);
  let reviewing = $state(false);
  let isAnimating = $state(false);

  const noteId = page.params.noteId;

  let total = $derived(flashcards.length);
  let card = $derived(flashcards[current]);
  let reviewed = $derived(known.length + learning.length);

  function flip() {
    if (!reviewing && !isAnimating) {
      isAnimating = true;
      const cardEl = document.getElementById('flip-card-inner');
      gsap.to(cardEl, {
        rotateY: flipped ? 0 : 180,
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => { isAnimating = false; }
      });
      flipped = !flipped;
    }
  }

  function markKnown() {
    if (reviewing || isAnimating) return;
    known = [...known, card.front];
    transitionNext();
  }

  function markLearning() {
    if (reviewing || isAnimating) return;
    learning = [...learning, card.front];
    transitionNext();
  }

  function transitionNext() {
    gsap.to('.card-wrapper', { x: 60, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => {
      if (current < total - 1) {
        current += 1;
      } else {
        reviewing = true;
      }
      flipped = false;
      const inner = document.getElementById('flip-card-inner');
      if (inner) gsap.set(inner, { rotateY: 0 });
      gsap.fromTo('.card-wrapper', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
    }});
  }

  function prevCard() {
    if (current > 0 && !isAnimating) {
      gsap.to('.card-wrapper', { x: -60, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => {
        current -= 1;
        flipped = false;
        const inner = document.getElementById('flip-card-inner');
        if (inner) gsap.set(inner, { rotateY: 0 });
        gsap.fromTo('.card-wrapper', { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
      }});
    }
  }

  function restart() {
    current = 0; flipped = false; known = []; learning = []; reviewing = false;
    const inner = document.getElementById('flip-card-inner');
    if (inner) gsap.set(inner, { rotateY: 0 });
  }

  onMount(async () => {
    try {
      const { data } = await api.get(`/notes/${noteId}/flashcards`);
      flashcards = data.data.flashcards;
      subject = data.data.subject || 'Study';
      if (!flashcards.length) error = 'No flashcards generated for this note.';
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Flashcards — Studiq</title>
</svelte:head>

{#if loading}
  <div style="max-width: 560px; margin: 0 auto">
    <div class="skeleton animate-pulse" style="height: 280px; border-radius: 20px; margin-bottom: 20px"></div>
    <div class="skeleton animate-pulse" style="height: 52px; border-radius: 12px"></div>
  </div>
{:else if error}
  <div style="max-width: 480px; margin: 0 auto; background: color-mix(in srgb, var(--red) 8%, transparent); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 14px; padding: 32px; text-align: center; color: var(--red)">{error}</div>
{:else if reviewing}
  <div style="max-width: 460px; margin: 0 auto; text-align: center">
    <div class="premium-card" style="padding: 48px 32px">
      <div style="width: 64px; height: 64px; border-radius: 16px; background: var(--green-light); color: var(--green); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px">
      <Icon name="check" size={32} />
    </div>
      <h2 style="font-size: 26px; font-weight: 800; color: var(--text); margin: 0 0 10px; font-family: 'Plus Jakarta Sans', sans-serif">Session complete!</h2>
      <p style="color: var(--muted); font-size: 14px; margin: 0 0 28px; font-weight: 500">
        <span style="color: var(--green); font-weight: 700">{known.length}</span> known · 
        <span style="color: var(--amber); font-weight: 700">{learning.length}</span> still learning
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <button onclick={restart} class="btn-primary" style="padding: 13px; font-size: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 7px">
          Review again
        </button>
        <button onclick={() => goto('/performance')} class="btn-secondary" style="padding: 12px; font-size: 14px; border-radius: 12px">
          Back to Performance →
        </button>
      </div>
    </div>
  </div>
{:else}
  <div style="max-width: 560px; margin: 0 auto">
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px">Flashcards</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--text)">{subject}</div>
      </div>
      <div style="background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: var(--text)">
        Card {current + 1} / {total}
      </div>
    </div>

    <!-- Progress bar -->
    <div style="margin-bottom: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
        <span style="font-size: 11px; font-weight: 600; color: var(--muted)">{reviewed} reviewed</span>
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="font-size: 11px; color: var(--green); font-weight: 700">{known.length} known</span>
          <span style="font-size: 11px; color: var(--amber); font-weight: 700">{learning.length} learning</span>
        </div>
      </div>
      <div style="height: 5px; border-radius: 99px; background: var(--border)">
        <div style="height: 5px; border-radius: 99px; background: var(--green); width: {Math.round((reviewed / total) * 100)}%; transition: width .3s"></div>
      </div>
    </div>

    <!-- 3D Flip Card -->
    <div class="card-wrapper" style="perspective: 1200px; margin-bottom: 20px; cursor: pointer" onclick={flip} onkeydown={(e) => e.key === 'Enter' && flip()} role="button" tabindex="0">
      <div id="flip-card-inner" style="position: relative; width: 100%; transform-style: preserve-3d;">
        <!-- Front -->
        <div style="
          background: var(--card); border: 1px solid var(--border); border-radius: 20px;
          padding: 48px 32px; min-height: 240px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
        ">
          <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 16px">Term</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--text); line-height: 1.3; font-family: 'Plus Jakarta Sans', sans-serif">{card?.front}</div>
          <div style="margin-top: 24px; color: var(--muted); font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 5px">
            <Icon name="flashcards" size={13} /> Tap to reveal definition
          </div>
        </div>
        <!-- Back (rotated) -->
        <div style="
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--card), color-mix(in srgb, var(--card) 92%, var(--green)));
          border: 1px solid color-mix(in srgb, var(--green) 20%, var(--border)); border-radius: 20px;
          padding: 48px 32px; min-height: 240px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          transform: rotateY(180deg);
        ">
          <div style="font-size: 11px; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 16px">Definition</div>
          <div style="font-size: 17px; font-weight: 600; color: var(--text); line-height: 1.6">{card?.back}</div>
          <div style="margin-top: 24px; color: var(--muted); font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 5px">
            <Icon name="flashcards" size={13} /> Tap to flip back
          </div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px">
      <button
        onclick={markLearning}
        style="
          padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 700;
          background: color-mix(in srgb, var(--amber) 10%, transparent); 
          color: var(--amber); border: 1.5px solid color-mix(in srgb, var(--amber) 30%, transparent);
          cursor: pointer; font-family: inherit; transition: background .18s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        "
      >
        Still learning
      </button>
      <button
        onclick={markKnown}
        class="btn-primary"
        style="padding: 14px; font-size: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 7px"
      >
        <Icon name="check" size={14} /> I know this
      </button>
    </div>

    <!-- Navigation -->
    <div style="display: flex; align-items: center; justify-content: space-between">
      <button
        onclick={prevCard}
        disabled={current === 0}
        class="btn-secondary"
        style="font-size: 13px; padding: 8px 16px; border-radius: 8px; {current === 0 ? 'opacity: .4' : ''}"
      >← Previous</button>
      <span style="font-size: 12px; color: var(--muted); font-weight: 600">{known.length} known · {learning.length} to review</span>
      <button
        onclick={() => { if (!reviewing) transitionNext(); }}
        class="btn-secondary"
        style="font-size: 13px; padding: 8px 16px; border-radius: 8px"
      >Skip →</button>
    </div>
  </div>
{/if}
