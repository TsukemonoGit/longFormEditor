import type { BytemdPlugin } from 'bytemd';
import { visit } from 'unist-util-visit';
import type { Element, Properties } from 'hast';
import type { Processor } from 'unified';

export function targetBlankPlugin(): BytemdPlugin {
	return {
		rehype: (processor: Processor) =>
			processor.use(() => {
				return (tree: any) => {
					visit(tree, 'element', (node: any) => {
						if (node.tagName === 'a') {
							const props = node.properties as Properties;
							props.target = '_blank';
							props.rel = 'noreferrer noopener';
						}
					});
				};
			})
	};
}
