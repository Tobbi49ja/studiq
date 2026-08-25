<script>
  import { onMount } from 'svelte';

  export let plan = [];

  let expanded = new Set();
  // checked state per task: "dayIdx:taskIdx" -> true
  let checked = new Set();
  // added custom tasks keyed by dayIdx
  let added = {};
  // inline "add item" input text per expanded day
  let draft = {};

  const STORAGE_KEY = 'studiq-plan-state';

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        checked = new Set(parsed.checked || []);
        added = parsed.added || {};
      }
    } catch (e) {
      // ignore corrupted storage
    }
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked: [...checked], added }));
    } catch (e) {
      // storage may be unavailable
    }
  }

  function toggleExpand(dayIdx) {
    const next = new Set(expanded);
    if (next.has(dayIdx)) next.delete(dayIdx);
    else next.add(dayIdx);
    expanded = next;
  }

  function taskList(day, dayIdx) {
    const base = (day.sessions || []).map((s, i) => ({
      key: `${dayIdx}:${i}`,
      subject: s.subject,
      topic: s.topic,
      duration: s.duration,
      activity: s.activity
    }));
    const custom = (added[dayIdx] || []).map((t, i) => ({
      key: `${dayIdx}:custom:${i}`,
      subject: t.subject,
      topic: t.topic,
      duration: t.duration,
      activity: t.activity || 'Custom'
    }));
    return [...base, ...custom];
  }

  function isChecked(key) {
    return checked.has(key);
  }

  function toggleCheck(key) {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    checked = next;
    persist();
  }

  function completedCount(day, dayIdx) {
    return taskList(day, dayIdx).filter((t) => isChecked(t.key)).length;
  }

  function addItem(dayIdx) {
    const text = (draft[dayIdx] || '').trim();
    if (!text) return;
    added = {
      ...added,
      [dayIdx]: [...(added[dayIdx] || []), { subject: '', topic: text, duration: '', activity: 'Custom' }]
    };
    draft = { ...draft, [dayIdx]: '' };
    persist();
  }

  function removeAdded(dayIdx, itemIdx) {
    const list = (added[dayIdx] || []).filter((_, i) => i !== itemIdx);
    const next = { ...added };
    if (list.length) next[dayIdx] = list;
    else delete next[dayIdx];
    added = next;
    persist();
  }
</script>

<div>
  {#if plan.length}
    <div style="display:flex; flex-direction:column; gap:10px">
      {#each plan.slice(0, 7) as day, dayIdx (dayIdx)}
        {@const tasks = taskList(day, dayIdx)}
        {@const baseCount = (day.sessions || []).length}
        {@const done = completedCount(day, dayIdx)}
        <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden">
          <!-- Day header (tappable) -->
          <button
            onclick={() => toggleExpand(dayIdx)}
            style="
              width:100%; display:flex; align-items:center; justify-content:space-between;
              gap:10px; padding:12px 14px; background:transparent; border:none; cursor:pointer;
              font-family:inherit; color:var(--text); text-align:left;
            "
          >
            <div style="display:flex; align-items:center; gap:10px; min-width:0">
              <span style="font-size:12px; font-weight:700; color:var(--blue); background:color-mix(in srgb, var(--blue) 14%, transparent); border-radius:8px; padding:4px 8px; white-space:nowrap">Day {day.day}</span>
              <span style="font-size:12.5px; font-weight:600; color:var(--text); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{day.date}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0">
              <span style="font-size:11px; color:var(--muted)">{done}/{tasks.length}</span>
              <span style="color:var(--muted); transition:transform .2s; {expanded.has(dayIdx) ? 'transform:rotate(90deg)' : ''}">▶</span>
            </div>
          </button>

          {#if expanded.has(dayIdx)}
            <div style="padding:4px 14px 14px; display:flex; flex-direction:column; gap:8px">
              {#if tasks.length}
                {#each tasks as t, ti (t.key)}
                  <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; background:var(--bg); border-radius:9px; {isChecked(t.key) ? 'opacity:.6' : ''}">
                    <button
                      onclick={() => toggleCheck(t.key)}
                      aria-label="Toggle complete"
                      style="
                        width:18px; height:18px; border-radius:5px; border:1px solid var(--border);
                        display:flex; align-items:center; justify-content:center; cursor:pointer;
                        background:{isChecked(t.key) ? 'var(--green)' : 'transparent'}; flex-shrink:0;
                      "
                    >{#if isChecked(t.key)}<span style="color:#050A0F; font-size:11px; font-weight:800">✓</span>{/if}</button>
                    <div style="flex:1; min-width:0">
                      {#if t.subject}
                        <div style="font-size:11px; font-weight:600; color:var(--blue)">{t.subject}</div>
                      {/if}
                      <div style="font-size:12.5px; color:var(--text); {isChecked(t.key) ? 'text-decoration:line-through' : ''}">{t.topic}</div>
                    </div>
                    {#if t.duration}
                      <span style="font-size:10px; color:var(--muted); flex-shrink:0">{t.duration}</span>
                    {/if}
                    {#if t.key.includes('custom')}
                      <button onclick={() => removeAdded(dayIdx, ti - baseCount)} aria-label="Remove"
                        style="background:none; border:none; cursor:pointer; color:var(--muted); font-size:13px; flex-shrink:0">✕</button>
                    {/if}
                  </div>
                {/each}
              {:else}
                <div style="color:var(--muted); font-size:12px; padding:6px 2px">No tasks for this day — add one below.</div>
              {/if}

              <!-- Add item -->
              <div style="display:flex; gap:8px; margin-top:4px">
                <input
                  type="text"
                  placeholder="Add a task…"
                  bind:value={draft[dayIdx]}
                  onkeydown={(e) => { e.key === 'Enter' && addItem(dayIdx); e.key === 'Escape' && (draft = { ...draft, [dayIdx]: '' }); }}
                  style="
                    flex:1; min-width:0; padding:8px 10px; background:var(--surface);
                    border:1px solid var(--border); border-radius:8px; color:var(--text);
                    font-size:12.5px; font-family:inherit; outline:none;
                  "
                />
                <button
                  onclick={() => addItem(dayIdx)}
                  style="
                    background:var(--blue); border:none; border-radius:8px; color:#050A0F;
                    font-size:12px; font-weight:700; padding:0 14px; cursor:pointer; font-family:inherit;
                  "
                >+ Add</button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div style="color:var(--muted); font-size:13px; padding:8px 0">Take a quiz, then generate your 7-day study plan.</div>
  {/if}
</div>