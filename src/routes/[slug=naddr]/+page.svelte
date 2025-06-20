<script lang="ts">
	import { onMount } from 'svelte';

	import * as Nostr from 'nostr-typedef';
	import { setRelays } from '$lib/setRelays';
	import { relayManager } from '$lib/rxNostr';
	import Bytemd from '$lib/Components/Bytemd.svelte';
	import Footer from '$lib/Components/Footer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let event: Nostr.Event | null = $state(null);

	onMount(async () => {
		await setRelays(data.pubkey);
		relayManager.articleSubscribe(
			['a', `${data.kind}:${data.pubkey}:${data.identifier}`],
			(ev: Nostr.Event) => (event = ev)
		);
	});
</script>

<main class="h-full flex-1 overflow-y-auto">
	<Bytemd bind:event />
	<Footer />
</main>
