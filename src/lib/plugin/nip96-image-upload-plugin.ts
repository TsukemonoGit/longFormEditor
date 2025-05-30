// nip96-image-upload-plugin.ts
import type { BytemdPlugin } from 'bytemd';
import { writable } from 'svelte/store';
import ServerSelector from '../Components/ServerSelector.svelte';
import { mount } from 'svelte';
import type { FileUploadResponse } from '$lib/nip96';
import { fileUpload } from '$lib/until';

// NIP-96対応サーバーのリスト
const NIP96_SERVERS = [
	{ name: 'nostrcheck.me', url: 'https://nostrcheck.me' },
	{ name: 'nostr.build', url: 'https://nostr.build' },
	{ name: 'void.cat', url: 'https://void.cat' },
	{ name: 'files.sovbit.host', url: 'https://files.sovbit.host' },
	{ name: 'nostpic.com', url: 'https://nostpic.com' },
	{ name: 'yabu.me', url: 'https://yabu.me' }
];

// アップロード状態のStore
const uploadingStore = writable(false);
const progressStore = writable(0);

// NIP-96に対応した画像アップロード関数
async function uploadImageToNIP96Server(file: File, serverUrl: string): Promise<string> {
	uploadingStore.set(true);
	progressStore.set(0);

	try {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(serverUrl, {
			method: 'POST',
			body: formData,
			headers: {
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`アップロードに失敗しました: ${response.status}`);
		}

		const data = await response.json();

		// 各サーバーのレスポンス形式に対応
		if (serverUrl.includes('nostrimg.com')) {
			return data.data.url;
		} else if (serverUrl.includes('nostr.build')) {
			return data.data[0];
		} else if (serverUrl.includes('void.cat')) {
			return data.file?.url || data.url;
		} else if (serverUrl.includes('nostrfiles.dev')) {
			return data.url;
		} else if (serverUrl.includes('imgproxy.snort.social')) {
			return data.url;
		}

		// 汎用的な対応: urlプロパティがあればそれを使用
		return data.url || '';
	} catch (error) {
		console.error('画像アップロードエラー:', error);
		throw error;
	} finally {
		uploadingStore.set(false);
		progressStore.set(100);
	}
}

// メインのプラグイン関数
export function nip96ImageUpload(): BytemdPlugin {
	return {
		//name: 'nip96-image-upload', // Name is required for BytemdPlugin

		actions: [
			{
				title: '画像をアップロード (NIP-96)',
				icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>',

				handler: {
					type: 'action',
					click({ editor }) {
						let modalVisible = false;

						// 明確にスタイルを設定したコンテナを作成
						const container = document.createElement('div');
						container.className = 'nip96-container';
						container.style.position = 'fixed';
						container.style.left = '50%';
						container.style.top = '50%';
						container.style.transform = 'translate(-50%, -50%)';
						container.style.zIndex = '9999';
						container.style.backgroundColor = '#ffffff';
						container.style.padding = '20px';
						container.style.borderRadius = '8px';
						container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
						container.style.minWidth = '300px';

						// 背景オーバーレイを作成
						const overlay = document.createElement('div');
						overlay.style.position = 'fixed';
						overlay.style.left = '0';
						overlay.style.top = '0';
						overlay.style.width = '100%';
						overlay.style.height = '100%';
						overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
						overlay.style.zIndex = '9998';

						// ファイル選択入力を作成
						const fileInput = document.createElement('input');
						fileInput.type = 'file';
						fileInput.accept = 'image/*';
						fileInput.style.display = 'none';
						document.body.appendChild(fileInput);

						const selectServer = async ({ name, url }: { name: string; url: string }) => {
							try {
								const file = fileInput.files?.[0];
								if (!file) return;
								const res: FileUploadResponse = await fileUpload(file, url);

								if (res.status !== 'success') {
									throw new Error();
								}
								const imageUrl = res.nip94_event?.tags.find((tag) => tag[0] === 'url')?.[1];
								if (!imageUrl) {
									throw new Error();
								}
								// マークダウンの画像構文を挿入
								const imageMarkdown = `![image](${imageUrl})`;
								editor.replaceSelection(imageMarkdown);

								// モーダルを閉じる
								closeModal();
							} catch (error: any) {
								console.error('画像アップロードエラー:', error);
								alert(`画像のアップロードに失敗しました: ${error.message}`);
							}
						};

						// モーダルを閉じる関数
						function closeModal() {
							modalVisible = false;
							if (document.body.contains(container)) {
								document.body.removeChild(container);
							}
							if (document.body.contains(overlay)) {
								document.body.removeChild(overlay);
							}
						}

						// オーバーレイクリックでモーダルを閉じる
						overlay.addEventListener('click', closeModal);

						// モーダルのマウント関数
						function mountServerSelector() {
							modalVisible = true;
							console.log('Mounting server selector, modalVisible:', modalVisible);

							// DOMにコンテナとオーバーレイを追加
							document.body.appendChild(overlay);
							document.body.appendChild(container);

							// Svelteコンポーネントをマウント
							const app = mount(ServerSelector, {
								target: container,
								props: {
									servers: NIP96_SERVERS,
									visible: true, // 常にvisible=trueで渡す
									selectServer: selectServer,
									closeModal: closeModal
								}
							});

							return app;
						}

						// ファイル選択時の処理
						fileInput.onchange = () => {
							console.log('File selected:', fileInput.files);
							if (fileInput.files?.length) {
								mountServerSelector();
							}
						};

						// ファイル選択ダイアログを表示
						fileInput.click();
					}
				}
			}
		]
	};
}

// アップロード状態を監視するためのストアエクスポート
export const uploading = { subscribe: uploadingStore.subscribe };
export const uploadProgress = { subscribe: progressStore.subscribe };

// プラグインのデフォルトエクスポート
export default nip96ImageUpload;
