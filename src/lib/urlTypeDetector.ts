// lib/types/urlTypes.ts
export type UrlType = 'text' | 'image' | 'audio' | 'movie' | '3D' | 'url';

const TYPE_PATTERNS = {
	image: /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i,
	audio: /\.(mp3|wav|ogg|flac|aac|m4a)$/i,
	movie: /\.(mp4|avi|mov|mkv|webm|flv|wmv)$/i,
	'3D': /\.(obj|fbx|gltf|glb|ply|stl|3ds)$/i
} as const;

const MIME_TYPES = {
	image: /^image\//,
	audio: /^audio\//,
	movie: /^video\//,
	'3D': /^model\//,
	text: /^text\/|application\/(json|xml|javascript|pdf)/
} as const;

export async function detectUrlType(url: string): Promise<UrlType> {
	// 1. 拡張子による判定（最速）
	for (const [type, pattern] of Object.entries(TYPE_PATTERNS)) {
		if (pattern.test(url)) {
			return type as UrlType;
		}
	}

	try {
		// 2. HEADリクエストでContent-Typeチェック
		const response = await fetch(url, { method: 'HEAD' });
		const contentType = response.headers.get('content-type')?.toLowerCase() || '';

		for (const [type, pattern] of Object.entries(MIME_TYPES)) {
			if (pattern.test(contentType)) {
				return type as UrlType;
			}
		}
	} catch {
		// HEADリクエスト失敗時は拡張子で再判定
	}

	// 3. デフォルトはurl
	return 'url';
}
