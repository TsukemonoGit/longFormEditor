<script lang="ts">
	import 'bytemd/dist/index.css'; // Bytemdのスタイル

	import { Editor } from 'bytemd';
	import gfm from '@bytemd/plugin-gfm';
	import 'codemirror/theme/eclipse.css';
	import 'codemirror/theme/material.css';
	import { nostrPlugin } from '$lib/nostr-plugin';
	import { type Event as NostrEvent } from 'nostr-tools';
	import * as Nostr from 'nostr-typedef';
	import { customEmojiPlugin } from '$lib/customemoji_plugin';
	import { processNostrReferences, processEmojis, processHashtags, processLinks } from '$lib/until';
	import { relayManager } from '$lib/rxNostr';
	import nip96ImageUpload from '$lib/nip96-image-upload-plugin';
	import { isDark, translations } from '$lib/store.svelte';
	import { toaster } from './toaster-svelte';
	import { naddrEncode } from 'nostr-tools/nip19';
	import { ExternalLink } from 'lucide-svelte';
	import { targetBlankPlugin } from '$lib/rehypeAddTargetBlank-plugin';

	interface Props {
		event: Nostr.Event | null;
	}
	let { event }: Props = $props();
	// svelte-ignore non_reactive_update
	let value = $state('');
	let title = $state('');
	let image = $state('');
	let summary = $state('');
	let isPublishing = $state(false);
	let published_at = $state(''); //最初に公開した時間
	//let publishError = $state('');
	//let publishSuccess = $state('');
	let pubkey = '';
	let identifier = $state('');

	$effect(() => {
		if (event || !event) {
			setProperties(event);
		}
	});
	function setProperties(ev: NostrEvent | null) {
		title = ev?.tags.find((tag) => tag[0] === 'title')?.[1] || '';
		image = ev?.tags.find((tag) => tag[0] === 'image')?.[1] || '';
		summary = ev?.tags.find((tag) => tag[0] === 'summary')?.[1] || '';
		published_at = ev?.tags.find((tag) => tag[0] === 'published_at')?.[1] || '';
		value = ev?.content || '';
		identifier = ev?.tags.find((tag) => tag[0] === 'd')?.[1] || Date.now().toString();
	}

	// プラグインの設定
	const plugins = [
		gfm(),

		nip96ImageUpload(),

		customEmojiPlugin(),
		nostrPlugin(), // Nostr対応プラグインを追加

		targetBlankPlugin()
	];

	// エディタの変更イベントハンドラ
	function handleChange(e: any) {
		value = e.detail.value;
		// 成功/エラーメッセージをクリア
	}

	// NIP-23の長文投稿として保存する関数
	async function saveAsNostrNote() {
		if (!value || value.trim() === '') {
			toaster.error({
				title: 'コンテンツが空です'
			});
			//publishError = 'コンテンツが空です';
			return;
		}

		if (!identifier || identifier.trim() === '') {
			toaster.error({
				title: 'identifierを入力してください'
			});
			//publishError = 'identifierを入力してください';
			return;
		}

		// 処理中フラグを設定
		isPublishing = true;

		try {
			// 公開鍵をチェック
			if (!pubkey && window.nostr) {
				pubkey = await window.nostr.getPublicKey();
			}

			if (!pubkey) {
				throw new Error('Nostr拡張が見つからないか、公開鍵を取得できませんでした');
			}

			const articleTags = [
				['d', identifier],
				['title', title],
				['summary', summary],
				['image', image],
				['published_at', published_at || Math.floor(Date.now() / 1000).toString()]
			];
			const nostrTags = processNostrReferences(value);
			const emojiTags = processEmojis(value);
			const hashtagTags = processHashtags(value);
			const linkTags = processLinks(value);
			const tags = [...articleTags, ...nostrTags, ...emojiTags, ...hashtagTags, ...linkTags];
			const eventParam: Nostr.EventParameters = { content: value, tags: tags, kind: 30023 };
			console.log(eventParam);
			// 実際の環境では以下のコードを使用
			const res = await relayManager.publishEvent(eventParam);

			// 成功・失敗したリレーの情報を使ってメッセージを作成
			if (res.successRelays.length > 0 && res.event) {
				event = res.event;
				let successMessage = `${$translations.publish_success}\n`;

				// 成功リレー
				const successRelays =
					res.successRelays.length <= 3
						? res.successRelays.join(', ')
						: `${res.successRelays.slice(0, 3).join(', ')} ...+${res.successRelays.length - 3}`;

				successMessage +=
					'\n' +
					$translations.publish_success_relays
						.replace('{count}', String(res.successRelays.length))
						.replace('{relays}', successRelays);

				// 失敗リレー
				if (res.failedRelays.length > 0) {
					const failedRelays =
						res.failedRelays.length <= 3
							? res.failedRelays.join(', ')
							: `${res.failedRelays.slice(0, 3).join(', ')} ...+${res.failedRelays.length - 3}`;

					successMessage +=
						'\n' +
						$translations.publish_failure_relays
							.replace('{count}', String(res.failedRelays.length))
							.replace('{relays}', failedRelays);
				}

				toaster.success({ title: successMessage, duration: 10000 });
			} else {
				let publishError = $translations.publish_error;

				if (res.failedRelays.length > 0) {
					publishError +=
						'\n' +
						$translations.publish_failure_relays
							.replace('{count}', String(res.failedRelays.length))
							.replace('{relays}', res.failedRelays.join(', '));
				}
				if (res.error) {
					publishError +=
						'\n' + $translations.publish_error_detail.replace('{error}', String(res.error));
				}

				toaster.error({ title: publishError });
			}
		} catch (e: any) {
			//publishError = `エラー: ${e.message}`;
			toaster.error({
				title: `${$translations.error}: ${e.message}`
			});
		} finally {
			isPublishing = false;
		}
	}

	let naddr: string | undefined = $derived(
		event ? naddrEncode({ identifier: identifier, kind: 30023, pubkey: event.pubkey }) : undefined
	);
	const jumptoNjump = () => {
		if (naddr) {
			window.open(`https://njump.me/${naddr}`);
		}
	};
	const jumptoLumilumi = () => {
		if (naddr) {
			window.open(`https://lumilumi.app/${naddr}`);
		}
	};
</script>

<div class="nostr-markdown-editor">
	<h2>
		Nostr <a href="https://github.com/nostr-protocol/nips/blob/master/23.md">NIP-23</a> Long-Form
		Content Editor<a
			aria-label="github"
			class="github"
			href="https://github.com/TsukemonoGit/longFormEditer"
			target="_blank"
			rel="noopener noreferrer"
		>
			<svg viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
				<path
					fill="currentcolor"
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
				/>
			</svg>
		</a>
	</h2>

	<div class="identifier-input">
		<label for="article-identifier">Identifier:</label>
		<div id="article-identifier" class="text-surface-900-100/50">
			{identifier}
		</div>
	</div>
	<div class="title-input">
		<label for="article-title">{$translations.article_title}:</label>
		<input
			id="article-title"
			type="text"
			bind:value={title}
			placeholder={$translations.article_title_placeholder}
		/>
	</div>
	<div class="summary-input">
		<label for="article-summary">{$translations.article_summary}:</label>
		<input
			id="article-summary"
			type="text"
			bind:value={summary}
			placeholder={$translations.article_summary_placeholder}
		/>
	</div>
	<div class="image-input">
		<label for="article-image">{$translations.article_image}:</label>
		<input
			id="article-image"
			type="text"
			bind:value={image}
			placeholder={$translations.article_image_placeholder}
		/>
	</div>
	<!-- svelte-ignore a11y_img_redundant_alt -->
	<img class="image-preview" src={image} alt="article image" />
	<div class="editor-container">
		{#if isDark.get()}
			<!-- {#await import('codemirror/theme/material.css') then} -->
			<Editor
				editorConfig={{
					theme: 'material'
				}}
				{value}
				{plugins}
				on:change={handleChange}
				mode="split"
			/>
			<!-- 	{/await} -->
		{:else}
			<!-- {#await import('codemirror/theme/eclipse.css') then} -->
			<Editor
				editorConfig={{
					theme: 'eclipse'
				}}
				{value}
				{plugins}
				on:change={handleChange}
				mode="split"
			/>
			<!-- 	{/await} -->
		{/if}<!--常に横に二つに分かれて編集画面|プレビューだけど、PreviewOnly　WriteOnlyのボタンがあるからOK-->
	</div>
	<!-- <div class="preview-container block sm:hidden">
		<b>preview</b>
		<Viewer {value} {plugins} />
	</div> -->
	{#if published_at}
		<div class="text-right">
			first published: {new Date(Number(published_at) * 1000).toLocaleString()}
		</div>
	{/if}
	<div class="actions">
		<button
			onclick={saveAsNostrNote}
			disabled={isPublishing}
			type="button"
			class="btn preset-filled-primary-500"
		>
			{isPublishing ? $translations.isPublishing_await : $translations.isPublishing_button}
		</button>
		{#if event}
			<button type="button" class="btn preset-outlined-primary-500" onclick={jumptoNjump}>
				Open in njump<ExternalLink size={16} />
			</button>
			<button type="button" class="btn preset-outlined-primary-500" onclick={jumptoLumilumi}>
				Open in Lumilumi<ExternalLink size={16} />
			</button>
		{/if}
	</div>
</div>

<style>
	.nostr-markdown-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 100%;
		overflow: hidden;
	}

	.editor-container {
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
	}

	/* button {
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
	} */

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

	/*.error-message {
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
 */
	.image-preview {
		border-radius: 0.5em;
		border: 1px solid #5c67f5;
		width: 6em;
		height: 6em;
		object-fit: contain;
		margin-left: auto;
	}
	/* .preview-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 1rem;
		margin-top: 1rem;
	} */

	.github {
		display: inline-flex;
		margin-left: 0.5em;
		width: 24px;
		height: 24px;
	}
</style>
