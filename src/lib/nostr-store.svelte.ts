import { relayManager } from './rxNostr';
import * as Nostr from 'nostr-typedef';
// キャッシュされたイベントの型定義
type CachedEvent = {
	event: Nostr.Event | Nostr.Event[];
	fetchedAt: number;
};
export interface FetchProgress {
	key: string[];
	event: Nostr.Event;
	isPartial: boolean;
	partialCount: number;
	timestamp: number;
}

export function keyToString(key: string[]): string {
	return JSON.stringify(key);
}

class NostrEventStore {
	events = $state(<Record<string, CachedEvent>>{});
	loading = $state(<Record<string, boolean>>{});
	errors = $state(<Record<string, string>>{});

	getEventById(key: string[]): Nostr.Event | Nostr.Event[] | null {
		//console.log('getEventById', key);
		const cacheKey = keyToString(key);
		const cachedEvent = this.events[cacheKey];

		// キャッシュがあれば返す（有効期限チェックなし）
		if (cachedEvent) {
			return cachedEvent.event;
		}

		return null;
	}

	setEvent(key: string[], event: Nostr.Event | Nostr.Event[]) {
		const cacheKey = keyToString(key);
		this.events = {
			...this.events,
			[cacheKey]: { event, fetchedAt: Date.now() }
		};

		// ローディングとエラー状態をクリア
		if (this.loading[cacheKey]) {
			const l = { ...this.loading };
			delete l[cacheKey];
			this.loading = l;
		}

		if (this.errors[cacheKey]) {
			const e = { ...this.errors };
			delete e[cacheKey];
			this.errors = e;
		}
	}

	async fetchEvent(key: string[]): Promise<Nostr.Event | null> {
		const cacheKey = keyToString(key);
		if (this.loading[cacheKey]) return null;

		const cached = this.getEventById(key) as Nostr.Event | null;
		if (cached) return cached;

		try {
			this.loading = { ...this.loading, [cacheKey]: true };
			const event: Nostr.Event | null = await relayManager.fetchEvent(key); //fetchEventWithProgress にして途中のイベントを都度セットする

			if (event) {
				this.setEvent(key, event);
				return event;
			} else {
				const l = { ...this.loading };
				delete l[cacheKey];
				this.loading = l;
				this.errors = { ...this.errors, [cacheKey]: 'イベントが見つかりませんでした' };
				return null;
			}
		} catch (e: any) {
			const l = { ...this.loading };
			delete l[cacheKey];
			this.loading = l;
			this.errors = { ...this.errors, [cacheKey]: e.message || 'Unknown error' };
			return null;
		}
	}
	async fetchEvents(key: string[]): Promise<Nostr.Event[] | null> {
		const cacheKey = keyToString(key);
		if (this.loading[cacheKey]) return null;

		const cached = this.getEventById(key) as Nostr.Event[] | null;
		if (cached) return cached;

		try {
			this.loading = { ...this.loading, [cacheKey]: true };
			const event: Nostr.Event[] | null = await relayManager.fetchEvents(key);

			if (event) {
				this.setEvent(key, event);
				return event;
			} else {
				const l = { ...this.loading };
				delete l[cacheKey];
				this.loading = l;
				this.errors = { ...this.errors, [cacheKey]: 'イベントが見つかりませんでした' };
				return null;
			}
		} catch (e: any) {
			const l = { ...this.loading };
			delete l[cacheKey];
			this.loading = l;
			this.errors = { ...this.errors, [cacheKey]: e.message || 'Unknown error' };
			return null;
		}
	}

	// オプション: 部分更新の通知機能を追加する場合
	private notifyPartialUpdate?(key: string[], event: Nostr.Event): void;

	// 部分更新通知を設定するメソッド
	setPartialUpdateCallback(callback: (key: string[], event: Nostr.Event) => void) {
		this.notifyPartialUpdate = callback;
	}

	// より高度なバージョン: 進捗情報も含める
	async fetchEventWithProgress(
		key: string[],
		onProgress?: (progress: FetchProgress) => void
	): Promise<Nostr.Event | null> {
		const cacheKey = keyToString(key);
		if (this.loading[cacheKey]) return null;

		const cached = this.getEventById(key) as Nostr.Event | null;
		if (cached) return cached;

		try {
			this.loading = { ...this.loading, [cacheKey]: true };

			let partialEventCount = 0;
			const result = await relayManager.fetchEventWithProgress(key, (progress) => {
				partialEventCount++;

				if (progress.event && progress.isPartial) {
					// 途中データをキャッシュにセット
					this.setEvent(key, progress.event);

					// 進捗情報を作成
					const progressInfo: FetchProgress = {
						key,
						event: progress.event,
						isPartial: true,
						partialCount: partialEventCount,
						timestamp: progress.timestamp
					};

					// 進捗コールバック実行
					onProgress?.(progressInfo);
					this.notifyPartialUpdate?.(key, progress.event);
				}
			});

			// ローディング状態をクリア
			const l = { ...this.loading };
			delete l[cacheKey];
			this.loading = l;

			if (result.event) {
				this.setEvent(key, result.event);

				// 最終進捗通知
				const finalProgress: FetchProgress = {
					key,
					event: result.event,
					isPartial: false,
					partialCount: partialEventCount,
					timestamp: result.timestamp
				};
				onProgress?.(finalProgress);

				return result.event;
			} else {
				this.errors = { ...this.errors, [cacheKey]: 'イベントが見つかりませんでした' };
				return null;
			}
		} catch (e: any) {
			const l = { ...this.loading };
			delete l[cacheKey];
			this.loading = l;
			this.errors = { ...this.errors, [cacheKey]: e.message || 'Unknown error' };
			return null;
		}
	}

	prefetchEvents(keys: string[][]) {
		keys.forEach((key) => {
			const cacheKey = keyToString(key);
			if (!this.getEventById(key) && !this.loading[cacheKey]) {
				this.fetchEvent(key).catch(console.error);
			}
		});
	}

	// 手動でキャッシュをクリアするメソッド（必要な場合のみ使用）
	clearCache() {
		this.events = {};
	}

	// 特定のキーのキャッシュをクリアするメソッド
	clearCacheItem(key: string[]) {
		const cacheKey = keyToString(key);
		if (this.events[cacheKey]) {
			const updated = { ...this.events };
			delete updated[cacheKey];
			this.events = updated;
		}
	}
}

// シングルトンとしてエクスポート
export const nostrEventStore = new NostrEventStore();
