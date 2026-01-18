<script lang="ts">
	import type { Token } from '@konemono/nostr-content-parser';
	import Link from '../Link.svelte';
	import UrlType from './UrlType.svelte';

	interface Props {
		part: Token;
	}
	let { part }: Props = $props();
</script>

<UrlType url={part.content}>
	{#snippet loading()}
		<Link class="text-magnum-300 underline hover:opacity-80" href={part.content ?? ''}
			>{part.content}</Link
		>
	{/snippet}
	{#snippet content(type)}
		{#if type === 'image'}
			<img
				loading="lazy"
				width="288"
				height="200"
				alt="img"
				src={part.content}
				class=" max-h-72 max-w-[min(18rem,100%)] overflow-hidden object-contain"
			/>
		{:else if type === 'movie'}
			<video
				aria-label="video contents"
				controls
				src={part.content}
				class=" max-h-80 max-w-[min(20rem,100%)] object-contain"
				><track default kind="captions" /></video
			>
		{:else if type === 'audio'}
			<audio
				aria-label="audio contents"
				controls
				src={part.content}
				class=" max-h-80 max-w-[min(20rem,100%)] object-contain"
				><track default kind="captions" /></audio
			>
		{:else if type === '3D'}
			{part.content}
		{:else if type === 'url'}
			<Link class="text-magnum-300 underline hover:opacity-80" href={part.content ?? ''}
				>{part.content}</Link
			>
		{:else}
			{part.content}
		{/if}
	{/snippet}
</UrlType>
