// rx-nostr-relay-manager.ts
import {
	createRxBackwardReq,
	createRxForwardReq,
	createRxNostr,
	latest,
	nip07Signer,
	uniq,
	type AcceptableDefaultRelaysConfig,
	type RxNostr
} from 'rx-nostr';
import { createFilter } from './nostr-fetch-utils';
import { timeout } from 'rxjs';
import { kind10002SearchRelays } from './until';
import * as Nostr from 'nostr-typedef';

import { verifier } from '@rx-nostr/crypto';
import { latestbyId } from './operator';
import { articles, emojiList } from './store.svelte';
import { nostrEventStore } from './nostr-store.svelte';

const FETCH_TIMEOUT = 5000;

export class RxNostrRelayManager {
	private nostr: RxNostr;

	constructor(relays: string[] = kind10002SearchRelays) {
		this.nostr = createRxNostr({ verifier });
		this.nostr.setDefaultRelays(relays);
	}
	setRelays(pubkey: string, relays: AcceptableDefaultRelaysConfig): void {
		this.nostr.setDefaultRelays(relays);
		//絵文字も取る。
		this.getCustomEmojilist(pubkey);
		//デフォリレーセットしたら30023を購読する
		this.articleSubscribe(pubkey);
	}
	articleSubscribe(pubkey: string) {
		const filter = createFilter(['a', `30023:${pubkey}:`]);
		const req = createRxForwardReq();
		const sub = this.nostr
			.use(req)
			.pipe(uniq(), latestbyId())
			.subscribe({
				next: (packet) => {
					console.log('Received:', packet);
					if (packet) {
						articles.set(packet.map((e) => e.event));
					}
				},
				complete: () => {
					console.log('Completed!');
					sub.unsubscribe();
				},
				error: (err) => {
					console.error('Error:', err);
					sub.unsubscribe();
				}
			});
		req.emit(filter);
	}
	async getCustomEmojilist(pubkey: string) {
		try {
			const event = await nostrEventStore.fetchEvent(['a', `10030:${pubkey}:`]);
			if (!event) return;

			const atags = event.tags.filter((tag) => tag[0] === 'a');

			// Extract the proper reference from atags
			const emojiPromises = atags.map(async (atag) => {
				// Make sure we're using the proper event reference format from the atag
				// A typical 'a' tag should have format ['a', event-reference, relay-url]
				if (atag.length < 2) return [];

				// Use the second element which should contain the event reference
				const eventRef = atag[1];
				const emojiEv = await nostrEventStore.fetchEvent(['a', eventRef]);

				if (!emojiEv) return [];

				// Process emoji tags
				const emojis: string[][] = [];

				// Create a map to track shortcodes and handle duplicates
				const shortcodeMap = new Map<string, number>();

				emojiEv.tags.forEach((tag) => {
					if (tag[0] === 'emoji' && tag.length >= 3) {
						let shortcode = tag[1];
						const url = tag[2];

						if (shortcode && url) {
							// Check if this shortcode already exists with a different URL
							if (emojis.some((emoji) => emoji[0] === shortcode && emoji[1] !== url)) {
								// Get the current count for this shortcode
								const count = shortcodeMap.get(shortcode) || 1;
								// Create a unique shortcode by appending _[count]
								shortcode = `${shortcode}_${count}`;
								// Increment the count for next time
								shortcodeMap.set(tag[1], count + 1);
							}

							emojis.push([shortcode, url]);
						}
					}
				});

				return emojis;
			});

			// Wait for all promises to resolve
			const allEmojis = await Promise.all(emojiPromises);

			// Flatten the array of arrays and update the emoji list
			const flattenedEmojis = allEmojis.flat();
			if (flattenedEmojis.length > 0) {
				emojiList.update((pre) => [...pre, ...flattenedEmojis]);
			}
		} catch (error) {
			console.error('Error in getCustomEmojilist:', error);
		}
	}
	async fetchEvent(key: string[]): Promise<Nostr.Event | null> {
		const filter = createFilter(key);
		return new Promise((resolve, reject) => {
			const req = createRxBackwardReq();
			try {
				console.log(`リレーからイベント ${key} を取得中...`);
				let receivedEvent: Nostr.Event;
				const sub = this.nostr
					.use(req)
					.pipe(uniq(), latest(), timeout(FETCH_TIMEOUT))
					.subscribe({
						next: (packet) => {
							console.log('Received:', packet);
							if (packet.event) {
								receivedEvent = packet.event;
							}
						},
						complete: () => {
							console.log('Completed!');
							sub.unsubscribe();
							if (receivedEvent) {
								resolve(receivedEvent);
							} else {
								reject(new Error('イベントが見つかりませんでした'));
							}
						},
						error: (err) => {
							console.error('Error:', err);
							sub.unsubscribe();
							if (receivedEvent) {
								resolve(receivedEvent);
							} else {
								reject(new Error('イベントが見つかりませんでした'));
							}
						}
					});

				req.emit(filter);
				req.over();
			} catch (e) {
				console.error('イベント取得エラー:', e);
				return null;
			}
		});
	}

	async fetchEvents(key: string[]): Promise<Nostr.Event[] | null> {
		const filter = createFilter(key);
		return new Promise((resolve, reject) => {
			const req = createRxBackwardReq();
			try {
				console.log(`リレーからイベント ${key} を取得中...`);
				let receivedEvent: Nostr.Event[];
				const sub = this.nostr
					.use(req)
					.pipe(uniq(), latestbyId(), timeout(FETCH_TIMEOUT))
					.subscribe({
						next: (packet) => {
							console.log('Received:', packet);
							if (packet) {
								receivedEvent = packet.map((e) => e.event);
							}
						},
						complete: () => {
							console.log('Completed!');
							sub.unsubscribe();
							if (receivedEvent) {
								resolve(receivedEvent);
							} else {
								reject(new Error('イベントが見つかりませんでした'));
							}
						},
						error: (err) => {
							console.error('Error:', err);
							sub.unsubscribe();
							if (receivedEvent) {
								resolve(receivedEvent);
							} else {
								reject(new Error('イベントが見つかりませんでした'));
							}
						}
					});

				req.emit(filter);
				req.over();
			} catch (e) {
				console.error('イベント取得エラー:', e);
				return null;
			}
		});
	}

	async publishEvent(
		paramEvent: Nostr.EventParameters,
		timeoutMs: number = 5000
	): Promise<{
		event?: Nostr.Event;
		successRelays: string[];
		failedRelays: string[];
		error?: string;
	}> {
		try {
			const signer = nip07Signer();
			const signedEvent = await signer.signEvent(paramEvent);
			const successRelays: string[] = [];
			const failedRelays: string[] = [];

			// Create a Promise that will resolve when we've collected all responses or timeout occurs
			return new Promise((resolve) => {
				// タイムアウト用のタイマーを設定
				const timeoutId = setTimeout(() => {
					// タイムアウト時に現在の結果で解決する
					if (sub && !sub.closed) {
						sub.unsubscribe();
					}
					resolve({
						event: signedEvent,
						successRelays,
						failedRelays
					});
				}, timeoutMs);

				const sub = this.nostr.send(signedEvent).subscribe({
					next: (packet) => {
						console.log(
							`リレー ${packet.from} への送信が ${packet.ok ? '成功' : '失敗'} しました。`
						);

						if (packet.ok) {
							successRelays.push(packet.from);
						} else {
							failedRelays.push(packet.from);
						}
					},
					complete: () => {
						// 通常の完了時にはタイムアウトをキャンセル
						clearTimeout(timeoutId);
						sub.unsubscribe();
						resolve({
							event: signedEvent,
							successRelays,
							failedRelays
						});
					},
					error: (err) => {
						// エラー時にもタイムアウトをキャンセル
						clearTimeout(timeoutId);
						sub.unsubscribe();
						resolve({
							event: signedEvent,
							successRelays,
							failedRelays,
							error: err.message
						});
					}
				});
			});
		} catch (e: any) {
			return {
				successRelays: [],
				failedRelays: [],
				error: e.message
			};
		}
	}

	close() {
		this.nostr.dispose();
	}
}

export const relayManager = new RxNostrRelayManager();
