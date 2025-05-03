// nostr-store.ts
import type { Event } from 'nostr-tools';
import { relayManager } from './nostr-relay-manager';

// データ有効期限のタイムスタンプ（5分）
const STALE_TIME = 5 * 60 * 1000;
// キャッシュ保持期間（30分）
const CACHE_TIME = 30 * 60 * 1000;

// キャッシュされたイベントの型定義
type CachedEvent = {
	event: Event;
	fetchedAt: number;
};

export function keyToString(key: string[]): string {
	return JSON.stringify(key);
}

class NostrEventStore {
	events: Record<string, CachedEvent> = $state({});
	loading = $state(<Record<string, boolean>>{});
	errors = $state(<Record<string, string>>{});

	getEventById(key: string[]): Event | null {
		console.log('getEventById', key);
		const cacheKey = keyToString(key);
		const cachedEvent = this.events[cacheKey];
		if (cachedEvent) {
			const now = Date.now();
			if (now - cachedEvent.fetchedAt < CACHE_TIME) {
				return cachedEvent.event;
			} else {
				const updated = { ...this.events };
				delete updated[cacheKey];
				this.events = updated;
			}
		}
		return null;
	}

	setEvent(key: string[], event: Event) {
		const cacheKey = keyToString(key);
		this.events = {
			...this.events,
			[cacheKey]: { event, fetchedAt: Date.now() }
		};
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

	async fetchEvent(key: string[]): Promise<Event | null> {
		const cacheKey = keyToString(key);
		if (this.loading[cacheKey]) return null;

		const cached = this.getEventById(key);
		if (cached) return cached;

		try {
			this.loading = { ...this.loading, [cacheKey]: true };
			const event = await relayManager.fetchEvent(key);
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

	prefetchEvents(keys: string[][]) {
		keys.forEach((key) => {
			const cacheKey = keyToString(key);
			if (!this.getEventById(key) && !this.loading[cacheKey]) {
				this.fetchEvent(key).catch(console.error);
			}
		});
	}

	cleanupCache() {
		const now = Date.now();
		const updated = { ...this.events };
		let changed = false;
		for (const [k, v] of Object.entries(updated)) {
			if (now - v.fetchedAt > CACHE_TIME) {
				delete updated[k];
				changed = true;
			}
		}
		if (changed) {
			this.events = updated;
		}
	}
}

// 定期的なキャッシュクリーンアップを設定
if (typeof window !== 'undefined') {
	setInterval(() => nostrEventStore.cleanupCache(), 5 * 60 * 1000); // 5分ごとにクリーンアップ
}

// シングルトンとしてエクスポート
export const nostrEventStore = new NostrEventStore();
