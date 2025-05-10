<!-- NostrReference.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { nostrEventStore } from './nostr-store.svelte';
	import { createKey, nostrIdLink } from './nostr-fetch-utils';
	import type { Event as NostrEvent } from 'nostr-tools';
	import EventViewer from './Components/EventViewer.svelte';

	let { nostrId } = $props();
	let event: NostrEvent | null = $state(null);
	let isLoading = $state(true);
	let error: string | null = $state(null);

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

			event = (await nostrEventStore.fetchEvent(key)) as NostrEvent | null;
		} catch (err: any) {
			error = `エラーが発生しました: ${err.message}`;
		} finally {
			isLoading = false;
		}
	});
	const clickLink = () => window.open(nostrIdLink(nostrId), '_blank', 'noreferrer');
</script>

<div class="w-fit">
	{#if isLoading}
		<div class="nostr-loading">読み込み中...</div>
	{:else if error}
		<div class="nostr-error">{error}</div>
	{:else if event}
		<div class="nostr-content m-1">
			<EventViewer {event} {clickLink} />
		</div>
	{/if}
</div>

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
