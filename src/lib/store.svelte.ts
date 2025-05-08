import * as Nostr from 'nostr-typedef';

export const articles = createCustomStore<Nostr.Event[]>([]);
export const emojiList = createCustomStore<string[][]>([]);
export const isDark = createCustomStore<boolean>(false);
// 汎用的なカスタムストア作成関数
function createCustomStore<T>(initialValue: T) {
	let state: T = $state.raw(initialValue);
	let subscribers: Array<(value: T) => void> = [];

	return {
		get: () => state,
		set: (value: T) => {
			state = value;
			subscribers.forEach((subscriber) => subscriber(state));
		},
		update: (updater: (current: T) => T) => {
			state = updater(state);
			subscribers.forEach((subscriber) => subscriber(state));
		},
		subscribe: (subscriber: (value: T) => void) => {
			subscribers.push(subscriber);
			subscriber(state); // 初回呼び出し
			return () => {
				subscribers = subscribers.filter((s) => s !== subscriber);
			};
		}
	};
}
