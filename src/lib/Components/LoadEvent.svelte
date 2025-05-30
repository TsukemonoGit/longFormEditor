<!-- NostrReference.svelte -->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { nostrEventStore } from '../nostr-store.svelte';
	import { createKey } from '../nostr-fetch-utils';
	import type { Event as NostrEvent } from 'nostr-tools';

	interface Props {
		nostrId: string;
		loading?: Snippet;
		error?: Snippet<[string]>;
		content?: Snippet<[NostrEvent]>;
	}
	let { nostrId, loading, error, content }: Props = $props();
	let event: NostrEvent | null = $state(null);

	let errorMessage: string | null = $state(null);

	onMount(async () => {
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

			event = (await nostrEventStore.fetchEvent(key)) as NostrEvent | null;
		} catch (err: any) {
			errorMessage = `Error: ${err.message}`;
		}
	});
</script>

{#if event}
	{@render content?.(event)}
{:else if errorMessage}
	{@render error?.(errorMessage)}
{:else}
	{@render loading?.()}
{/if}
