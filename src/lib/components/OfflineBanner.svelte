<script>
  import { isOffline } from '$lib/stores/network.js';
  import Icon from './Icon.svelte';
</script>

{#if $isOffline}
  <div class="offline-banner" role="alert" transition:slide>
    <Icon name="info" size={14} />
    <span>You are offline — some features may not work until your connection returns</span>
  </div>
{/if}

<style>
  .offline-banner {
    position: sticky;
    top: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--amber);
    color: #000;
    font-size: 12.5px;
    font-weight: 600;
    text-align: center;
  }
</style>
