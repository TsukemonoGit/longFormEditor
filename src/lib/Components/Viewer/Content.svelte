<script lang="ts">
	import { parseText, type Part } from '$lib/content';
	import { nip19 } from 'nostr-tools';
	import * as Nostr from 'nostr-typedef';

	import { untrack } from 'svelte';
	import Link from '../Link.svelte';
	import UrlDisplay from './UrlDisplay.svelte';
	import CustomEmoji from './CustomEmoji.svelte';

	interface Props {
		event: Nostr.Event;
	}

	let { event }: Props = $props();

	let parts: Part[] = $state([]);
	//プレビューにも使ってるからconstだとだめ
	$effect(() => {
		if (event) {
			untrack(async () => {
				parts = await parseText(event.content, event.tags);
			});
		}
	});

	const nip19Decode = (
		content: string | undefined
	):
		| { type: 'naddr'; data: nip19.AddressPointer }
		| { type: 'nevent'; data: nip19.EventPointer }
		| { type: 'nprofile'; data: nip19.ProfilePointer }
		| { type: 'nsec'; data: Uint8Array }
		| { type: 'npub' | 'note'; data: string }
		| undefined => {
		if (content === undefined) {
			return undefined;
		}
		// console.log(content);
		try {
			const decoded = nip19.decode(content);
			if (decoded.type === 'naddr') {
				return {
					type: decoded.type,
					data: decoded.data as nip19.AddressPointer
				};
			} else if (decoded.type === 'nevent') {
				return { type: decoded.type, data: decoded.data as nip19.EventPointer };
			} else if (decoded.type === 'nprofile') {
				return {
					type: decoded.type,
					data: decoded.data as nip19.ProfilePointer
				};
			} else if (decoded.type === 'nsec') {
				return { type: decoded.type, data: decoded.data as Uint8Array };
			} else {
				return { type: decoded.type, data: decoded.data as string };
			}
		} catch (error) {
			return undefined;
		}
	};
	let geohash = $derived(event.tags.find((tag) => tag[0] === 'g' && tag.length > 1)?.[1]); // string | undefined
	let proxy = $derived(event.tags.find((item) => item[0] === 'proxy')); // string[] | undefined
</script>

{#each parts as part}{#if part.type === 'nip19'}{@const decoded = nip19Decode(part.url)}
		{#if decoded}
			<Link title="Link to Njump" href={`https://njump.me/${part.url}`}>{part.content}</Link
			>{:else}{part.content}{/if}
	{:else if part.type === 'url'}
		<UrlDisplay {part} />
	{:else if part.type === 'emoji'}
		<CustomEmoji {part} />
	{:else if part.type === 'hashtag'}
		<p class="break-all text-neutral-300 underline">#{part.content}</p>
	{:else}{part.content}{/if}{/each}
