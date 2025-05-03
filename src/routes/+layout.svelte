<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import * as Nostr from 'nostr-typedef';
	import { nostrEventStore } from '$lib/nostr-store.svelte';
	let { children } = $props();
	onMount(async () => {
		const initNostrLogin = await import('nostr-login');
		initNostrLogin.init({
			/*options*/
		});
		const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
		console.log(pubkey);
		const event = await nostrEventStore.fetchEvent(['a', `10002:${pubkey}:`]);
		console.log(event);
	});
</script>

{@render children()}
