<!-- NostrReference.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { nostrEventStore } from './nostr-store.svelte';
	import { createKey, nostrIdLink } from './nostr-fetch-utils';
	import type { Event as NostrEvent } from 'nostr-tools';
	import EventViewer from './EventViewer.svelte';

	export let nostrId: string;

	let event: NostrEvent | null = null;
	let isLoading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			if (!nostrId) {
				error = 'Nostr IDがありません';
				return;
			}

			const key = createKey(nostrId);
			if (!key) {
				error = '無効なNostr IDです';
				return;
			}

			event = await nostrEventStore.fetchEvent(key);
		} catch (err: any) {
			error = `エラーが発生しました: ${err.message}`;
		} finally {
			isLoading = false;
		}
	});
</script>

<button
	type="button"
	class="w-fit"
	onclick={() => window.open(nostrIdLink(nostrId), '_blank', 'noreferrer')}
>
	{#if isLoading}
		<div class="nostr-loading">読み込み中...</div>
	{:else if error}
		<div class="nostr-error">{error}</div>
	{:else if event}
		<div class="nostr-content">
			<EventViewer {event} />
		</div>
	{/if}
</button>

<style>
	.nostr-loading {
		color: #888;
		font-style: italic;
	}

	.nostr-error {
		color: #e74c3c;
		font-style: italic;
	}
</style>
