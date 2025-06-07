import { relayManager } from '$lib/rxNostr';
import { nostrEventStore } from './nostr-store.svelte';

export async function setRelays(pubkey: string) {
	const event = await nostrEventStore.fetchEvent(['a', `10002:${pubkey}:`]);
	console.log(event);
	if (!event) {
		return;
	}
	relayManager.setRelays(pubkey, event.tags);
}
