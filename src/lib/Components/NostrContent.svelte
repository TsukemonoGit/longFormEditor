<!-- NostrContent.svelte -->
<script lang="ts">
	import {  createNoteEmbedHTML, createFilter } from "$lib/nostr-fetch-utils";
	import { keyToString, nostrEventStore } from "$lib/nostr-store.svelte";


    
    // プロパティ
   let {key}: {key:string[]}=$props();
    
    //let filter = $derived(createFilter(key));
    let loading = $state(false);
    let error = $state<string | null>(null);
    let eventData = $state<any>(null);
    
    // 派生値
    let content = $derived(eventData ? createNoteEmbedHTML(eventData) : '');
    
  
    
    // イベントの取得状態を監視して更新
    $effect(() => {
      // ストアから関連するデータを監視
      if (key) {
        // キャッシュから確認
        const cachedEvent = nostrEventStore.getEventById(key);
        if (cachedEvent) {
          eventData = cachedEvent;
          loading = false;
          error = null;
          return;
        }
        
        // ロード中かどうか確認
        loading = !!nostrEventStore.loading[keyToString(key)];
        
        // エラーがあれば表示
        error = nostrEventStore.errors[keyToString(key)] || null;
        
        // データが見つからなければ取得を開始
        if (!eventData && !loading && !error) {
          fetchData();
        }
      }
    });
    
    // データ取得関数
    async function fetchData() {
      if (!key) return;
      
      loading = true;
      error = null;
      
      try {
        const event = await nostrEventStore.fetchEvent(key);
        if (event) {
          eventData = event;
        } else {
          error = 'ノートの取得に失敗しました';
        }
      } catch (e: any) {
        error = e.message || 'エラーが発生しました';
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div class="nostr-content">
    {#if loading}
      <div class="nostr-note-loading">ノート読み込み中...</div>
    {:else if error}
      <div class="nostr-embed-error">{error}</div>
    {:else if eventData}
      {@html content}
    {:else}
      <div class="nostr-embed-error">ノートデータがありません</div>
    {/if}
  </div>
  
  <style>
    .nostr-content {
      margin: 0.5rem 0;
    }
    
    .nostr-note-loading {
      padding: 0.5rem;
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
      color: #6c757d;
    }
    
    .nostr-embed-error {
      border-left: 4px solid #ff6347;
      padding: 8px 12px;
      margin: 8px 0;
      background-color: rgba(255, 99, 71, 0.1);
      color: #e74c3c;
    }
  </style>