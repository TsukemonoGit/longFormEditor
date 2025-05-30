import type { UrlType } from './urlTypeDetector';

class UrlTypeCacheManager {
	private cache = $state(new Map<string, UrlType>());

	set(url: string, type: UrlType): void {
		this.cache.set(url, type);
	}

	get(url: string): UrlType | undefined {
		return this.cache.get(url);
	}

	has(url: string): boolean {
		return this.cache.has(url);
	}

	clear(url?: string): void {
		if (url) {
			this.cache.delete(url);
		} else {
			this.cache.clear();
		}
	}
}

export const urlTypeCache = new UrlTypeCacheManager();
