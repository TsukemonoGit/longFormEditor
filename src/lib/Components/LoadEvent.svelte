<script lang="ts">
	import { nostrEventStore } from '../nostr-store.svelte';
	import { createKey } from '../nostr-fetch-utils';
	import type { Event as NostrEvent } from 'nostr-tools';
	import { untrack, type Snippet } from 'svelte';

	interface Props {
		nostrId: string;
		loading?: Snippet;
		error?: Snippet<[string]>;
		content?: Snippet<[NostrEvent, boolean]>;
	}

	let { nostrId, loading, error, content }: Props = $props();

	let event = $state<NostrEvent | null>(null);
	let errorMessage = $state<string | null>(null);
	let isLoading = $state(false);
	let isPartialData = $state(true);

	async function fetchWithRelays(tag: string[], relays?: string[]) {
		return await nostrEventStore.fetchEventWithProgress(tag, relays, (progress) => {
			if (progress.event) {
				event = progress.event;
				isPartialData = progress.isPartial;

				if (progress.isPartial && isLoading) {
					isLoading = false;
				}
			}
		});
	}

	async function fetchData() {
		try {
			if (!nostrId) {
				errorMessage = 'Nostr ID not available';
				return;
			}

			const key = createKey(nostrId);
			if (!key) {
				errorMessage = 'Invalid Nostr ID';
				return;
			}

			isLoading = true;
			isPartialData = true;
			event = null;
			errorMessage = null;

			event = (await fetchWithRelays(key.tag)) as NostrEvent | null;

			if (event) {
				isPartialData = false;
			} else if (key.relays && key.relays.length > 0) {
				event = (await fetchWithRelays(key.tag, key.relays)) as NostrEvent | null;

				if (event) {
					isPartialData = false;
				} else {
					errorMessage = `Event not found ${nostrId}`;
				}
			} else {
				errorMessage = `Event not found ${nostrId}`;
			}
		} catch (err: any) {
			errorMessage = `Error: ${err.message} ${nostrId}`;
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		nostrId;
		untrack(() => {
			fetchData();
		});
	});
</script>

{#if event}
	<div
		class="relative {isPartialData ? 'opacity-90' : 'opacity-100'} transition-opacity duration-200"
	>
		{@render content?.(event, isPartialData)}
	</div>
{:else if errorMessage}
	{@render error?.(errorMessage)}
{:else if isLoading}
	{@render loading?.()}
{:else}
	<div class="text-surface-400 text-sm">データを読み込み中...</div>
{/if}
