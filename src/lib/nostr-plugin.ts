// nostr-plugin.ts
import type { BytemdPlugin } from 'bytemd';
import { nostrIdLink } from './nostr-fetch-utils';

import NostrReference from './NostrReference.svelte';

const mentionRegex = /\bnostr:((note|npub|naddr|nevent|nprofile)1\w+)\b|#\[(\d+)\]/g;
const nostrIdRegex = /(?:nostr:)?((note|npub|naddr|nevent|nprofile)1\w+)/;
import { mount } from 'svelte';

// NIP-23 Nostr plugin for embedded long-form content
export function nostrPlugin(): BytemdPlugin {
	return {
		// Extend markdown parser
		remark: (processor) => {
			return processor.use(() => (tree: any) => {
				visit(tree, 'text', (node) => {
					const regex = mentionRegex;
					let match;
					const matches = [];

					// Find all Nostr links in text
					while ((match = regex.exec(node.value)) !== null) {
						matches.push({
							start: match.index,
							end: match.index + match[0].length,
							nostrId: match[1],
							url: `nostr:${match[1]}`
						});
					}

					if (matches.length === 0) return;

					// Transform matched links
					const children = [];
					let lastIndex = 0;

					for (const match of matches) {
						// Text before link
						if (match.start > lastIndex) {
							children.push({
								type: 'text',
								value: node.value.slice(lastIndex, match.start)
							});
						}

						// Transform Nostr link to link node with data attributes
						children.push({
							type: 'link',

							url: nostrIdLink(match.url),

							data: {
								hProperties: {
									className: 'nostrId',
									target: '_blank',
									rel: 'noopener noreferrer'
								}
							},
							children: [
								{
									type: 'text',
									value: `nostr: ${match.nostrId}`
								}
							]
						});

						lastIndex = match.end;
					}

					// Remaining text
					if (lastIndex < node.value.length) {
						children.push({
							type: 'text',
							value: node.value.slice(lastIndex)
						});
					}

					// Replace original node
					Object.assign(node, {
						type: 'paragraph',
						children,
						value: undefined
					});
				});
			});
		},

		// Viewer effect - runs after rendering
		viewerEffect: ({ markdownBody }) => {
			Array.from(markdownBody.getElementsByClassName('nostrId')).forEach(async (el) => {
				const nostrId = el.textContent?.replace('nostr:', '').trim();
				console.log(nostrId);
				if (!nostrId) return;

				// Create a container for our Svelte component
				const container = document.createElement('div');
				container.className = 'nostr-component-container';

				// Replace the link with our container
				el.parentNode?.replaceChild(container, el);

				// Mount the Svelte component
				mount(NostrReference, {
					target: container,
					props: { nostrId }
				});
			});
		},

		// Editor extensions (toolbar button for Nostr ID insertion)
		actions: [
			{
				title: 'Insert Nostr ID Reference',
				icon: 'N',
				handler: {
					type: 'action',
					click({ editor, appendBlock, codemirror }) {
						// Prompt for Nostr ID
						const nostrId = prompt('Enter Nostr ID (note, npub, naddr, nevent)');

						if (nostrId && nostrIdRegex.test(nostrId)) {
							console.log(nostrId, nostrIdRegex.test(nostrId || ''));
							// Insert text using editor API
							const insertion = `nostr:${nostrId}`;
							editor.replaceSelection(insertion);
						}
					}
				}
			}
		]
	};
}

// Simplified visit function for markdown AST traversal
function visit(tree: any, nodeType: string, visitor: (node: any) => void) {
	const visitNode = (node: any) => {
		if (node.type === nodeType) {
			visitor(node);
		}
		if (node.children) {
			for (const child of node.children) {
				visitNode(child);
			}
		}
	};
	visitNode(tree);
}
/* 
// Generate HTML for modal display
function createNoteModalHTML(note: any): string {
  if (!note) return '<div class="modal-error">ノートの取得に失敗しました</div>';
  
  // Format date
  const date = new Date(note.created_at * 1000);
  const dateStr = date.toLocaleString();
  
  // Get title if exists
  const titleTag = note.tags.find((tag: string[]) => tag[0] === 'title');
  const title = titleTag ? titleTag[1] : 'Untitled Note';
  
  // Format content
  const content = note.content.replace(/\n/g, '<br>');
  
  return `
    <div class="nostr-note-full">
      <h3>${escapeHTML(title)}</h3>
      <div class="nostr-note-meta">
        <span>作者: ${note.pubkey.substring(0, 8)}...</span>
        <span>日時: ${dateStr}</span>
      </div>
      <div class="nostr-note-full-content">
        ${escapeHTML(content)}
      </div>
    </div>
  `;
} */

// Escape HTML special characters
function escapeHTML(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
