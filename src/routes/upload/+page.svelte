<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, apiError } from '$lib/api/index.js';
  import gsap from 'gsap';

  let detectedSubject = '';
  let file = null;
  let fileName = '';
  let pastedText = '';
  let dragging = false;
  let loading = false;
  let error = '';
  let dropZoneRef;
  let glowTween;

  onMount(() => {
    // ANIMATION 4: page title and drop zone
    gsap.fromTo('.page-head',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    gsap.fromTo('.drop-zone',
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.3)', delay: 0.2 }
    );
  });

  function onDrop(e) {
    dragging = false;
    stopGlow();
    if (dropZoneRef) {
      gsap.to(dropZoneRef, { scale: 1, duration: 0.2, ease: 'power2.out' });
    }
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }

  function onDragOver() {
    dragging = true;
    startGlow();
    if (dropZoneRef) {
      gsap.fromTo(dropZoneRef, { scale: 0.97 }, { scale: 1.02, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    }
  }

  function onDragLeave() {
    dragging = false;
    stopGlow();
    if (dropZoneRef) {
      gsap.to(dropZoneRef, { scale: 1, duration: 0.2, ease: 'power2.out' });
    }
  }

  // ANIMATION 4: pulsing glow while a file is dragged over the drop zone
  function startGlow() {
    if (glowTween) return;
    glowTween = gsap.to('.drop-zone', {
      boxShadow: '0 0 0 3px #2563eb40',
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  function stopGlow() {
    if (glowTween) {
      glowTween.kill();
      glowTween = null;
      if (dropZoneRef) gsap.to(dropZoneRef, { boxShadow: 'none', duration: 0.2 });
    }
  }

  function setFile(f) {
    const ok = ['application/pdf', 'text/plain'].includes(f.type) || f.name.endsWith('.docx') || f.name.endsWith('.pdf') || f.name.endsWith('.txt');
    if (!ok) {
      error = 'Only .pdf, .docx and .txt files are allowed';
      return;
    }
    error = '';
    file = f;
    fileName = f.name;
  }

  async function analyse() {
    error = '';
    if (!file && !pastedText.trim()) {
      error = 'Upload a file or paste some notes first';
      return;
    }
    loading = true;
    try {
      const form = new FormData();
      if (file) form.append('file', file);
      if (pastedText.trim()) {
        form.append('pastedText', pastedText.trim());
        form.append('title', 'Pasted Notes');
      }
      const { data } = await api.post('/notes/upload', form, { timeout: 180000 });
      detectedSubject = data.data?.note?.subject || 'General';
      const quizId = data.data?.quiz?._id;
      if (quizId) {
        goto(`/quiz/${quizId}`);
      } else {
        goto('/performance');
      }
    } catch (e) {
      error = apiError(e);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Upload Notes — Studiq</title>
</svelte:head>

<div class="max-w-3xl">
  <div class="page-head mb-6">
    <h2 class="text-xl font-bold text-ink">Upload Study Notes</h2>
    <p class="mt-1 text-sm text-muted">Drop your notes or paste text — Studiq will summarise, extract topics, and generate a quiz automatically.</p>
  </div>

  <!-- Subject auto-detection -->
  <div class="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line bg-blue-50 px-4 py-3 text-sm font-medium text-primary">
    <span>🤖 Subject will be auto-detected by AI from your content</span>
    {#if detectedSubject}
      <span class="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-success">
        ✓ Detected: {detectedSubject}
      </span>
    {/if}
  </div>

  <!-- Drop zone -->
  <div
    bind:this={dropZoneRef}
    role="button"
    tabindex="0"
    class="drop-zone cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition {dragging ? 'border-primary bg-primary-light' : 'border-line bg-white hover:border-blue-300'}"
    ondragover={(e) => { e.preventDefault(); onDragOver(); }}
    ondragleave={onDragLeave}
    ondrop={(e) => { e.preventDefault(); onDrop(e); }}
    onclick={() => document.getElementById('fileInput')?.click()}
    onkeydown={(e) => e.key === 'Enter' && document.getElementById('fileInput')?.click()}
  >
    <div class="text-5xl">📄</div>
    <p class="mt-3 text-sm font-semibold text-ink">{fileName || 'Drag & drop your notes here'}</p>
    <p class="mt-1 text-xs text-muted">or click to browse · PDF, DOCX, TXT · max 20MB</p>
    {#if fileName}
      <span class="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">{fileName}</span>
    {/if}
    <input id="fileInput" type="file" accept=".pdf,.docx,.txt" class="hidden" onchange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
  </div>

  <div class="my-4 flex items-center gap-3 text-xs text-muted">
    <div class="h-px flex-1 bg-line"></div>
    OR
    <div class="h-px flex-1 bg-line"></div>
  </div>

  <!-- Paste text -->
  <textarea
    bind:value={pastedText}
    rows="6"
    placeholder="Paste your study notes here…"
    class="w-full rounded-xl border border-line bg-white p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
  ></textarea>

  {#if error}
    <div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
  {/if}

  <button
    onclick={analyse}
    disabled={loading}
    class="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
  >
    {loading ? '🤖 Analysing with AI…' : 'Analyse with AI'}
  </button>
</div>
