<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		class?: string;
		style?: string;
		title?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let { href, class: className = '', style = '', title, onclick, children }: Props = $props();
</script>

<a {href} target="_blank" rel="noopener noreferrer" class={className} {style} {title} {onclick}>
	{@render children?.()}
</a>
