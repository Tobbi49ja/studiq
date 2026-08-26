<script>
  import { onMount } from 'svelte';
  import Icon from '../Icon.svelte';

  let { plan = [] } = $props();

  let expanded = $state(new Set());
  // checked state per task: "dayIdx:taskIdx" -> true
  let checked = $state(new Set());
  // added custom tasks keyed by dayIdx
  let added = $state({});
  // inline "add item" input text per expanded day
  let draft = $state({});

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
    <div style="display: flex; flex-direction: column; gap: 10px">
      {#each plan.slice(0, 7) as day, dayIdx (dayIdx)}
        {@const tasks = taskList(day, dayIdx)}
        {@const baseCount = (day.sessions || []).length}
        {@const done = completedCount(day, dayIdx)}
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden">
          <!-- Day header -->
          <button
            onclick={() => toggleExpand(dayIdx)}
            style="
              width: 100%; display: flex; align-items: center; justify-content: space-between;
              gap: 10px; padding: 14px 16px; background: transparent; border: none; cursor: pointer;
              font-family: inherit; color: var(--text); text-align: left;
            "
          >
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
              <span style="font-size: 11px; font-weight: 700; color: var(--blue); background: var(--blue-light); border-radius: 6px; padding: 4px 8px; white-space: nowrap">Day {day.day}</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{day.date}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0">
              <span style="font-size: 11px; color: var(--muted); font-weight: 600;">{done}/{tasks.length}</span>
              <span style="color: var(--muted); display: flex; transition: transform .2s; {expanded.has(dayIdx) ? 'transform: rotate(90deg)' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </button>

          {#if expanded.has(dayIdx)}
            <div style="padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border)">
              {#if tasks.length}
                {#each tasks as t, ti (t.key)}
                  <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; {isChecked(t.key) ? 'opacity: .6' : ''}">
                    <button
                      onclick={() => toggleCheck(t.key)}
                      aria-label="Toggle complete"
                      style="
                        width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border);
                        display: flex; align-items: center; justify-content: center; cursor: pointer;
                        background: {isChecked(t.key) ? 'var(--green)' : 'transparent'}; flex-shrink: 0;
                        transition: background 0.15s, border-color 0.15s;
                      "
                    >
                      {#if isChecked(t.key)}
                        <span style="color: #ffffff; display: flex; align-items: center; justify-content: center;">
                          <Icon name="check" size={10} />
                        </span>
                      {/if}
                    </button>
                    <div style="flex: 1; min-width: 0">
                      {#if t.subject}
                        <div style="font-size: 10px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: 0.02em;">{t.subject}</div>
                      {/if}
                      <div style="font-size: 12.5px; font-weight: 500; color: var(--text); {isChecked(t.key) ? 'text-decoration: line-through' : ''}">{t.topic}</div>
                    </div>
                    {#if t.duration}
                      <span style="font-size: 10px; font-weight: 600; color: var(--muted); background: var(--border); padding: 2px 6px; border-radius: 4px; flex-shrink: 0">{t.duration}</span>
                    {/if}
                    {#if t.key.includes('custom')}
                      <button onclick={() => removeAdded(dayIdx, ti - baseCount)} aria-label="Remove"
                        style="background: none; border: none; cursor: pointer; color: var(--red); display: flex; align-items: center; flex-shrink: 0">
                        <Icon name="x" size={12} />
                      </button>
                    {/if}
                  </div>
                {/each}
              {:else}
                <div style="color: var(--muted); font-size: 12px; padding: 6px 2px; font-weight: 500;">No tasks for this day — add one below.</div>
              {/if}

              <!-- Add item -->
              <div style="display: flex; gap: 8px; margin-top: 4px">
                <input
                  type="text"
                  placeholder="Add a task…"
                  bind:value={draft[dayIdx]}
                  onkeydown={(e) => { e.key === 'Enter' && addItem(dayIdx); e.key === 'Escape' && (draft = { ...draft, [dayIdx]: '' }); }}
                  style="
                    flex: 1; min-width: 0; padding: 8px 12px; background: var(--bg);
                    border: 1px solid var(--border); border-radius: 6px; color: var(--text);
                    font-size: 12.5px; font-family: inherit; outline: none;
                  "
                />
                <button
                  onclick={() => addItem(dayIdx)}
                  class="btn-primary"
                  style="
                    font-size: 12px; font-weight: 700; padding: 0 14px; cursor: pointer; border-radius: 6px;
                  "
                >
                  <Icon name="plus" size={12} /> Add
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div style="color: var(--muted); font-size: 13px; padding: 8px 0; font-weight: 500;">Take a quiz, then generate your 7-day study plan.</div>
  {/if}
</div>