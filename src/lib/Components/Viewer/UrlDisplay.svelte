<script lang="ts">
	import type { Part } from '$lib/content';
	import Link from '../Link.svelte';
	import UrlType from './UrlType.svelte';

	interface Props {
		part: Part;
	}
	let { part }: Props = $props();
</script>

{#if part.url}
	<UrlType url={part.url}>
		{#snippet loading()}
			<Link class="text-magnum-300 break-all underline hover:opacity-80" href={part.content ?? ''}
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
					src={part.url}
					class=" max-h-[18rem] max-w-[min(18rem,100%)] overflow-hidden object-contain"
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
				{part.url}
			{:else if type === 'url'}
				<Link class="text-magnum-300 break-all underline hover:opacity-80" href={part.content ?? ''}
					>{part.content}</Link
				>
			{:else}
				<span class="break-words whitespace-pre-wrap" style="word-break: break-word;"
					>{part.content}</span
				>
			{/if}
		{/snippet}
	</UrlType>
{/if}
