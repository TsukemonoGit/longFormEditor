<script lang="ts">
	import { nostrEventStore } from '$lib/nostr-store.svelte';
	import * as Nostr from 'nostr-typedef';
	import { untrack } from 'svelte';
	import EventLayout from './EventLayout.svelte';
	import { nip19 } from 'nostr-tools';
	import { Viewer } from 'bytemd';
	import { customEmojiPlugin } from '$lib/plugin/customemoji_plugin';
	import nip96ImageUpload from '$lib/plugin/nip96-image-upload-plugin';
	import { nostrPlugin } from '$lib/plugin/nostr-plugin';
	import { targetBlankPlugin } from '$lib/plugin/rehypeAddTargetBlank-plugin';
	import gfm from '@bytemd/plugin-gfm';
	import { datetime, formatAbsoluteDate } from '$lib/until';
	import Content from './Viewer/Content.svelte';
	import Link from './Link.svelte';

	let { event, link } = $props();

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
	let isLoadingProfile = $state(false);
	let profileProgress = $state({ isPartial: true, updateCount: 0 });

	$effect(() => {
		if (event) {
			untrack(async () => {
				isLoadingProfile = true;
				profileProgress = { isPartial: true, updateCount: 0 };

				try {
					// fetchEventWithProgressを使用して途中データも活用
					kind0 = await nostrEventStore.fetchEventWithProgress(['p', event.pubkey], (progress) => {
						// 途中データを受信した時点でUIを更新
						if (progress.event && progress.isPartial) {
							console.log(
								`プロフィール途中データ取得 (${progress.partialCount}回目):`,
								progress.event.id
							);

							// 途中データでもプロフィールを更新
							kind0 = progress.event;
							const tempProfile = getProfile(progress.event);
							if (tempProfile) {
								kind0profile = tempProfile;
								profileProgress = {
									isPartial: true,
									updateCount: progress.partialCount
								};
							}
						} else if (progress.event && !progress.isPartial) {
							// 最終データ
							console.log('プロフィール最終データ取得:', progress.event.id);
							kind0 = progress.event;
							const finalProfile = getProfile(progress.event);
							if (finalProfile) {
								kind0profile = finalProfile;
								profileProgress = {
									isPartial: false,
									updateCount: progress.partialCount
								};
							}
						}
					});

					// プロミスが解決された時点での最新データを確保
					if (kind0) {
						const latestProfile = getProfile(kind0);
						if (latestProfile) {
							kind0profile = latestProfile;
							profileProgress = { isPartial: false, updateCount: profileProgress.updateCount };
						}
					}
				} catch (error) {
					console.error('プロフィール取得エラー:', error);
				} finally {
					isLoadingProfile = false;
				}
			});
		}
	});
</script>

{#if event.kind === 0}
	<Link
		href={`https://njump.me/${nip19.npubEncode(event.pubkey)}`}
		title={`https://njump.me/${nip19.npubEncode(event.pubkey)}`}
		class="text-primary-500 hover:text-primary-300 inline w-fit break-all underline"
	>
		{@const profile = getProfile(event)}
		{#if profile}
			@{profile.name || profile.display_name || 'noname'}{#if profile.picture}<img
					class="inline h-6 w-6 object-contain"
					src={profile.picture}
					alt={profile.name || profile.display_name || 'noname'}
				/>{/if}
		{:else}
			{event.content}
		{/if}
	</Link>
{:else}
	<EventLayout {link}>
		{#snippet icon()}
			{#if kind0profile?.picture}
				<img
					src={kind0profile?.picture}
					alt={kind0profile?.picture}
					class="h-8 w-8 rounded-full object-cover {profileProgress.isPartial
						? 'opacity-80'
						: 'opacity-100'}"
					style="object-fit: cover; object-position: center;"
					loading="lazy"
				/>
				<!-- デバッグ用: 途中データ表示インジケーター 
				{#if profileProgress.isPartial && profileProgress.updateCount > 0}
					<div
						class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-xs text-black"
					>
						{profileProgress.updateCount}
					</div>
				{/if}-->
				<!--	{:else if isLoadingProfile}
			 ローディング中のプレースホルダー
				<div class="bg-surface-300 h-8 w-8 animate-pulse rounded-full"></div> -->
			{/if}
		{/snippet}
		{#snippet name()}
			{#if !kind0profile}
				{#if isLoadingProfile}
					<span class="bg-surface-300 animate-pulse rounded px-2 py-1"> 読み込み中... </span>
				{:else}
					@{`${nip19.npubEncode(event.pubkey).slice(0, 10)}...`}
				{/if}
			{:else}
				<span class={profileProgress.isPartial ? 'opacity-80' : 'opacity-100'}>
					@{kind0profile?.display_name || kind0profile?.name || ''}
				</span>
				<!-- 途中データであることを示すインジケーター
				{#if profileProgress.isPartial}
					<span class="ml-1 text-xs text-yellow-500" title="途中データ">⚡</span>
				{/if} -->
			{/if}
			<span class="text-surface-500 ml-1 text-sm whitespace-nowrap">
				{`kind:${event.kind}`}
			</span>
		{/snippet}
		{#snippet time()}
			<time datetime={datetime(event.created_at)}>{formatAbsoluteDate(event.created_at)}</time>
		{/snippet}
		{#snippet content()}
			{#if event.kind === 30023 || event.kind === 30024}
				<Viewer value={event.content} {plugins} />
			{:else}
				<Content {event} />
			{/if}
		{/snippet}
	</EventLayout>
{/if}
