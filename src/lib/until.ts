import { nip19 } from 'nostr-tools';
import { emojiList } from './store.svelte';
import { getToken } from 'nostr-tools/nip98';
import * as Nostr from 'nostr-typedef';
import { readServerConfig, type FileUploadResponse } from './nip96';

const NOSTR_REGEX =
	/nostr:(npub1[a-z0-9]+|note1[a-z0-9]+|nevent1[a-z0-9]+|nprofile1[a-z0-9]+|naddr1[a-z0-9]+)/g;
const EMOJI_REGEX = /:([a-zA-Z0-9_]+):/g;

function pickRelay(relays?: string[]): string {
	if (!relays?.length) return '';

	return (
		relays.find((r) => r.startsWith('wss://')) ??
		relays.find((r) => !r.startsWith('ws://')) ??
		relays[0] ??
		''
	);
}

const TAG_HANDLERS: Record<string, (data: any) => string[]> = {
	npub: (data) => ['p', data, ''],
	nprofile: (data) => ['p', data.pubkey, pickRelay(data.relays)],
	naddr: (data) => [
		'a',
		`${data.kind}:${data.pubkey}:${data.identifier || ''}`,
		pickRelay(data.relays)
	],
	note: (data) => ['e', data, ''],
	nevent: (data) => ['e', data.id, pickRelay(data.relays)]
};

// 1. Check for nostr: references (NIP-19)
// This finds profiles, events, notes, etc. in format nostr:npub1..., nostr:note1..., etc.
export function processNostrReferences(content: string): string[][] {
	return [...content.matchAll(NOSTR_REGEX)].flatMap((match) => {
		try {
			const decode = nip19.decode(match[1]);
			const handler = TAG_HANDLERS[decode.type];
			return handler ? [handler(decode.data)] : [];
		} catch (e) {
			console.error('Error processing nostr reference:', e);
			return [];
		}
	});
}

// 2. Check for emojis (NIP-30)
export function processEmojis(content: string, preEve: Nostr.Event | null): string[][] {
	const emojiMap = new Map(emojiList.get().map((e) => [e[0], e[1]]));
	const preEveEmojiMap = new Map(
		(preEve?.tags ?? []).filter((tag) => tag[0] === 'emoji').map((tag) => [tag[1], tag[2]])
	);

	return [...new Set([...content.matchAll(EMOJI_REGEX)].map((m) => m[1]))]
		.map((shortcode) => {
			const url = emojiMap.get(shortcode) ?? preEveEmojiMap.get(shortcode);
			return url ? ['emoji', shortcode, url] : null;
		})
		.filter((tag): tag is string[] => tag !== null);
}

// 3. Check for hashtags (NIP-12)
export function processHashtags(content: string) {
	// Look for #hashtag patterns
	const hashtagRegex = /\B#([a-zA-Z0-9_]+\b)(?!;)/g;
	const hashtagMatches = [...content.matchAll(hashtagRegex)];

	// Create t-tags for hashtags
	const hashtagTags: string[][] = [];
	const processedHashtags = new Set(); // To avoid duplicates

	hashtagMatches.forEach((match) => {
		const hashtag = match[1].toLowerCase();
		if (!processedHashtags.has(hashtag)) {
			hashtagTags.push(['t', hashtag]);
			processedHashtags.add(hashtag);
		}
	});

	return hashtagTags;
}

// 4. Check for links/URLs (NIP-23)
export function processLinks(content: string) {
	// より精密なURL正規表現パターン - Markdownの閉じ括弧を除外
	const urlRegex = /(https?:\/\/[^\s\)]+)/g;
	const urlMatches = [...content.matchAll(urlRegex)];

	// Create r-tags for links
	const linkTags: string[][] = [];
	const processedUrls = new Set(); // To avoid duplicates

	urlMatches.forEach((match) => {
		const url = match[1];
		// URLが閉じ括弧で終わっている場合、それを除外
		const cleanUrl = url.replace(/[\)\]]+$/, '');

		if (!processedUrls.has(cleanUrl)) {
			linkTags.push(['r', cleanUrl]);
			processedUrls.add(cleanUrl);
		}
	});

	return linkTags;
}

export async function fileUpload(file: File, uploader: string): Promise<FileUploadResponse> {
	console.log(file, uploader);

	try {
		const serverConfig = await readServerConfig(uploader);
		console.log(serverConfig);
		const header = await getToken(
			serverConfig.api_url,
			'POST',
			async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
			true
		);
		// console.log(file);
		//console.log(header);
		// console.log(serverConfig.api_url);
		//console.log(file.type);
		const response: FileUploadResponse = await pollUploadStatus(serverConfig.api_url, file, header);
		console.log(response);
		return response;
	} catch (error: any) {
		if (error.name === 'AbortError') {
			console.log('Upload aborted:', file.name);
			return {
				status: 'error',
				message: 'Upload aborted: ' + file.name
			} as FileUploadResponse;
		} else {
			console.error('Error uploading file:', error);
			return {
				status: 'error',
				message: 'Failed to upload file: ' + file.name
			} as FileUploadResponse;
		}
	}
}

export function formatAbsoluteDate(unixTime: number, full: boolean = false): string {
	const date = new Date(unixTime * 1000);
	const now = new Date();

	const sameYear = date.getFullYear() === now.getFullYear();
	const sameMonth = sameYear && date.getMonth() === now.getMonth();
	const sameDay = sameMonth && date.getDate() === now.getDate();

	const options: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit'
	};

	if (full || !sameDay) {
		options.month = '2-digit';
		options.day = '2-digit';
	}

	if (full || !sameYear) {
		options.year = 'numeric';
	}

	return date.toLocaleString([], options);
}

export function datetime(unixtime: number) {
	const time = new Date(unixtime * 1000);

	return time.toISOString();
}

// アップロード状態をポーリングする関数
async function pollUploadStatus(
	serverApiUrl: string,
	file: File,
	authHeader: string,
	maxWaitTime: number = 8000
): Promise<FileUploadResponse> {
	const startTime = Date.now();
	let response: Response;
	let statusResponse: FileUploadResponse;

	const formData = new FormData();
	formData.append('Authorization', authHeader);
	formData.append('file', file);

	// 初回アップロードリクエスト
	response = await fetch(serverApiUrl, {
		method: 'POST',
		headers: {
			Authorization: authHeader
		},
		body: formData
	});

	if (!response.ok) {
		handleErrorResponse(response);
	}

	try {
		statusResponse = await response.json();
	} catch (error) {
		throw new Error('Failed to parse upload response');
	}
	console.log(statusResponse.processing_url);
	// 即時完了している場合は返す
	if (response.status === 201 || !statusResponse.processing_url) {
		return statusResponse;
	}
	// 初回アップロード後、ポーリング前に2秒待機
	await new Promise((resolve) => setTimeout(resolve, 2000));

	let processingAuthToken;
	let signatureFailed = false;

	try {
		processingAuthToken = await getToken(
			statusResponse.processing_url,
			'GET',
			async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
			true
		);
	} catch (error) {
		// 署名失敗した場合
		console.log('Initial signature failed:', error);
		signatureFailed = true;

		// 署名を一度失敗した場合、少し待機してから署名チャレンジ
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// 待機後に再度署名を試みる
		try {
			console.log('Retrying signature after wait...');
			processingAuthToken = await getToken(
				statusResponse.processing_url,
				'GET',
				async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
				true
			);
			signatureFailed = false;
			console.log('Retry signature succeeded');
		} catch (retryError) {
			console.log('Retry signature also failed:', retryError);
			throw new Error(
				'Cannot verify if the image was uploaded because signature authorization was denied'
			);
		}
	}

	if (!signatureFailed) {
		console.log('Auth header:', processingAuthToken);
	}

	// 処理待ちの場合は processing_url をポーリング
	while (true) {
		if (Date.now() - startTime > maxWaitTime) {
			return statusResponse;
		}

		const processingResponse = await fetch(statusResponse.processing_url, {
			method: 'GET',
			headers: {
				Authorization: processingAuthToken
			}
		});

		if (!processingResponse.ok) {
			throw new Error(
				`Unexpected status code ${processingResponse.status} while polling processing_url`
			);
		}

		if (processingResponse.status === 201) {
			// 処理完了時の最終レスポンスを返す
			return await processingResponse.json();
		}

		const processingStatus = await processingResponse.json();

		if (processingStatus.status === 'processing') {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			continue;
		}

		if (processingStatus.status === 'error') {
			throw new Error('File processing failed');
		}

		throw new Error('Unexpected processing status');
	}
}

// エラーコードを定数として定義
const ERROR_CODES = {
	FILE_TOO_LARGE: 413,
	BAD_REQUEST: 400,
	FORBIDDEN: 403,
	PAYMENT_REQUIRED: 402
};

// エラーメッセージを定数として定義
const ERROR_MESSAGES = {
	[ERROR_CODES.FILE_TOO_LARGE]: 'File too large!',
	[ERROR_CODES.BAD_REQUEST]: 'Bad request! Some fields are missing or invalid!',
	[ERROR_CODES.FORBIDDEN]: 'Forbidden! Payload tag does not match the requested file!',
	[ERROR_CODES.PAYMENT_REQUIRED]: 'Payment required!',
	DEFAULT: 'Unknown error in uploading file!'
};
// エラーハンドリングを共通化
function handleErrorResponse(response: Response): never {
	const errorMessage = ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
	throw new Error(errorMessage);
}
