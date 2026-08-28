<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api, apiError, withRetry, isNetworkError } from '$lib/api/index.js';
  import { cacheSet, cacheGet, cacheDelete } from '$lib/utils/cache.js';
  import Icon from '$lib/components/Icon.svelte';
  import gsap from 'gsap';

  let detectedSubject = $state('');
  let file = $state(null);
  let fileName = $state('');
  let pastedText = $state('');
  let dragging = $state(false);
  let loading = $state(false);
  let error = $state('');
  let dropZoneRef;
  let glowTween;
  let subjectMismatch = $state(null);
  let showDraftBanner = $state(false);
  let draftTimestamp = $state(null);
  
  // Subject selection
  let userSubjects = $state([]);
  let selectedSubject = $state('');
  let newSubject = $state('');
  let showAddSubject = $state(false);
  let addingSubject = $state(false);

  const DRAFT_KEY = 'upload_draft';

  onMount(() => {
    gsap.fromTo('.page-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.drop-zone', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.3)', delay: 0.2 });
    gsap.fromTo('.upload-form', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.35 });
    loadSubjects();
    checkDraft();
    // Pre-select subject from URL query param
    const param = $page.url.searchParams.get('subject');
    if (param) selectedSubject = decodeURIComponent(param);
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  function handleBeforeUnload(e) {
    if (loading) {
      e.preventDefault();
      e.returnValue = 'Upload in progress — are you sure you want to leave?';
    }
  }

  function checkDraft() {
    const draft = cacheGet(DRAFT_KEY);
    if (draft && draft.pastedText?.trim()) {
      showDraftBanner = true;
      draftTimestamp = draft.timestamp;
    }
  }

  function restoreDraft() {
    const draft = cacheGet(DRAFT_KEY);
    if (draft) {
      pastedText = draft.pastedText || '';
      if (draft.selectedSubject) selectedSubject = draft.selectedSubject;
      showDraftBanner = false;
    }
  }

  function dismissDraft() {
    cacheDelete(DRAFT_KEY);
    showDraftBanner = false;
  }

  function saveDraft() {
    if (pastedText.trim()) {
      cacheSet(DRAFT_KEY, {
        pastedText,
        selectedSubject,
        timestamp: Date.now()
      }, 24 * 60 * 60 * 1000);
    }
  }

  // Auto-save draft when content changes
  $effect(() => {
    if (pastedText) {
      saveDraft();
    }
  });

  // Dynamically update selected subject when URL query param changes
  $effect(() => {
    const param = $page.url.searchParams.get('subject');
    if (param) {
      selectedSubject = decodeURIComponent(param);
    } else {
      selectedSubject = '';
    }
  });

  async function loadSubjects() {
    try {
      const { data } = await api.get('/subjects');
      userSubjects = data.data || [];
    } catch {}
  }

  async function addNewSubject() {
    if (!newSubject.trim()) return;
    addingSubject = true;
    try {
      await api.post('/subjects/add', { name: newSubject.trim() });
      userSubjects = [...userSubjects, newSubject.trim()];
      newSubject = '';
      showAddSubject = false;
    } catch (e) {
      error = apiError(e);
    } finally {
      addingSubject = false;
    }
  }

  function selectSubject(s) {
    selectedSubject = selectedSubject === s ? '' : s;
  }

  function onDrop(e) {
    dragging = false;
    stopGlow();
    if (dropZoneRef) gsap.to(dropZoneRef, { scale: 1, duration: 0.2, ease: 'power2.out' });
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }

  function onDragOver() {
    dragging = true;
    startGlow();
    if (dropZoneRef) gsap.fromTo(dropZoneRef, { scale: 0.98 }, { scale: 1.02, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
  }

  function onDragLeave() {
    dragging = false;
    stopGlow();
    if (dropZoneRef) gsap.to(dropZoneRef, { scale: 1, duration: 0.2, ease: 'power2.out' });
  }

  function startGlow() {
    if (glowTween) return;
    glowTween = gsap.to(dropZoneRef, {
      boxShadow: '0 0 0 3px color-mix(in srgb, var(--blue) 30%, transparent)',
      duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut'
    });
  }

  function stopGlow() {
    if (glowTween) { glowTween.kill(); glowTween = null; }
    if (dropZoneRef) gsap.to(dropZoneRef, { boxShadow: 'none', duration: 0.2 });
  }

  function setFile(f) {
    const ok = ['application/pdf', 'text/plain'].includes(f.type) || f.name.endsWith('.docx') || f.name.endsWith('.pdf') || f.name.endsWith('.txt');
    if (!ok) { error = 'Only .pdf, .docx and .txt files are allowed'; return; }
    error = '';
    file = f;
    fileName = f.name;
  }

  async function analyse() {
    error = '';
    subjectMismatch = null;
    if (!file && !pastedText.trim()) { error = 'Upload a file or paste some notes first'; return; }
    loading = true;
    try {
      const form = new FormData();
      if (file) form.append('file', file);
      if (pastedText.trim()) {
        form.append('pastedText', pastedText.trim());
        form.append('title', 'Pasted Notes');
      }
      if (selectedSubject) form.append('subject', selectedSubject);
      const { data } = await withRetry(
        () => api.post('/notes/upload', form, { timeout: 180000 }),
        { retries: 3 }
      );
      detectedSubject = data.data?.note?.subject || 'General';
      // Use server's subject verification result
      const verification = data.data?.subjectVerification;
      if (verification?.mismatch) {
        subjectMismatch = { selected: verification.selected, detected: verification.detected };
      }
      cacheDelete(DRAFT_KEY);
      const quizId = data.data?.quiz?._id;
      if (quizId) goto(`/quiz/${quizId}`);
      else goto('/performance');
    } catch (e) {
      if (isNetworkError(e)) {
        error = 'Upload failed due to network error. Your content is saved — please retry when connection returns.';
      } else {
        error = apiError(e);
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Upload Notes — Studiq</title>
</svelte:head>

<div style="max-width: 680px; margin: 0 auto;">
  <!-- Page Header -->
  <div class="page-head" style="margin-bottom: 28px;">
    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--text); margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
      Upload <span style="color: var(--blue)">Notes</span>
    </h1>
    <p style="color: var(--muted); font-size: 13.5px; margin: 0; font-weight: 500;">
      Drop your notes or paste text — Studiq will summarise, extract topics, and generate a quiz automatically.
    </p>
  </div>

  <!-- Subject banner -->
  {#if selectedSubject}
    <div style="
      display: flex; align-items: center; gap: 10px; justify-content: space-between;
      background: var(--blue-light); border: 1px solid color-mix(in srgb, var(--blue) 20%, var(--border));
      border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; color: var(--blue);
      margin-bottom: 20px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <Icon name="subject" size={14} />
        Subject: <span style="background: var(--blue); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px;">{selectedSubject}</span>
      </div>
      <button onclick={() => { selectedSubject = ''; subjectMismatch = null; }} style="background: none; border: none; color: var(--muted); cursor: pointer; font-size: 12px; padding: 0;">Change</button>
    </div>
  {:else}
    <div style="
      display: flex; align-items: center; gap: 10px; justify-content: space-between;
      background: var(--blue-light); border: 1px solid color-mix(in srgb, var(--blue) 20%, var(--border));
      border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; color: var(--blue);
      margin-bottom: 20px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <Icon name="ask" size={14} />
        Subject will be auto-detected by AI from your content
      </div>
    </div>
  {/if}

  <!-- Draft restore banner -->
  {#if showDraftBanner}
    <div style="
      display: flex; align-items: center; gap: 10px; justify-content: space-between;
      background: var(--amber-light); border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
      border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--text);
      margin-bottom: 20px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <Icon name="info" size={14} />
        {#if draftTimestamp}
          You have unsaved notes from {new Date(draftTimestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        {:else}
          You have unsaved notes from a previous session
        {/if}
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick={restoreDraft} style="background: var(--blue); color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Restore</button>
        <button onclick={dismissDraft} style="background: transparent; color: var(--muted); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Dismiss</button>
      </div>
    </div>
  {/if}

  <!-- Subject mismatch notice -->
  {#if subjectMismatch}
    <div style="
      display: flex; align-items: center; gap: 10px;
      background: var(--amber-light);
      border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
      border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--text);
      margin-bottom: 20px;
    ">
      <Icon name="info" size={14} />
      We detected this content is about <strong>{subjectMismatch.detected}</strong> rather than <strong>{subjectMismatch.selected}</strong>. We've updated it automatically.
    </div>
  {/if}

  <!-- Drop zone -->
  <div
    bind:this={dropZoneRef}
    role="button"
    tabindex="0"
    class="drop-zone"
    style="
      border: 2px dashed {dragging ? 'var(--blue)' : 'var(--border)'};
      background: {dragging ? 'var(--blue-light)' : 'var(--card)'};
      border-radius: 14px; padding: 48px 32px; text-align: center;
      cursor: pointer; transition: border-color .2s, background .2s;
    "
    ondragover={(e) => { e.preventDefault(); onDragOver(); }}
    ondragleave={onDragLeave}
    ondrop={(e) => { e.preventDefault(); onDrop(e); }}
    onclick={() => document.getElementById('fileInput')?.click()}
    onkeydown={(e) => e.key === 'Enter' && document.getElementById('fileInput')?.click()}
  >
    <div style="
      width: 64px; height: 64px; border-radius: 16px; 
      background: {fileName ? 'var(--green-light)' : 'var(--blue-light)'}; 
      color: {fileName ? 'var(--green)' : 'var(--blue)'};
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    ">
      <Icon name="upload" size={28} />
    </div>
    <p style="color: var(--text); font-size: 15px; font-weight: 700; margin: 0 0 6px">
      {fileName || 'Drag & drop your notes here'}
    </p>
    <p style="color: var(--muted); font-size: 13px; margin: 0; font-weight: 500">
      or click to browse · PDF, DOCX, TXT · max 20 MB
    </p>
    {#if fileName}
      <span style="
        display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
        background: var(--green-light); color: var(--green); font-size: 12px; font-weight: 700;
        padding: 6px 14px; border-radius: 99px;
      ">
        <Icon name="check" size={11} /> {fileName}
      </span>
    {/if}
    <input id="fileInput" type="file" accept=".pdf,.docx,.txt" style="display: none"
      onchange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
  </div>

  <!-- Divider -->
  <div style="display: flex; align-items: center; gap: 14px; margin: 20px 0;">
    <div style="flex: 1; height: 1px; background: var(--border)"></div>
    <span style="color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: .05em">OR</span>
    <div style="flex: 1; height: 1px; background: var(--border)"></div>
  </div>

  <!-- Paste area -->
  <div class="upload-form">
    <label style="display: block; font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px" for="pasteArea">Paste your notes</label>
    <textarea
      id="pasteArea"
      bind:value={pastedText}
      rows="7"
      placeholder="Paste your study notes here…"
      style="
        width: 100%; padding: 14px 16px; background: var(--card); border: 1px solid var(--border);
        border-radius: 12px; color: var(--text); font-size: 13.5px; font-family: inherit;
        outline: none; resize: vertical; line-height: 1.6; box-sizing: border-box;
        transition: border-color .2s;
      "
    ></textarea>

    {#if error}
      <div style="
        margin-top: 14px; background: color-mix(in srgb, var(--red) 10%, transparent);
        color: var(--red); border: 1px solid color-mix(in srgb, var(--red) 25%, transparent);
        border-radius: 10px; padding: 10px 14px; font-size: 12.5px; font-weight: 500;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
      ">
        <span>{error}</span>
        <button onclick={analyse} style="background: var(--red); color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap;">Retry</button>
      </div>
    {/if}

    <button
      onclick={analyse}
      disabled={loading}
      class="btn-primary"
      style="
        width: 100%; margin-top: 16px; padding: 14px; font-size: 14px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        {loading ? 'opacity: .7; cursor: not-allowed;' : ''}
      "
    >
{#if loading}
         <span style="width: 14px; height: 14px; border: 2px solid var(--surface); border-top-color: var(--text); border-radius: 50%; display: inline-block; animation: spin .7s linear infinite"></span>
         Analysing with AI…
      {:else}
        <Icon name="ask" size={15} /> Analyse with AI
      {/if}
    </button>
  </div>
</div>
