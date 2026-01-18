// nostr-plugin.ts
import type { BytemdPlugin } from 'bytemd';
import { nostrIdLink } from '../nostr-fetch-utils';

import NostrReference from '$lib/Components/NostrReference.svelte';

const mentionRegex =
	/\bnostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))\b/g;

//const oldQupte = /#\[(\d+)\]/;

const nostrIdRegex =
	/(?:nostr:)?(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))/g;
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
			// for...of を使用して順次処理
			for (const el of Array.from(markdownBody.getElementsByClassName('nostrId'))) {
				const nostrId = el.textContent?.replace('nostr:', '').trim();
				if (!nostrId) continue;

				const container = document.createElement('div');
				container.className = 'nostr-component-container';

				el.parentNode?.replaceChild(container, el);

				// awaitを使用して完了を待つ
				mount(NostrReference, {
					target: container,
					props: { nostrId }
				});
			}
		},

		// Editor extensions (toolbar button for Nostr ID insertion)
		actions: [
			{
				title: 'Insert Nostr ID Reference',
				icon: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"  aria-hidden="true" role="img"  stroke="currentColor"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g ><path d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30s30-13.432 30-30S48.568 2 32 2zm11.762 44.508h-6.061L25.889 25.92v20.588h-5.65V17.492h6.357l11.518 20.231V17.492h5.648v29.016z" ></path></g></svg>',
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
