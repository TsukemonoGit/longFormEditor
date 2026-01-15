// nostr-fetch-utils.ts
// Nostrノートを取得して表示するためのユーティリティ関数

import { nip19, type Filter } from 'nostr-tools';

// nostr:note1... 形式のNEIを解析してイベントIDを取得
export function parseNostrIdentifier(nei: string): string | null {
	// nostr:note1... 形式のリンクをチェック
	if (nei.startsWith('nostr:note1')) {
		try {
			// nostr: プレフィックスを削除
			const noteId = nei.replace('nostr:', '');
			// nip19 を使用してデコード
			const { type, data } = nip19.decode(noteId);

			if (type === 'note') {
				return data as string; // 16進数形式のイベントID
			}
		} catch (e) {
			console.error('Failed to parse Nostr identifier:', e);
		}
	}
	return null;
}

// ノート埋め込み用のHTMLを生成
export function createNoteEmbedHTML(note: any): string {
	if (!note) return '<div class="nostr-note-embed error">ノートの取得に失敗しました</div>';

	// 投稿日時をフォーマット
	const date = new Date(note.created_at * 1000);
	const dateStr = date.toLocaleString();

	// タイトルを取得（存在する場合）
	const titleTag = note.tags.find((tag: string[]) => tag[0] === 'title');
	const title = titleTag ? titleTag[1] : 'Untitled Note';

	// コンテンツの最初の数行を抽出（プレビュー用）
	const contentPreview = note.content.split('\n').slice(0, 3).join('\n');
	const hasMoreContent = note.content.split('\n').length > 3;

	// HTMLを構築
	return `
    <div class="nostr-note-embed">
      <div class="nostr-note-header">
        <h4 class="nostr-note-title">${escapeHTML(title)}</h4>
        <div class="nostr-note-meta">
          <span class="nostr-note-pubkey">${note.pubkey.substring(0, 8)}...</span>
          <span class="nostr-note-date">${dateStr}</span>
        </div>
      </div>
      <div class="nostr-note-content">
        ${escapeHTML(contentPreview)}
        ${hasMoreContent ? '<div class="nostr-note-more">...</div>' : ''}
      </div>
      <div class="nostr-note-footer">
        <a href="nostr:${nip19.noteEncode(note.id)}" class="nostr-note-link" target="_blank">
          ノートを見る
        </a>
      </div>
    </div>
  `;
}

// モーダルを表示するためのHTML生成
export function createNoteModalHTML(note: any): string {
	if (!note) return '<div class="nostr-modal-error">ノートの取得に失敗しました</div>';

	// 投稿日時をフォーマット
	const date = new Date(note.created_at * 1000);
	const dateStr = date.toLocaleString();

	// タイトルを取得（存在する場合）
	const titleTag = note.tags.find((tag: string[]) => tag[0] === 'title');
	const title = titleTag ? titleTag[1] : 'Untitled Note';

	// コンテンツ（マークダウン形式）
	const contentHTML = note.content;

	// HTMLを構築
	return `
    <div class="nostr-modal-content">
      <div class="nostr-modal-header">
        <h3 class="nostr-modal-title">${escapeHTML(title)}</h3>
        <div class="nostr-modal-meta">
          <span class="nostr-modal-pubkey">作者: ${note.pubkey.substring(0, 8)}...</span>
          <span class="nostr-modal-date">投稿日時: ${dateStr}</span>
        </div>
      </div>
      <div class="nostr-modal-body">
        ${escapeHTML(contentHTML)}
      </div>
      <div class="nostr-modal-footer">
        <a href="nostr:${nip19.noteEncode(note.id)}" class="nostr-modal-link" target="_blank">
          クライアントで開く
        </a>
      </div>
    </div>
  `;
}

// HTML特殊文字をエスケープ
function escapeHTML(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// カスタムスタイルシート
export const nostrEmbedStyles = `
  .nostr-note-embed {
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    padding: 12px;
    margin: 10px 0;
    background-color: #f8f9fa;
  }
  
  .nostr-note-header {
    margin-bottom: 8px;
  }
  
  .nostr-note-title {
    margin: 0 0 5px 0;
    font-size: 16px;
    font-weight: bold;
  }
  
  .nostr-note-meta {
    font-size: 12px;
    color: #657786;
    display: flex;
    gap: 8px;
  }
  
  .nostr-note-content {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 10px;
    white-space: pre-wrap;
  }
  
  .nostr-note-more {
    color: #657786;
    font-style: italic;
  }
  
  .nostr-note-footer {
    text-align: right;
  }
  
  .nostr-note-link {
    font-size: 13px;
    color: #1da1f2;
    text-decoration: none;
  }
  
  .nostr-note-link:hover {
    text-decoration: underline;
  }
  
  .nostr-note-embed.error {
    color: #e0245e;
    text-align: center;
    padding: 10px;
  }
  
  /* モーダル用スタイル */
  .nostr-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    justify-content: center;
    align-items: center;
  }
  
  .nostr-modal.active {
    display: flex;
  }
  
  .nostr-modal-container {
    background-color: white;
    border-radius: 8px;
    width: 80%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .nostr-modal-content {
    padding: 20px;
  }
  
  .nostr-modal-header {
    border-bottom: 1px solid #e1e8ed;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }
  
  .nostr-modal-title {
    margin: 0 0 10px 0;
    font-size: 20px;
  }
  
  .nostr-modal-meta {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #657786;
  }
  
  .nostr-modal-body {
    font-size: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
    margin-bottom: 20px;
  }
  
  .nostr-modal-footer {
    text-align: right;
    border-top: 1px solid #e1e8ed;
    padding-top: 15px;
  }
  
  .nostr-modal-link {
    color: #1da1f2;
    text-decoration: none;
    font-size: 14px;
  }
  
  .nostr-modal-link:hover {
    text-decoration: underline;
  }
  
  .nostr-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 24px;
    cursor: pointer;
    color: #657786;
  }
`;

export function createFilter(key: string[]): Filter {
	switch (key[0]) {
		case 'p':
			return {
				authors: [key[1]],
				kinds: [0]
			};

		case 'a': {
			const { kind, pubkey, identifier } = parseNaddr(key[1]);
			if (identifier) {
				return {
					kinds: [kind],
					authors: [pubkey],
					'#d': [identifier]
				};
			} else {
				return {
					kinds: [kind],
					authors: [pubkey]
				};
			}
		}
		default:
			return {
				ids: [key[1]],
				limit: 1
			};
	}
}

export function parseNaddr(adag: string): nip19.AddressPointer {
	const [kind, pubkey, ...identifierParts] = adag.split(':'); // referenceをコロンで分割, identifierの中に:が含まれる可能性がある
	const identifier = identifierParts.join(':'); // identifierの部分を結合する
	//console.log(identifier);
	return {
		kind: Number(kind),
		pubkey: pubkey,
		identifier: identifier ?? ''
	};
}

export function createKey(
	nostrID: string
): { tag: string[]; relays?: string[] | undefined } | undefined {
	try {
		const decoded = nip19.decode(nostrID);
		if (decoded.type === 'note') {
			return { tag: ['e', decoded.data] };
		} else if (decoded.type === 'naddr') {
			const { kind, pubkey, identifier, relays } = decoded.data;
			return { tag: ['a', `${kind.toString()}:${pubkey}:${identifier}`], relays: relays };
		} else if (decoded.type === 'npub') {
			return { tag: ['p', decoded.data] };
		} else if (decoded.type === 'nprofile') {
			return { tag: ['p', decoded.data.pubkey], relays: decoded.data.relays };
		} else if (decoded.type === 'nevent') {
			return { tag: ['e', decoded.data.id], relays: decoded.data.relays };
		} else {
			throw new Error('Invalid Nostr ID type');
		}
	} catch {
		return undefined;
	}
}

export function nostrIdLink(str: string): string {
	return `https://njump.me/${str.trim()}`;
}
