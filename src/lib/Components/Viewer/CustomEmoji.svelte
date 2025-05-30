<script lang="ts">
	import type { Part } from '$lib/content';

	import { t as _ } from '@konemono/svelte5-i18n';

	interface Props {
		part: Part;
		height?: number;
	}

	let { part, height = 24 }: Props = $props();
	let imgError: boolean = $state(false);
	let imgLoad: boolean = $state(false);
</script>

{#if !imgError}{#if !imgLoad}:{part.content}:{/if}<img
		height={`${height}px`}
		loading="lazy"
		alt={`:${part.content}:`}
		src={part.url}
		title={`:${part.content}:`}
		class={`m-0 inline overflow-hidden object-contain align-bottom`}
		style={`height:${height}px`}
		onload={() => {
			imgLoad = true;
		}}
		onerror={() => {
			imgError = true;
		}}
	/>{:else}:{part.content}:{/if}
