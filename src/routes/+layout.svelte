<script lang="ts">
	import { onMount } from 'svelte';

	import '../app.css';

	import * as Nostr from 'nostr-typedef';
	import { nostrEventStore } from '$lib/nostr-store.svelte';
	import { relayManager } from '$lib/rxNostr';
	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/Components/toaster-svelte';
	//@ts-ignore
	import { pwaInfo } from 'virtual:pwa-info';

	import '$lib/i18n/index.ts';
	import { page } from '$app/state';
	let { children } = $props();

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		const initNostrLogin = await import('nostr-login');
		await initNostrLogin.init({
			/*options*/
		});
		const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
		console.log(pubkey);
		const event = await nostrEventStore.fetchEvent(['a', `10002:${pubkey}:`]);
		console.log(event);
		if (!event) {
			return;
		}
		relayManager.setRelays(pubkey, event.tags);
		/* const ev = await nostrEventStore.fetchEvents(['a', `30023:${pubkey}:`]);
		console.log(ev);
		if (ev) {
			articles.set(ev);
		} */
	});
</script>

<svelte:head>
	{@html webManifestLink}

	<meta property="og:image" content={`${page.url.origin}/favicon2.png`} />
</svelte:head>

{@render children()}
<Toaster {toaster}></Toaster>
