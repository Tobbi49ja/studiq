<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import gsap from 'gsap';

  let quiz = null;
  let loading = true;
  let error = '';
  let current = 0;
  let answers = [];
  let selected = null;
  let answered = false;
  let timeLeft = 10 * 60; // 10 minutes in seconds
  let timerInterval;
  let submitting = false;
  let optionRefs = [];
  let result = null;

  // FEATURE 1: Concept Explainer
  let explaining = false;
  let explanation = '';
  let explanationError = '';

  // FEATURE 3: AI Answer Feedback
  let feedback = '';
  let feedbackLoading = false;
  let feedbackError = '';

  const LETTERS = ['A', 'B', 'C', 'D'];

  // Strip the model's raw internal reasoning before it reaches the user.
  function cleanResponse(rawText) {
    let text = String(rawText || '').replace(/<thinking[\s\S]*?<\/think>/gi, '').trim();
    const open = text.match(/<thinking/gi);
    if (open) text = text.slice(0, text.indexOf(open[0])).trim();
    return text;
  }

  $: total = quiz?.questions?.length || 0;
  $: question = quiz?.questions?.[current];

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  async function loadQuiz() {
    try {
      const { data } = await api.get(`/quiz/${page.params.quizId}`);
      quiz = data.data;
      answers = new Array(quiz.questions.length).fill(null);
      animateQuestion();
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  }

  // ANIMATION 3: shake on wrong answer, bounce on correct answer
  function shakeWrong(element) {
    gsap.fromTo(element,
      { x: 0 },
      { x: [-8, 8, -6, 6, -4, 4, 0], duration: 0.5, ease: 'power2.inOut' }
    );
  }

  function bounceCorrect(element) {
    gsap.fromTo(element,
      { scale: 1 },
      { scale: [1.04, 0.97, 1], duration: 0.4, ease: 'power2.out' }
    );
  }

  // ANIMATION 3: question card + options entrance per question
  function animateQuestion() {
    gsap.fromTo('.quiz-card',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)' }
    );
    gsap.fromTo('.option',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.07, ease: 'power2.out', delay: 0.3 }
    );
  }

  function pickOption(index) {
    if (answered || submitting) return;
    selected = index;
    answered = true;
    answers[current] = index;

    const correct = question.correct;
    if (index === correct) {
      bounceCorrect(optionRefs[index]);
    } else {
      shakeWrong(optionRefs[index]);
      bounceCorrect(optionRefs[correct]);
      // FEATURE 3: personalised AI feedback for wrong answers
      fetchFeedback();
    }
  }

  async function fetchFeedback() {
    feedback = '';
    feedbackError = '';
    feedbackLoading = true;
    try {
      const { data } = await api.post('/quiz/feedback', {
        question: question.question,
        correctAnswer: question.options[question.correct].replace(/^[A-D]\.\s*/, ''),
        userAnswer: question.options[selected].replace(/^[A-D]\.\s*/, ''),
        explanation: question.explanation || ''
      });
      feedback = cleanResponse(data.data.feedback);
    } catch (e) {
      feedbackError = apiError(e);
    } finally {
      feedbackLoading = false;
    }
  }

  // FEATURE 1: explain the question topic in simple terms
  async function explainQuestion() {
    if (explaining) return;
    explaining = true;
    explanation = '';
    explanationError = '';
    try {
      const { data } = await api.post('/notes/explain', {
        concept: question.topic || question.question,
        subject: quiz.subject || ''
      });
      explanation = cleanResponse(data.data.explanation);
    } catch (e) {
      explanationError = apiError(e);
    } finally {
      explaining = false;
    }
  }

  function next() {
    if (current < total - 1) {
      current += 1;
      selected = null;
      answered = false;
      feedback = '';
      feedbackError = '';
      explanation = '';
      explanationError = '';
      animateQuestion();
    } else {
      finish();
    }
  }

  async function finish() {
    if (submitting) return;
    submitting = true;
    const payload = {
      quizId: quiz._id,
      noteId: quiz.noteId,
      subject: quiz.subject || '',
      answers,
      timeTakenSeconds: 10 * 60 - timeLeft
    };
    console.log('[Studiq quiz] Submitting performance:', JSON.stringify(payload));
    try {
      const { data } = await api.post('/performance', payload);
      console.log('[Studiq quiz] Performance response:', data.status, JSON.stringify(data.data));
      result = data.data;
      clearInterval(timerInterval);
    } catch (e) {
      console.error('[Studiq quiz] Performance POST failed:', e?.response?.status, apiError(e));
      error = apiError(e);
      submitting = false;
    }
  }

  function optionClass(index) {
    if (!answered) return 'border-line bg-white hover:border-primary hover:bg-primary-light';
    if (index === question.correct) return 'border-success bg-green-50';
    if (index === selected) return 'border-danger bg-red-50';
    return 'border-line bg-white opacity-60';
  }

  onMount(() => {
    loadQuiz();
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        finish();
      }
    }, 1000);
    return () => clearInterval(timerInterval);
  });
</script>

<svelte:head>
  <title>Quiz — Studiq</title>
</svelte:head>

{#if loading}
  <div class="mx-auto max-w-2xl">
    <div class="h-40 animate-pulse rounded-2xl bg-slate-200"></div>
  </div>
{:else if result}
  <div class="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
    <div class="text-5xl">{result.score / result.total >= 0.7 ? '🎉' : result.score / result.total >= 0.5 ? '💪' : '📚'}</div>
    <h2 class="mt-3 text-2xl font-bold text-ink">You scored {result.score}/{result.total}</h2>
    <p class="mt-1 text-sm text-muted">{Math.round((result.score / result.total) * 100)}% · {result.wrong} wrong</p>
    <button onclick={() => goto('/performance')} class="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark">View Performance →</button>
    <button onclick={() => goto('/flashcards/' + quiz.noteId)} class="mt-2 w-full rounded-xl border border-primary bg-primary-light py-3 text-sm font-bold text-primary hover:bg-blue-100">🃏 Study with Flashcards</button>
  </div>
{:else if error}
  <div class="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-danger">{error}</div>
{:else}
  <div class="mx-auto max-w-2xl">
    <!-- Header: progress dots + timer -->
    <div class="mb-5 flex items-center justify-between">
      <div class="flex gap-1.5">
        {#each Array(total) as _, i}
          <div
            class="h-2 w-6 rounded-full {i < current ? 'bg-success' : i === current ? 'bg-primary' : 'bg-slate-200'}"
          ></div>
        {/each}
      </div>
      <div class="rounded-full bg-white px-4 py-1.5 text-sm font-bold {timeLeft < 60 ? 'text-danger' : 'text-ink'}">⏱ {formatTime(timeLeft)}</div>
    </div>

    <div class="quiz-card rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Question {current + 1} of {total}</div>
      <h2 class="mb-6 text-lg font-bold text-ink">{question.question}</h2>

      <div class="space-y-3">
        {#each question.options as option, i}
          <button
            bind:this={optionRefs[i]}
            onclick={() => pickOption(i)}
            disabled={answered}
            class="option flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition {optionClass(i)}"
          >
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-muted">{LETTERS[i]}</span>
            <span class="text-ink">{option.replace(/^[A-D]\.\s*/, '')}</span>
            {#if answered && i === question.correct}
              <span class="ml-auto text-success">✓</span>
            {:else if answered && i === selected}
              <span class="ml-auto text-danger">✗</span>
            {/if}
          </button>
        {/each}
      </div>

      {#if answered}
        <div class="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-ink">
          <div class="mb-1 font-bold text-primary">
            {selected === question.correct ? 'Correct! 🎉' : `Not quite — the answer is ${LETTERS[question.correct]}.`}
          </div>
          <div class="text-muted">{question.explanation}</div>
        </div>

        {#if selected !== question.correct}
          <!-- FEATURE 3: AI Coach feedback panel -->
          <div class="mt-3 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm text-ink">
            <div class="mb-1 flex items-center gap-1.5 font-bold text-purple-700">💬 AI Coach</div>
            {#if feedbackLoading}
              <div class="h-4 w-3/4 animate-pulse rounded bg-purple-200"></div>
            {:else if feedback}
              <div class="text-muted">{feedback}</div>
            {:else if feedbackError}
              <div class="text-danger">Couldn't load AI feedback — {feedbackError}</div>
            {/if}
          </div>
        {/if}

        <button onclick={next} class="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark">
          {current < total - 1 ? 'Next question →' : 'Finish quiz'}
        </button>
      {:else}
        <!-- FEATURE 1: Explain this concept -->
        <button
          onclick={explainQuestion}
          disabled={explaining}
          class="mt-5 w-full rounded-xl border border-primary bg-primary-light py-2.5 text-sm font-semibold text-primary transition hover:bg-blue-100 disabled:opacity-60"
        >
          {explaining ? '🤖 Explaining…' : '💡 Explain this concept'}
        </button>
        {#if explanation || explanationError}
          <div class="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-ink">
            {#if explanationError}
              <div class="text-danger">Couldn't explain — {explanationError}</div>
            {:else}
              <div class="mb-1 font-bold text-primary">Concept explainer</div>
              <div class="whitespace-pre-line text-muted">{explanation}</div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
