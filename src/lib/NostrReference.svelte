<!-- NostrReference.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { nostrEventStore } from './nostr-store.svelte';
    import { createKey } from './nostr-fetch-utils';
	import type { Event as NostrEvent} from 'nostr-tools';
	import EventViewer from './EventViewer.svelte';
  
    export let nostrId: string;
    
    let event: NostrEvent | null = null;
    let isLoading = true;
    let error: string | null = null;
  
    onMount(async () => {
      try {
        if (!nostrId) {
          error = "Nostr IDがありません";
          return;
        }
        
        const key = createKey(nostrId);
        if (!key) {
          error = "無効なNostr IDです";
          return;
        }
        
         event = await nostrEventStore.fetchEvent(key);
       
      } catch (err:any) {
        error = `エラーが発生しました: ${err.message}`;
      } finally {
        isLoading = false;
      }
    });
  </script>
  
  {#if isLoading}
    <div class="nostr-loading">読み込み中...</div>
  {:else if error}
    <div class="nostr-error">{error}</div>
  {:else if event}
    <div class="nostr-content">
      <EventViewer event={event} />
    </div>
  {/if}
  
  <style>
    .nostr-loading {
      color: #888;
      font-style: italic;
    }
    
    .nostr-error {
      color: #e74c3c;
      font-style: italic;
    }
    
    .nostr-content {
      border-left: 3px solid #3498db;
      padding-left: 1rem;
      margin: 0.5rem 0;
    }
  </style>