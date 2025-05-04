import type { EventPacket } from 'rx-nostr';
import { latestEach } from 'rx-nostr';
import type { OperatorFunction } from 'rxjs';
import { filter, map, pipe, scan, tap } from 'rxjs';

export function filterId(id: string): OperatorFunction<EventPacket, EventPacket> {
	return filter((packet) => packet.event.id === id);
}

export function filterTextList(ids: string[]): OperatorFunction<EventPacket, EventPacket> {
	return filter(({ event }) => event.kind === 1 && ids.includes(event.id));
}

export function filterPubkey(pubkey: string): OperatorFunction<EventPacket, EventPacket> {
	return filter((packet) => packet.event.pubkey === pubkey);
}

export function filterMetadataList(pubkeys: string[]): OperatorFunction<EventPacket, EventPacket> {
	return filter(({ event }) => event.kind === 0 && pubkeys.includes(event.pubkey));
}

export function filterNaddr(
	kind: number,
	pubkey: string,
	identifier: string
): OperatorFunction<EventPacket, EventPacket> {
	return filter(
		({ event }) => event.kind === kind && event.pubkey === pubkey && event.tags[0][1] === identifier
	);
}

export function latestEachPubkey(): OperatorFunction<EventPacket, EventPacket> {
	return latestEach(({ event }) => event.pubkey);
}

export function latestEachNaddr(): OperatorFunction<EventPacket, EventPacket> {
	return latestEach(({ event }) => `${event.kind}:${event.pubkey}:${event.tags[0][1]}`);
}

// export function scanArray0<A>(): OperatorFunction<A, A[]> {
//   return scan((acc: A[], a: A) => [...acc, a], []);
// }
// export function collectGroupBy<A, K>(
//   f: (a: A) => K
// ): OperatorFunction<A, Map<K, A[]>> {
//   return pipe(
//     scanArray0(),
//     map((xs) => {
//       const dict = new Map<K, A[]>();
//       xs.forEach((x) => {
//         const key = f(x);
//         const value = dict.get(key);
//         if (value) {
//           dict.set(key, [...value, x]);
//         } else {
//           dict.set(key, [x]);
//         }
//       });
//       return dict;
//     })
//   );
// }

// export function scanLatestEach<A, K>(f: (a: A) => K): OperatorFunction<A, A[]> {
//   return pipe(
//     collectGroupBy(f),
//     map((dict) =>
//       Array.from(dict.entries()).map(([, value]) => value.slice(-1)[0])
//     )
//   );
// }

export function latestbyId<A extends EventPacket>(): OperatorFunction<A, A[]> {
	return pipe(
		scan((acc: Map<string, A>, eventPacket: A) => {
			const tagValue = getTagValue(eventPacket, 'd');
			if (tagValue) {
				const existingPacket = acc.get(tagValue);
				if (!existingPacket || existingPacket.event.created_at < eventPacket.event.created_at) {
					acc.set(tagValue, eventPacket);
				}
			}
			return acc;
		}, new Map<string, A>()),
		map((acc) => Array.from(acc.values()))
	);
}

function getTagValue(eventPacket: EventPacket, tagKey: string): string | undefined {
	const tag = eventPacket.event.tags.find((tag) => tag[0] === tagKey);
	return tag ? tag[1] : undefined;
}
