// customEmoji-plugin.ts
import type { BytemdPlugin } from 'bytemd';

// 絵文字選択用のポップアップコンポーネント
import EmojiPicker from './Components/EmojiPicker.svelte';
import { mount } from 'svelte';
import { emojiList } from './store.svelte';

const emojiRegex = /(:[^:\s]+:)/g;

// カスタム絵文字プラグイン
export function customEmojiPlugin(): BytemdPlugin {
	return {
		// Extend markdown parser
		remark: (processor) => {
			return processor.use(() => (tree: any) => {
				visit(tree, 'text', (node, index, parent) => {
					if (!parent || typeof index !== 'number') return;
					const regex = emojiRegex;
					let match;
					const matches = [];

					// Find all emoji shortcodes in text
					while ((match = regex.exec(node.value)) !== null) {
						matches.push({
							start: match.index,
							end: match.index + match[0].length,
							shortcode: match[1]
						});
					}

					if (matches.length === 0) return;

					// Transform matched emoji shortcodes
					const children = [];
					let lastIndex = 0;

					for (const match of matches) {
						// Text before emoji
						if (match.start > lastIndex) {
							children.push({
								type: 'text',
								value: node.value.slice(lastIndex, match.start)
							});
						}

						// Find emoji URL from shortcode
						const emoji = emojiList
							.get()
							.find((e) => `:${e[0]}:` === match.shortcode || e[0] === match.shortcode);

						if (emoji) {
							// Transform emoji to image node
							children.push({
								type: 'image',
								url: emoji[1],
								alt: match.shortcode,
								title: match.shortcode,
								data: {
									hProperties: {
										className: 'custom-emoji'
									}
								}
							});
						} else {
							// Keep as text if emoji not found
							children.push({
								type: 'text',
								value: match.shortcode
							});
						}

						lastIndex = match.end;
					}

					// Remaining text
					if (lastIndex < node.value.length) {
						children.push({
							type: 'text',
							value: node.value.slice(lastIndex)
						});
					}

					// Replace the single text node with multiple nodes
					parent.children.splice(index, 1, ...children);
				});
			});
		},

		// Editor extensions (toolbar button for emoji insertion)
		actions: [
			{
				title: 'Insert Custom Emoji',
				icon: '😀',
				handler: {
					type: 'action',
					click({ editor, appendBlock, codemirror }) {
						// 絵文字ピッカーを表示する位置を取得
						const cursor = editor.getCursor();
						const cursorCoords = editor.cursorCoords(cursor);

						// ダイアログ用のコンテナを作成
						const container = document.createElement('div');
						container.style.position = 'absolute';
						container.style.zIndex = '1000';
						container.style.left = `${cursorCoords.left}px`;
						container.style.top = `${cursorCoords.bottom + 5}px`;
						document.body.appendChild(container);

						// 絵文字が選択されたときのコールバック
						const onEmojiSelect = (shortcode: string) => {
							// エディタにショートコードを挿入
							editor.replaceSelection(`:${shortcode}:`);
							// 絵文字ピッカーを閉じる
							document.body.removeChild(container);
						};

						// 閉じるときのコールバック
						const onClose = () => {
							if (document.body.contains(container)) {
								document.body.removeChild(container);
							}
						};

						// Svelteコンポーネントをマウント
						mount(EmojiPicker, {
							target: container,
							props: {
								emojiList: emojiList.get(),
								onSelect: onEmojiSelect,
								onClose: onClose
							}
						});

						// 外部クリックでピッカーを閉じる
						const handleOutsideClick = (e: MouseEvent) => {
							if (!container.contains(e.target as Node)) {
								onClose();
								document.removeEventListener('click', handleOutsideClick);
							}
						};

						// 少し遅延させて外部クリックのリスナーを追加（即時追加するとピッカー自体のクリックでも閉じてしまう）
						setTimeout(() => {
							document.addEventListener('click', handleOutsideClick);
						}, 100);
					}
				}
			}
		]
	};
}
// 修正済みvisit関数（indexとparentを渡す）
function visit(
	tree: any,
	nodeType: string,
	visitor: (node: any, index: number, parent: any) => void
) {
	const visitNode = (node: any, index: number | null, parent: any) => {
		if (node.type === nodeType) {
			visitor(node, index!, parent);
		}
		if (node.children) {
			for (let i = 0; i < node.children.length; i++) {
				visitNode(node.children[i], i, node);
			}
		}
	};
	visitNode(tree, null, null);
}
