<script lang="ts">
	import type { UrlType } from '$lib/urlTypeDetector';

	import type { Snippet } from 'svelte';
	import { useUrlType } from './userUrl.svelte';

	interface Props {
		url: string;
		content?: Snippet<[UrlType, () => void]>;
		loading?: Snippet;
	}

	let { url, content, loading }: Props = $props();
	let urlTypeResult = $derived(useUrlType(url));
</script>

{#if urlTypeResult.loading}
	{@render loading?.()}
{:else if urlTypeResult.type}
	{@render content?.(urlTypeResult.type, urlTypeResult.refresh)}
{/if}
