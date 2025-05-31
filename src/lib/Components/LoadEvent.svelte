<!-- NostrReference.svelte -->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { nostrEventStore } from '../nostr-store.svelte';
	import { createKey } from '../nostr-fetch-utils';
	import type { Event as NostrEvent } from 'nostr-tools';

	interface Props {
		nostrId: string;
		loading?: Snippet;
		error?: Snippet<[string]>;
		content?: Snippet<[NostrEvent, boolean]>; // 第2引数でisPartialを渡す
		//showProgress?: boolean; // 進捗表示のオプション
	}

	let { nostrId, loading, error, content }: Props = $props();

	let event: NostrEvent | null = $state(null);
	let errorMessage: string | null = $state(null);
	let isLoading: boolean = $state(false);
	let isPartialData: boolean = $state(true);
	let updateCount: number = $state(0);

	onMount(async () => {
		try {
			if (!nostrId) {
				errorMessage = 'Nostr ID not available';
				return;
			}

			const key = createKey(nostrId);
			if (!key) {
				errorMessage = 'Invalid Nostr ID';
				return;
			}

			isLoading = true;
			updateCount = 0;
			isPartialData = true;

			// fetchEventWithProgressを使用して途中データも活用
			event = (await nostrEventStore.fetchEventWithProgress(key, (progress) => {
				if (progress.event) {
					console.log(
						`NostrReference途中データ取得 (${progress.partialCount}回目):`,
						progress.event.id
					);

					// 途中データでもイベントを更新
					event = progress.event;
					isPartialData = progress.isPartial;
					updateCount = progress.partialCount;

					// 途中データが取得された時点でローディング状態を解除
					if (progress.isPartial && isLoading) {
						isLoading = false;
					}
				}
			})) as NostrEvent | null;

			// 最終データの処理
			if (event) {
				isPartialData = false;
				console.log('NostrReference最終データ取得:', event.id);
			} else if (!event && updateCount === 0) {
				// 途中データも最終データも取得できなかった場合
				errorMessage = 'Event not found';
			}
		} catch (err: any) {
			errorMessage = `Error: ${err.message}`;
		} finally {
			isLoading = false;
		}
	});
</script>

{#if event}
	<!-- 進捗表示がオンの場合、データの状態を表示
	{#if showProgress && isPartialData}
		<div class="mb-1 flex items-center gap-1 text-xs text-yellow-600">
			<span class="animate-pulse">⚡</span>
			部分データ表示中 (更新{updateCount}回目)
		</div>
	{/if} -->
	<div
		class="relative {isPartialData ? 'opacity-90' : 'opacity-100'} transition-opacity duration-200"
	>
		{@render content?.(event, isPartialData)}
		<!-- 途中データの場合の視覚的インジケーター 
		{#if isPartialData && showProgress}
			<div
				class="absolute top-0 right-0 rounded-bl bg-yellow-400 px-1 text-xs text-black opacity-75"
			>
				{updateCount}
			</div>
		{/if}-->
	</div>
{:else if errorMessage}
	{@render error?.(errorMessage)}
{:else if isLoading}
	{@render loading?.()}
{:else}
	<!-- フォールバック: 何も表示するものがない場合 -->
	<div class="text-surface-400 text-sm">データを読み込み中...</div>
{/if}
