<script lang="ts">
	import * as Nostr from 'nostr-typedef';

	import { untrack } from 'svelte';
	import Link from '../Link.svelte';
	import UrlDisplay from './UrlDisplay.svelte';
	import CustomEmoji from './CustomEmoji.svelte';

	import {
		parseContent,
		TokenType,
		NIP19SubType,
		type Token
	} from '@konemono/nostr-content-parser';

	interface Props {
		event: Nostr.Event;
	}

	let { event }: Props = $props();

	let parts: Token[] = $state([]);
	//プレビューにも使ってるからconstだとだめ
	$effect(() => {
		if (event) {
			untrack(async () => {
				parts = parseContent(event.content, event.tags);
			});
		}
	});

	let geohash = $derived(event.tags.find((tag) => tag[0] === 'g' && tag.length > 1)?.[1]); // string | undefined
	let proxy = $derived(event.tags.find((item) => item[0] === 'proxy')); // string[] | undefined
</script>

{#each parts as part}
	{#if part.type === 'nip19'}
		<Link title="Link to Njump" href={`https://njump.me/${part.metadata!.plainNip19}`}
			>{part.content}</Link
		>
	{:else if part.type === 'url'}
		<UrlDisplay {part} />
	{:else if part.type === TokenType.CUSTOM_EMOJI}
		<CustomEmoji emoji={part} />
	{:else if part.type === 'hashtag'}
		<p class=" text-neutral-300 underline">#{part.content}</p>
	{:else}{part.content}{/if}
{/each}
