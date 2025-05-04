// rx-nostr-relay-manager.ts
import {
	createRxBackwardReq,
	createRxForwardReq,
	createRxNostr,
	latest,
	latestEach,
	uniq,
	type AcceptableDefaultRelaysConfig,
	type RxNostr
} from 'rx-nostr';
import { createFilter } from './nostr-fetch-utils';
import { firstValueFrom, race, timeout, of } from 'rxjs';
import { kind10002SearchRelays } from './until';
import * as Nostr from 'nostr-typedef';

import { verifier } from '@rx-nostr/crypto';
import { latestbyId } from './operator';
import { articles } from './store.svelte';

const FETCH_TIMEOUT = 5000;

export class RxNostrRelayManager {
	private nostr: RxNostr;

	constructor(relays: string[] = kind10002SearchRelays) {
		this.nostr = createRxNostr({ verifier });
		this.nostr.setDefaultRelays(relays);
	}
	setRelays(pubkey: string, relays: AcceptableDefaultRelaysConfig): void {
		this.nostr.setDefaultRelays(relays);
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
		event: Nostr.EventParameters
	): Promise<{ success: boolean; eventId?: string; error?: string }> {
		try {
			const pub = this.nostr.send(event).subscribe((packet) => {
				console.log(`リレー ${packet.from} への送信が ${packet.ok ? '成功' : '失敗'} しました。`);
			});

			return { success: true, eventId: event.id };
		} catch (e: any) {
			return { success: false, error: e.message };
		}
	}

	close() {
		this.nostr.dispose();
	}
}

export const relayManager = new RxNostrRelayManager();
