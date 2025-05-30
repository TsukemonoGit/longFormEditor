// lib/func/useUrlType.svelte.ts

import { urlTypeCache } from '$lib/urlTypeCache.svelte';
import { type UrlType, detectUrlType } from '$lib/urlTypeDetector';

export function useUrlType(url: string) {
	let type = $state<UrlType | null>(null);
	let loading = $state(false);

	$effect(() => {
		if (urlTypeCache.has(url)) {
			type = urlTypeCache.get(url)!;
		} else {
			detectType();
		}
	});

	async function detectType() {
		loading = true;
		try {
			const detectedType = await detectUrlType(url);
			type = detectedType;
			urlTypeCache.set(url, detectedType);
		} finally {
			loading = false;
		}
	}

	function refresh() {
		urlTypeCache.clear(url);
		detectType();
	}

	return {
		get type() {
			return type;
		},
		get loading() {
			return loading;
		},
		refresh
	};
}
