<script lang="ts">
	import { Editor, Viewer } from 'bytemd';
	import gfm from '@bytemd/plugin-gfm';
	import 'bytemd/dist/index.css';

	import { onMount } from 'svelte';
	import { nostrPlugin } from '$lib/nostr-plugin';
	import { type Event as NostrEvent } from 'nostr-tools';

	interface Props {
		event?: NostrEvent;
	}
	let { event }: Props = $props();
	// svelte-ignore non_reactive_update
	let value = $state(
		'# Nostr NIP-23エディタ\n\nこれはNostr対応のマークダウンエディタです。\n\n## 使い方\n\n1. マークダウンを通常通り編集できます\n2. Nostrノートを参照するには `nostr:note1...` 形式で記述します\n3. ツールバーの「Insert Nostr Note Reference」ボタンを使用してノート参照を挿入することもできます\n\n## 例\n\n以下のようにNostrノートを参照できます：\n\nnostr:note1sr7rrv0zvgks4mv9t3gmxzsd8a3fsru0ngulc3dda7un0sdphh5qm2e5a9\nnostr:npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw\n\n###### h6\n\n**太字**\n\n*斜字*\n> quote\n\n[link](https://lumilumi.app)\n\n`code`\n\n```js\nconsole.log(\"code block\"\n```\n\n- list1\n- list2\n\n1. num1\n2. num2\n\n~~取り消し~~\n- [ ] check\n- [x] check\n\n\n| Heading | table |\n| --- | --- |\n| 1 | 2|\n'
	);
	let title = $state('');
	let image = $state('');
	let summary = $state('');
	let isPublishing = $state(false);
	let published_at = ''; //最初に公開した時間
	let publishError = $state('');
	let publishSuccess = $state('');
	let pubkey = '';
	$effect(() => {
		if (event) {
			setProperties(event);
		}
	});
	function setProperties(ev: NostrEvent) {
		title = ev.tags.find((tag) => tag[0] === 'title')?.[1] || '';
		image = ev.tags.find((tag) => tag[0] === 'image')?.[1] || '';
		summary = ev.tags.find((tag) => tag[0] === 'summary')?.[1] || '';
		published_at = ev.tags.find((tag) => tag[0] === 'published_at')?.[1] || '';
	}
	// デフォルトのリレーURL一覧
	const defaultRelays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'];

	// プラグインの設定
	const plugins = [
		gfm(),
		nostrPlugin() // Nostr対応プラグインを追加
		// 必要に応じて他のプラグインを追加
	];

	// エディタの変更イベントハンドラ
	function handleChange(e: any) {
		value = e.detail.value;
		// 成功/エラーメッセージをクリア
		publishSuccess = '';
		publishError = '';
	}

	onMount(() => {
		// Nostrノートクリックイベントのリスナーを追加
		document.addEventListener('nostr-note-click', handleNostrNoteClick as EventListener);

		// 非同期処理を別途実行
		(async () => {
			try {
				if (window.nostr) {
					pubkey = await window.nostr.getPublicKey();
					console.log('Nostr公開鍵を取得:', pubkey);
				}
			} catch (e) {
				console.error('Nostr公開鍵の取得に失敗:', e);
			}
		})();

		return () => {
			// クリーンアップ
			document.removeEventListener('nostr-note-click', handleNostrNoteClick as EventListener);
		};
	});

	// Nostrノートクリックのハンドラ
	function handleNostrNoteClick(e: CustomEvent) {
		const { noteId } = e.detail;
		console.log('Nostr note clicked:', noteId);

		// ここでモーダルを表示したり、コンテンツを取得したりする
		alert(
			`Nostrノート ${noteId} の内容を表示します。\n実際の実装ではリレーからデータを取得してモーダルで表示します。`
		);
	}

	// NIP-23の長文投稿として保存する関数
	async function saveAsNostrNote() {
		if (!value || value.trim() === '') {
			publishError = 'コンテンツが空です';
			return;
		}

		if (!title || title.trim() === '') {
			publishError = '記事タイトルを入力してください';
			return;
		}

		// 処理中フラグを設定
		isPublishing = true;
		publishError = '';
		publishSuccess = '';

		try {
			// 公開鍵をチェック
			if (!pubkey && window.nostr) {
				pubkey = await window.nostr.getPublicKey();
			}

			if (!pubkey) {
				throw new Error('Nostr拡張が見つからないか、公開鍵を取得できませんでした');
			}

			// 実際の環境では以下のコードを使用
			// const eventId = await publishArticle(value, title, pubkey, defaultRelays);
			// publishSuccess = `記事が公開されました！イベントID: ${eventId}`;

			// デモ用のモック
			await new Promise((resolve) => setTimeout(resolve, 1000)); // 公開処理をシミュレート
			publishSuccess = 'NIP-23記事として公開されました！（デモ - 実際には公開されていません）';
		} catch (e: any) {
			publishError = `エラー: ${e.message}`;
		} finally {
			isPublishing = false;
		}
	}
</script>

<div class="nostr-markdown-editor">
	<h2>Nostr NIP-23 マークダウンエディタ</h2>

	<div class="title-input">
		<label for="article-title">記事タイトル:</label>
		<input id="article-title" type="text" bind:value={title} placeholder="記事のタイトルを入力" />
	</div>
	<div class="summary-input">
		<label for="article-summary">記事概要:</label>
		<input id="article-summary" type="text" bind:value={summary} placeholder="記事の概要を入力" />
	</div>
	<div class="image-input">
		<label for="article-image">記事画像:</label>
		<input id="article-image" type="text" bind:value={image} placeholder="記事の画像URLを入力" />
	</div>
	<!-- svelte-ignore a11y_img_redundant_alt -->
	<img class="image-preview" src={image} alt="article image" />
	<div class="editor-container">
		<Editor {value} {plugins} on:change={handleChange} />
	</div>

	<div class="actions">
		<button
			onclick={saveAsNostrNote}
			disabled={isPublishing}
			class={isPublishing ? 'disabled' : ''}
		>
			{isPublishing ? '公開中...' : 'Nostrに投稿(NIP-23)'}
		</button>
	</div>

	{#if publishError}
		<div class="error-message">
			{publishError}
		</div>
	{/if}

	{#if publishSuccess}
		<div class="success-message">
			{publishSuccess}
		</div>
	{/if}

	<div class="break-all">
		{JSON.stringify(value)}
	</div>
</div>

<style>
	.nostr-markdown-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 100%;
	}

	.editor-container {
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.actions {
		margin-top: 1rem;
	}

	button {
		background-color: #5c67f5;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	button:hover {
		background-color: #4549aa;
	}

	button.disabled {
		background-color: #a0a0a0;
		cursor: not-allowed;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.error-message {
		background-color: #ffdddd;
		color: #cc0000;
		padding: 0.5rem;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.success-message {
		background-color: #ddffdd;
		color: #007700;
		padding: 0.5rem;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.image-preview {
		width: 6em;
		height: 6em;
		object-fit: contain;
		margin-left: auto;
	}
</style>
