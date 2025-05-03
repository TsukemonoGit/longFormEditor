<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();
	onMount(async () => {
		const initNostrLogin = await import('nostr-login');
		initNostrLogin.init({
			/*options*/
		});
	});
</script>

{@render children()}
