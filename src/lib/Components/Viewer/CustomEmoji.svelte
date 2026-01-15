<script lang="ts">
	import type { Token } from '@konemono/nostr-content-parser';

	import { t as _ } from '@konemono/svelte5-i18n';

	interface Props {
		emoji: Token;
		height?: number;
	}

	let { emoji, height = 24 }: Props = $props();
	let imgError: boolean = $state(false);
	let imgLoad: boolean = $state(false);
</script>

{#if !imgError}{#if !imgLoad}:{emoji.metadata!.name}:{/if}<img
		height={`${height}px`}
		loading="lazy"
		alt={`:${emoji.metadata!.name}:`}
		src={emoji.metadata!.url as string}
		title={`:${emoji.metadata!.name}:`}
		class={`m-0 inline overflow-hidden object-contain align-bottom`}
		style={`height:${height}px`}
		onload={() => {
			imgLoad = true;
		}}
		onerror={() => {
			imgError = true;
		}}
	/>{:else}:{emoji.metadata!.name}:{/if}
