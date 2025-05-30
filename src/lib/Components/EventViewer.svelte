<script lang="ts">
	import { nostrEventStore } from '$lib/nostr-store.svelte';
	import * as Nostr from 'nostr-typedef';
	import { untrack } from 'svelte';
	import EventLayout from './EventLayout.svelte';
	import { nip19 } from 'nostr-tools';
	import { Viewer } from 'bytemd';
	import { customEmojiPlugin } from '$lib/customemoji_plugin';
	import nip96ImageUpload from '$lib/nip96-image-upload-plugin';
	import { nostrPlugin } from '$lib/nostr-plugin';
	import { targetBlankPlugin } from '$lib/rehypeAddTargetBlank-plugin';
	import gfm from '@bytemd/plugin-gfm';
	import { datetime, formatAbsoluteDate } from '$lib/until';
	import Content from './Content.svelte';
	let { event, clickLink } = $props();

	// プラグインの設定
	let plugins = $derived([
		gfm(),

		nip96ImageUpload(),

		customEmojiPlugin(event.tags),
		nostrPlugin(), // Nostr対応プラグインを追加

		targetBlankPlugin()
	]);

	const getProfile = (event: Nostr.Event): Nostr.Content.Metadata | null => {
		try {
			return JSON.parse(event.content);
		} catch (e) {
			console.error('Error parsing event content:', e);
			return null;
		}
	};
	let kind0: Nostr.Event | null = $state(null);
	let kind0profile: Nostr.Content.Metadata | null = $state(null);
	$effect(() => {
		if (event) {
			untrack(async () => {
				kind0 = await nostrEventStore.fetchEvent(['p', event.pubkey]);
				if (kind0) {
					kind0profile = getProfile(kind0);
				}
			});
		}
	});
</script>

{#if event.kind === 0}
	{@const profile = getProfile(event)}
	{#if profile}
		<div class="nostr-profile text-primary-500 hover:text-primary-300 w-fit">
			@{profile.name || profile.display_name || 'noname'}{#if profile.picture}<img
					class="h-6 w-6 object-contain"
					src={profile.picture}
					alt={profile.name || profile.display_name || 'noname'}
				/>{/if}
		</div>
	{:else}
		{event.content}
	{/if}
{:else}
	<EventLayout {clickLink}>
		{#snippet icon()}
			{#if kind0profile?.picture}
				<img
					src={kind0profile?.picture}
					alt={kind0profile?.picture}
					class="h-8 w-8 rounded-full object-cover"
					style=" object-fit: cover; object-position: center;"
					loading="lazy"
				/>
			{/if}
		{/snippet}
		{#snippet name()}
			{#if !kind0profile}
				@{`${nip19.npubEncode(event.pubkey).slice(0, 10)}...`}
			{:else}
				@{kind0profile?.display_name || kind0profile?.name || ''}
			{/if}
			<span class=" text-surface-500 ml-1 text-sm whitespace-nowrap">
				{`kind:${event.kind}`}
			</span>
		{/snippet}
		{#snippet time()}
			<time datetime={datetime(event.created_at)}>{formatAbsoluteDate(event.created_at)}</time>
		{/snippet}
		{#snippet content()}
			{#if event.kind !== 30023 || event.kind !== 30024}
				<Content {event} />
			{:else}
				<Viewer value={event.content} {plugins} />{/if}
		{/snippet}
	</EventLayout>
{/if}

<style>
	.nostr-profile {
		text-decoration: underline;

		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}
</style>
