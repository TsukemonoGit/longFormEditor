<!-- EmojiPicker.svelte -->
<script lang="ts">
	interface Props {
		emojiList: string[][];
		onSelect: (shortcode: string) => void;
		onClose: () => void;
	}
	let { emojiList, onSelect, onClose }: Props = $props();

	let searchTerm = $state('');
	let filteredEmojis: string[][] = $state([]);

	// 検索フィルター処理
	$effect(() => {
		if (!searchTerm) {
			filteredEmojis = emojiList;
		} else {
			const term = searchTerm.toLowerCase();
			filteredEmojis = emojiList.filter((emoji) => emoji[0].toLowerCase().includes(term));
		}
	});

	// 初期化時に全ての絵文字を表示
	filteredEmojis = emojiList;

	// 絵文字選択処理
	function handleSelect(shortcode: string) {
		onSelect(shortcode);
	}
</script>

<div
	class="emoji-picker-container bg-surface-50-950 border-surface-500 rounded-md border shadow-xl"
>
	<div class="emoji-picker-header border-b-surface-200-800 border-b">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="絵文字を検索..."
			class="emoji-search-input border-surface-500 border"
		/>
		<button class="emoji-close-button" onclick={onClose}>✕</button>
	</div>

	<div class="emoji-list">
		{#if filteredEmojis.length === 0}
			<div class="no-results">絵文字が見つかりません</div>
		{:else}
			{#each filteredEmojis as [shortcode, url]}
				<button
					class="emoji-item hover:!bg-primary-500"
					onclick={() => handleSelect(shortcode)}
					title={shortcode}
				>
					<img src={url} alt={`:${shortcode}:`} loading="lazy" class="emoji-image" />
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.emoji-picker-container {
		width: 320px;
		max-height: 400px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.emoji-picker-header {
		display: flex;
		padding: 8px;
		align-items: center;
	}

	.emoji-search-input {
		flex: 1;

		border-radius: 4px;
		padding: 6px 8px;
		font-size: 14px;
		outline: none;
	}

	.emoji-search-input:focus {
		border-color: #4f98ff;
	}

	.emoji-close-button {
		background: none;
		border: none;
		font-size: 16px;
		cursor: pointer;
		color: #888;
		margin-left: 8px;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.emoji-close-button:hover {
		background: #f0f0f0;
	}

	.emoji-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.1em;
		padding: 10px;
		overflow-y: auto;
		max-height: 340px;
	}

	.emoji-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		border-radius: 4px;
		padding: 0.2em;
		cursor: pointer;
		border: none;
		background: transparent;
		transition: background-color 0.2s;
	}

	.emoji-image {
		width: 32px;
		height: 32px;
		object-fit: contain;
	}

	.no-results {
		padding: 20px;
		text-align: center;
		color: #888;
		grid-column: span 5;
	}
</style>
