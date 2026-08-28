<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { api, apiError, withRetry, isNetworkError } from '$lib/api/index.js';
  import { cacheSet, cacheGet, cacheDelete } from '$lib/utils/cache.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let quiz = $state(null);
  let loading = $state(true);
  let error = $state('');
  let current = $state(0);
  let answers = $state([]);
  let selected = $state(null);
  let answered = $state(false);
  let timeLeft = $state(10 * 60);
  let timerInterval;
  let submitting = $state(false);
  let optionRefs = [];
  let result = $state(null);
  let showSavedIndicator = $state(false);
  let submitError = $state('');
  let autoSubmitInterval;

  let explaining = $state(false);
  let explanation = $state('');
  let explanationError = $state('');

  let feedback = $state('');
  let feedbackLoading = $state(false);
  let feedbackError = $state('');

  const LETTERS = ['A', 'B', 'C', 'D'];
  const PROGRESS_KEY = 'quiz_progress';

  function cleanResponse(rawText) {
    let text = String(rawText || '').replace(/<thinking[\s\S]*?<\/think>/gi, '').trim();
    const open = text.match(/<thinking/gi);
    if (open) text = text.slice(0, text.indexOf(open[0])).trim();
    return text;
  }

  let total = $derived(quiz?.questions?.length || 0);
  let question = $derived(quiz?.questions?.[current]);
  let pct = $derived(result ? Math.round((result.score / result.total) * 100) : 0);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function saveProgress() {
    if (!quiz?._id) return;
    cacheSet(PROGRESS_KEY, {
      quizId: quiz._id,
      current,
      answers,
      timeLeft,
      timestamp: Date.now()
    }, 24 * 60 * 60 * 1000);
    showSavedIndicator = true;
    setTimeout(() => { showSavedIndicator = false; }, 2000);
  }

  function restoreProgress() {
    const saved = cacheGet(PROGRESS_KEY);
    if (saved && saved.quizId === page.params.quizId) {
      current = saved.current || 0;
      answers = saved.answers || [];
      timeLeft = saved.timeLeft || 10 * 60;
      return true;
    }
    return false;
  }

  async function loadQuiz() {
    try {
      const { data } = await withRetry(
        () => api.get(`/quiz/${page.params.quizId}`),
        { retries: 3 }
      );
      quiz = data.data;
      const hasProgress = restoreProgress();
      if (!hasProgress) {
        answers = new Array(quiz.questions.length).fill(null);
      }
      animateQuestion();
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  }

  function shakeWrong(element) {
    gsap.fromTo(element, { x: 0 }, { x: [-8, 8, -6, 6, -4, 4, 0], duration: 0.5, ease: 'power2.inOut' });
  }

  function bounceCorrect(element) {
    gsap.fromTo(element, { scale: 1 }, { scale: [1.04, 0.97, 1], duration: 0.4, ease: 'power2.out' });
  }

  function animateQuestion() {
    gsap.fromTo('.quiz-card', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.2)' });
    gsap.fromTo('.option', { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out', delay: 0.25 });
  }

  function pickOption(index) {
    if (answered || submitting) return;
    selected = index;
    answered = true;
    answers[current] = index;
    saveProgress();
    const correct = question.correct;
    if (index === correct) {
      bounceCorrect(optionRefs[index]);
    } else {
      shakeWrong(optionRefs[index]);
      bounceCorrect(optionRefs[correct]);
      fetchFeedback();
    }
  }

  async function fetchFeedback() {
    feedback = ''; feedbackError = ''; feedbackLoading = true;
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

  async function explainQuestion() {
    if (explaining) return;
    explaining = true; explanation = ''; explanationError = '';
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
      selected = null; answered = false; feedback = ''; feedbackError = ''; explanation = ''; explanationError = '';
      animateQuestion();
    } else {
      finish();
    }
  }

  async function finish() {
    if (submitting) return;
    submitting = true;
    submitError = '';
    try {
      const { data } = await withRetry(
        () => api.post('/performance', {
          quizId: quiz._id, noteId: quiz.noteId, subject: quiz.subject || '',
          answers, timeTakenSeconds: 10 * 60 - timeLeft
        }),
        { retries: 3 }
      );
      result = data.data;
      cacheDelete(PROGRESS_KEY);
      clearInterval(timerInterval);
      clearInterval(autoSubmitInterval);
    } catch (e) {
      if (isNetworkError(e)) {
        submitError = 'Could not submit — your answers are saved. We will try again automatically.';
        startAutoSubmit();
      } else {
        submitError = apiError(e);
      }
      submitting = false;
    }
  }

  function startAutoSubmit() {
    if (autoSubmitInterval) clearInterval(autoSubmitInterval);
    autoSubmitInterval = setInterval(async () => {
      try {
        const { data } = await api.post('/performance', {
          quizId: quiz._id, noteId: quiz.noteId, subject: quiz.subject || '',
          answers, timeTakenSeconds: 10 * 60 - timeLeft
        });
        result = data.data;
        cacheDelete(PROGRESS_KEY);
        clearInterval(timerInterval);
        clearInterval(autoSubmitInterval);
        submitting = false;
        submitError = '';
      } catch {}
    }, 30000);
  }

  async function manualRetrySubmit() {
    submitting = true;
    submitError = '';
    try {
      const { data } = await api.post('/performance', {
        quizId: quiz._id, noteId: quiz.noteId, subject: quiz.subject || '',
        answers, timeTakenSeconds: 10 * 60 - timeLeft
      });
      result = data.data;
      cacheDelete(PROGRESS_KEY);
      clearInterval(timerInterval);
      clearInterval(autoSubmitInterval);
    } catch (e) {
      submitError = isNetworkError(e)
        ? 'Could not submit — your answers are saved. We will try again automatically.'
        : apiError(e);
      if (isNetworkError(e)) startAutoSubmit();
    } finally {
      submitting = false;
    }
  }

  function optionStyle(index) {
    if (!answered) return `background: var(--card); border-color: var(--border);`;
    if (index === question.correct) return `background: var(--green-light); border-color: var(--green);`;
    if (index === selected) return `background: color-mix(in srgb, var(--red) 10%, transparent); border-color: var(--red);`;
    return `background: var(--card); border-color: var(--border); opacity: 0.5;`;
  }

  onMount(() => {
    loadQuiz();
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) { clearInterval(timerInterval); finish(); }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(timerInterval);
    clearInterval(autoSubmitInterval);
  });
</script>

<svelte:head>
  <title>Quiz — Studiq</title>
</svelte:head>

{#if loading}
  <div style="max-width: 640px; margin: 0 auto">
    <div class="skeleton animate-pulse" style="height: 160px; border-radius: 14px; margin-bottom: 16px"></div>
    {#each Array(4) as _, i (i)}
      <div class="skeleton animate-pulse" style="height: 52px; border-radius: 10px; margin-bottom: 10px"></div>
    {/each}
  </div>
{:else if result}
  <!-- Results screen -->
  <div style="max-width: 480px; margin: 0 auto; text-align: center">
    <div style="
      background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 48px 32px;
    ">
      <div style="
        width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px;
        background: {pct >= 70 ? 'var(--green-light)' : pct >= 50 ? 'var(--amber-light)' : 'var(--red-light)'};
        color: {pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'};
        display: flex; align-items: center; justify-content: center;
      ">
        {#if pct >= 70}
          <Icon name="check" size={32} />
        {:else if pct >= 50}
          <Icon name="sparkles" size={32} />
        {:else}
          <Icon name="book" size={32} />
        {/if}
      </div>
      <h2 style="font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 8px; font-family: 'Plus Jakarta Sans', sans-serif;">
        {result.score}/{result.total}
      </h2>
      <p style="color: var(--muted); font-size: 14px; margin: 0 0 28px; font-weight: 500">{pct}% correct · {result.wrong} wrong</p>
      <button onclick={() => goto('/performance')} class="btn-primary" style="width: 100%; padding: 13px; font-size: 14px; border-radius: 12px; margin-bottom: 10px">
        View Performance →
      </button>
      <button onclick={() => goto('/flashcards/' + quiz.noteId)} class="btn-secondary" style="width: 100%; padding: 12px; font-size: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 6px">
        <Icon name="flashcards" size={14} /> Study with Flashcards
      </button>
    </div>
  </div>
{:else if error}
  <div style="max-width: 480px; margin: 0 auto; background: color-mix(in srgb, var(--red) 8%, transparent); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent); border-radius: 12px; padding: 24px; text-align: center; color: var(--red)">
    {error}
    <button onclick={loadQuiz} style="margin-top: 12px; background: var(--red); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Retry</button>
  </div>
{:else}
  <!-- Submit error banner -->
  {#if submitError}
    <div style="max-width: 640px; margin: 0 auto 16px; background: var(--amber-light); border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <span style="font-size: 12.5px; font-weight: 500; color: var(--text);">{submitError}</span>
      <button onclick={manualRetrySubmit} disabled={submitting} style="background: var(--amber); color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap;">
        {submitting ? 'Retrying...' : 'Retry Now'}
      </button>
    </div>
  {/if}
  <div style="max-width: 640px; margin: 0 auto">
    <!-- Progress bar + timer -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px">
      <div style="flex: 1">
        <div style="display: flex; gap: 4px; align-items: center">
          {#each Array(total) as _, i (i)}
            <div style="
              flex: 1; height: 5px; border-radius: 99px; transition: background .3s;
              background: {i < current ? 'var(--green)' : i === current ? 'var(--blue)' : 'var(--border)'};
            "></div>
          {/each}
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
          <span style="color: var(--muted); font-size: 11px; font-weight: 600">{current + 1} of {total}</span>
          {#if showSavedIndicator}
            <span style="color: var(--green); font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 3px;">
              <Icon name="check" size={9} /> Progress saved
            </span>
          {/if}
        </div>
      </div>
      <div style="
        background: var(--card); border: 1px solid var(--border); border-radius: 8px;
        padding: 6px 12px; font-size: 13px; font-weight: 700; 
        color: {timeLeft < 60 ? 'var(--red)' : 'var(--text)'};
        display: flex; align-items: center; gap: 5px; flex-shrink: 0;
      ">
        <Icon name="performance" size={13} />{formatTime(timeLeft)}
      </div>
    </div>

    <!-- Question card -->
    <div class="quiz-card premium-card" style="padding: 28px; margin-bottom: 20px">
      <div style="font-size: 11px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px">Question {current + 1}</div>
      <h2 style="font-size: 17px; font-weight: 700; color: var(--text); margin: 0 0 24px; line-height: 1.5">{question.question}</h2>

      <div style="display: flex; flex-direction: column; gap: 10px">
        {#each question.options as option, i (i)}
          <button
            bind:this={optionRefs[i]}
            onclick={() => pickOption(i)}
            disabled={answered}
            class="option"
            style="
              width: 100%; display: flex; align-items: center; gap: 12px;
              padding: 13px 16px; border-radius: 10px; border: 1.5px solid; text-align: left;
              font-family: inherit; cursor: {answered ? 'default' : 'pointer'};
              transition: border-color .18s, background .18s, transform .18s;
              {optionStyle(i)}
            "
          >
            <span style="
              width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
              background: var(--surface); border: 1px solid var(--border);
              display: flex; align-items: center; justify-content: center;
              font-size: 11px; font-weight: 800; color: var(--muted);
            ">{LETTERS[i]}</span>
            <span style="font-size: 13.5px; color: var(--text); font-weight: 500; flex: 1">{option.replace(/^[A-D]\.\s*/, '')}</span>
            {#if answered && i === question.correct}
              <span style="color: var(--green); flex-shrink: 0"><Icon name="check" size={14} /></span>
            {:else if answered && i === selected}
              <span style="color: var(--red); flex-shrink: 0"><Icon name="x" size={14} /></span>
            {/if}
          </button>
        {/each}
      </div>

      {#if answered}
        <!-- Answer explanation -->
        <div style="
          margin-top: 20px; background: var(--blue-light); border: 1px solid color-mix(in srgb, var(--blue) 20%, var(--border));
          border-radius: 10px; padding: 16px;
        ">
          <div style="font-size: 13px; font-weight: 700; color: var(--blue); margin-bottom: 6px">
            {selected === question.correct ? 'Correct!' : `The answer is ${LETTERS[question.correct]}`}
          </div>
          <div style="font-size: 13px; color: var(--text); font-weight: 500; line-height: 1.6">{question.explanation}</div>
        </div>

        {#if selected !== question.correct}
          <!-- AI Coach -->
          <div style="
            margin-top: 12px; background: color-mix(in srgb, var(--purple) 8%, var(--surface));
            border: 1px solid color-mix(in srgb, var(--purple) 20%, var(--border));
            border-radius: 10px; padding: 16px;
          ">
            <div style="display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: var(--purple); margin-bottom: 8px">
              <Icon name="ask" size={13} /> AI Coach
            </div>
            {#if feedbackLoading}
              <div style="height: 14px; width: 70%; background: color-mix(in srgb, var(--purple) 18%, var(--border)); border-radius: 6px; animation: pulse 1.5s ease-in-out infinite"></div>
            {:else if feedback}
              <div style="font-size: 13px; color: var(--text); font-weight: 500; line-height: 1.6">{feedback}</div>
            {:else if feedbackError}
              <div style="color: var(--red); font-size: 12.5px">Couldn't load feedback — {feedbackError}</div>
            {/if}
          </div>
        {/if}

        <button onclick={next} class="btn-primary" style="width: 100%; margin-top: 16px; padding: 13px; font-size: 14px; border-radius: 10px">
          {current < total - 1 ? 'Next question →' : 'Finish quiz'}
        </button>
      {:else}
        <!-- Concept explainer button -->
        <button
          onclick={explainQuestion}
          disabled={explaining}
          class="btn-secondary"
          style="width: 100%; margin-top: 20px; padding: 12px; font-size: 13px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 7px; {explaining ? 'opacity: .6' : ''}"
        >
          <Icon name="ask" size={13} />
          {explaining ? 'Explaining…' : 'Explain this concept'}
        </button>
        {#if explanation || explanationError}
          <div style="margin-top: 12px; background: var(--blue-light); border: 1px solid color-mix(in srgb, var(--blue) 18%, var(--border)); border-radius: 10px; padding: 16px">
            {#if explanationError}
              <div style="color: var(--red); font-size: 12.5px">Couldn't explain — {explanationError}</div>
            {:else}
              <div style="font-size: 12px; font-weight: 700; color: var(--blue); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em">Concept explainer</div>
              <div style="font-size: 13px; color: var(--text); font-weight: 500; line-height: 1.7; white-space: pre-line">{explanation}</div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  .option:not([disabled]):hover {
    transform: translateX(3px);
    border-color: var(--blue) !important;
  }
</style>
