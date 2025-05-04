import { nip19 } from 'nostr-tools';
import { emojiList } from './store.svelte';
import { readServerConfig, uploadFile, type FileUploadResponse } from 'nostr-tools/nip96';
import { getToken } from 'nostr-tools/nip98';
import * as Nostr from 'nostr-typedef';

export const kind10002SearchRelays = [
	//'wss://tes'
	//'wss://relay.nostr.band'
	//	'wss://nos.lol',
	//'wss://relay.nostr.wirednet.jp'

	//参考 https://nostter.app/nevent1qqsy739r2nqh59p8w4ufwf7ujtp4qxdwjae3uexk5fhn3pf4ntreq8q77psv7
	//kind 0 (ユーザのプロフィール) と kind 10002 (利用中のリレーリスト) 特化
	'wss://directory.yabu.me', //kind0, 3, 10002特化
	//nevent1qvzqqqqqqypzpdc866l8lkwvncdwaqlgrsueg9tvlnm5mm2mpyg3jv8aam445rpqqqsqvjvg63yukccdpfx0285v72skgv59sykpce9jtn3ynmv6jzt0v6qa84j4e
	//nevent1qvzqqqqqqypzpdc866l8lkwvncdwaqlgrsueg9tvlnm5mm2mpyg3jv8aam445rpqqyg8wumn8ghj7mn0wd68ytnhd9hx2qpq7u249qm05a9t83meh7rqxlyxq3gdrtnfswapq2sxly29zxyk0xmq977qva
	'wss://purplepag.es', //https://purplepag.es/what
	'wss://relay.nostr.band',
	'wss://nos.lol'
	//kind:3
	// "wss://relayable.org",
];

// 1. Check for nostr: references (NIP-19)
// This finds profiles, events, notes, etc. in format nostr:npub1..., nostr:note1..., etc.
export function processNostrReferences(content: string) {
	const nostrRegex =
		/nostr:(npub1[a-z0-9]+|note1[a-z0-9]+|nevent1[a-z0-9]+|nprofile1[a-z0-9]+|naddr1[a-z0-9]+)/g;
	const nostrMatches = [...content.matchAll(nostrRegex)];

	// Add p-tags for npub/nprofile, e-tags for note/nevent, a-tags for naddr
	const newTags: string[][] = [];
	nostrMatches.forEach((match) => {
		const nostrRef = match[1];
		try {
			const decode = nip19.decode(nostrRef);
			switch (decode.type) {
				case 'npub':
					newTags.push(['p', decode.data]);
					break;
				case 'nprofile':
					newTags.push(['p', decode.data.pubkey]);
					break;
				case 'naddr':
					newTags.push([
						'a',
						`${decode.data.kind}:${decode.data.pubkey}:${decode.data.identifier || ''}`
					]);
					break;
				case 'note':
					newTags.push(['e', decode.data]);
					break;
				case 'nevent':
					newTags.push(['e', decode.data.id]);
					break;
			}
		} catch (e) {
			console.error('Error processing nostr reference:', e);
		}
	});

	return newTags;
}

// 2. Check for emojis (NIP-30)
export function processEmojis(content: string) {
	// Look for :emoji: patterns in the content
	const emojiRegex = /:([a-zA-Z0-9_]+):/g;
	const emojiMatches = [...content.matchAll(emojiRegex)];

	// Create emoji tags
	const emojiTags: string[][] = [];
	const processedEmojis = new Set(); // To avoid duplicates

	emojiMatches.forEach((match) => {
		const shortcode = match[1];
		if (!processedEmojis.has(shortcode)) {
			// In a real implementation, you would lookup the emoji URL
			// For now we just add a placeholder
			const emojiUrl = emojiList.get().find((emoji) => emoji[0] === shortcode)?.[1];
			if (emojiUrl) {
				emojiTags.push(['emoji', shortcode, emojiUrl]);
				processedEmojis.add(shortcode);
			}
		}
	});

	return emojiTags;
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
		const response: FileUploadResponse = await uploadFile(file, serverConfig.api_url, header, {
			content_type: file.type
		});
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
