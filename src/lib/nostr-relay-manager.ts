// nostr-relay-manager.ts
// Nostrリレーとの通信を管理するクラス

import { SimplePool, type Event } from 'nostr-tools';
import { createFilter } from './nostr-fetch-utils';

// デフォルトリレーのリスト
const DEFAULT_RELAYS = [
	'wss://relay.damus.io',
	'wss://relay.nostr.band',
	'wss://nos.lol',
	'wss://relay.nostr.bg',
	'wss://nostr.fmt.wiz.biz'
];

// タイムアウト設定（ミリ秒）
const FETCH_TIMEOUT = 5000;

export class NostrRelayManager {
	private pool: SimplePool;
	private relays: string[];

	constructor(relays: string[] = DEFAULT_RELAYS) {
		this.pool = new SimplePool();
		this.relays = relays;
	}

	/**
	 * 指定されたイベントIDのNostrイベントを取得
	 * @param eventId イベントID（16進数形式）
	 * @returns Nostrイベントまたはnull
	 */
	async fetchEvent(key: string[]): Promise<Event | null> {
		const filter = createFilter(key);
		try {
			console.log(`リレーからイベント ${key} を取得中...`);
			/* return {
				content:
					'Vitalik Buterin、今後Ethereumのプロトコルを大幅に簡素化すべきと主張\n\n Vitalik Buterinは「Simplifying the L1」で今後5年でEthereumのプロトコルを大幅に簡素化すべきと主張した。Bitcoinの設計思想に学び、複雑さによる開発コストやセキュリティリスクを抑える狙い。Ethereumコアのコード行数にも上限を設け、長期的な堅牢性を高める提案を行った。\n\nhttps://bitbank.cc/knowledge/breaking/article/3-7bbrugw',
				created_at: 1746258640,
				id: '0c7789cc6501f459616b95cbb10ec61d01152a54e379bc8a40665cfad6d62fe6',
				kind: 1,
				pubkey: '88a26d85b87c75a74d65677e4718c416c118fa2312216f23bb7ab79dfab22168',
				sig: '544544ba5ed774a9c7465e1552529ec2d1e153a5c19d16e1edc24de47fbea9bbe031291c404f35626c7f13f75ed6fb5796514bebf5649baad0048ced53257e3f',
				tags: [
					['r', 'https://bitbank.cc/knowledge/breaking/article/3-7bbrugw'],
					['proxy', 'https://bitbank.cc/knowledge/breaking/feed#3-7bbrugw', 'rss']
				]
			}; */
			// タイムアウト付きでイベントを取得
			const event = await Promise.race([
				this.pool.get(this.relays, filter),
				new Promise<null>((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT))
			]);

			return (event as Event) || null;
		} catch (e) {
			console.error('イベント取得エラー:', e);
			return null;
		}
	}

	/**
	 * 指定されたイベントを公開
	 * @param event 公開するイベント
	 * @returns 公開されたイベントID または エラーメッセージ
	 */
	async publishEvent(
		event: Event
	): Promise<{ success: boolean; eventId?: string; error?: string }> {
		try {
			const pubs = this.pool.publish(this.relays, event);

			// 少なくとも1つのリレーに公開できるのを待つ
			const firstRelay = await Promise.race([
				...pubs.map((pub) => pub.then((relay) => ({ success: true, relay }))),
				new Promise<any>((resolve) =>
					setTimeout(() => resolve({ success: false, error: 'タイムアウト' }), FETCH_TIMEOUT)
				)
			]);

			if (!firstRelay.success) {
				return { success: false, error: firstRelay.error };
			}

			return { success: true, eventId: event.id };
		} catch (e: any) {
			return { success: false, error: e.message };
		}
	}

	/**
	 * リソース解放
	 */
	close() {
		this.pool.close(this.relays);
	}
}

// リレーマネージャーのシングルトンインスタンス
export const relayManager = new NostrRelayManager();
