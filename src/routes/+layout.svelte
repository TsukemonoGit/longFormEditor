<script lang="ts">
	import { onMount } from 'svelte';

	import '../app.css';

	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/Components/toaster-svelte';
	//@ts-ignore
	import { pwaInfo } from 'virtual:pwa-info';

	import '$lib/i18n/index.ts';
	import { page } from '$app/state';
	import { loginUser } from '$lib/store.svelte';
	let { children } = $props();

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		document.addEventListener('nlAuth', (e: Event) => {
			const customEvent = e as CustomEvent;
			loginUser.set(customEvent.detail.pubkey || '');
			console.log(customEvent);
		});
		const initNostrLogin = await import('nostr-login');
		await initNostrLogin.init({
			/*options*/
		});
	});
</script>

<svelte:head>
	{@html webManifestLink}

	<meta property="og:image" content={`${page.url.origin}/favicon2.png`} />
</svelte:head>

{@render children()}
<Toaster {toaster}></Toaster>
