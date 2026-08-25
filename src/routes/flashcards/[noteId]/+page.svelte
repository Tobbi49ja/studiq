<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';

  let flashcards = [];
  let subject = '';
  let loading = true;
  let error = '';
  let current = 0;
  let flipped = false;
  let known = [];
  let learning = [];
  let reviewing = false;

  const noteId = page.params.noteId;

  $: total = flashcards.length;
  $: card = flashcards[current];
  $: reviewed = known.length + learning.length;

  function flip() {
    if (!reviewing) flipped = !flipped;
  }

  function markKnown() {
    if (reviewing) return;
    known.push(card.front);
    nextCard();
  }

  function markLearning() {
    if (reviewing) return;
    learning.push(card.front);
    nextCard();
  }

  function nextCard() {
    flipped = false;
    if (current < total - 1) {
      current += 1;
    } else {
      reviewing = true;
    }
  }

  function prevCard() {
    if (current > 0) {
      current -= 1;
      flipped = false;
    }
  }

  function restart() {
    current = 0;
    flipped = false;
    known = [];
    learning = [];
    reviewing = false;
  }

  onMount(async () => {
    try {
      const { data } = await api.get(`/notes/${noteId}/flashcards`);
      flashcards = data.data.flashcards;
      subject = data.data.subject || 'Study';
      if (!flashcards.length) {
        error = 'No flashcards generated for this note.';
      }
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
  <div class="mx-auto max-w-xl">
    <div class="h-80 animate-pulse rounded-2xl bg-slate-200"></div>
  </div>
{:else if error}
  <div class="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-danger">{error}</div>
{:else if reviewing}
  <div class="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
    <div class="text-5xl">🎉</div>
    <h2 class="mt-3 text-2xl font-bold text-ink">Session complete!</h2>
    <p class="mt-1 text-sm text-muted">
      You knew <span class="font-semibold text-success">{known.length}</span> card{known.length === 1 ? '' : 's'} and marked
      <span class="font-semibold text-warning">{learning.length}</span> card{learning.length === 1 ? '' : 's'} for review.
    </p>
    <div class="mt-6 space-y-2">
      <button onclick={restart} class="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark">🔁 Review again</button>
      <button onclick={() => goto('/performance')} class="w-full rounded-xl border border-line bg-white py-3 text-sm font-bold text-ink hover:bg-slate-50">Back to Performance →</button>
    </div>
  </div>
{:else}
  <div class="mx-auto max-w-xl">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-muted">Flashcards</div>
        <div class="text-sm font-bold text-ink">{subject || 'Study'}</div>
      </div>
      <div class="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-ink">Card {current + 1} of {total}</div>
    </div>

    <!-- Progress bar -->
    <div class="mb-6">
      <div class="mb-1 flex justify-between text-xs text-muted">
        <span>{reviewed} reviewed</span>
        <span>{Math.round((reviewed / total) * 100)}%</span>
      </div>
      <div class="h-2 rounded-full bg-slate-200">
        <div class="h-2 rounded-full bg-primary transition-all" style="width:{Math.round((reviewed / total) * 100)}%"></div>
      </div>
    </div>

    <!-- Flashcard -->
    <button
      onclick={flip}
      class="relative h-72 w-full rounded-2xl border border-line bg-white p-8 text-center shadow-sm transition hover:shadow-md"
    >
      {#if !flipped}
        <div class="flex h-full flex-col items-center justify-center">
          <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Term</div>
          <div class="text-xl font-bold text-ink">{card.front}</div>
        </div>
      {:else}
        <div class="flex h-full flex-col items-center justify-center">
          <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Definition</div>
          <div class="text-lg font-medium text-ink">{card.back}</div>
        </div>
      {/if}
      <div class="absolute bottom-4 left-0 right-0 text-xs text-muted">{flipped ? 'Tap to flip back' : 'Tap to reveal'}</div>
    </button>

    <!-- Actions -->
    <div class="mt-6 grid grid-cols-2 gap-3">
      <button
        onclick={markLearning}
        class="rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-600 transition hover:bg-amber-100"
      >
        🔁 Still learning
      </button>
      <button
        onclick={markKnown}
        class="rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
      >
        ✓ I know this
      </button>
    </div>

    <!-- Navigation -->
    <div class="mt-4 flex items-center justify-between">
      <button
        onclick={prevCard}
        disabled={current === 0}
        class="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-40"
      >
        ← Previous
      </button>
      <span class="text-xs text-muted">{known.length} known · {learning.length} learning</span>
      <button
        onclick={nextCard}
        class="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
      >
        Next →
      </button>
    </div>
  </div>
{/if}
