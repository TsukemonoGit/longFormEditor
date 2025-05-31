<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';

	interface Props {
		icon?: () => any;

		name?: () => any;
		time?: () => any;

		content?: () => any;

		link?: string;
	}
	let {
		icon,
		name,
		time,

		content,
		link
	}: Props = $props();

	const clickLink = () => {
		if (!link) return;
		window.open(link, '_blank', 'noreferrer');
	};
</script>

<div class="border-primary-500 relative my-1 rounded-md border p-1 whitespace-nowrap">
	<button
		type="button"
		onclick={clickLink}
		title={link || 'Open link'}
		class="btn-icon preset-tonal-primary absolute -top-1.5 -right-0.5 z-10 h-fit w-fit overflow-visible p-1"
		><ExternalLink size={16} /></button
	>
	<div class={' grid w-full  grid-cols-[auto_1fr] gap-0.5  overflow-x-hidden'}>
		{@render icon?.()}
		<div class="max-w-full overflow-hidden pt-1">
			<div class="flex w-full items-end overflow-x-hidden">
				<div class="flex max-w-full flex-wrap items-center overflow-hidden">
					{@render name?.()}
				</div>
				<div class="ml-auto w-fit text-xs">
					{@render time?.()}
				</div>
			</div>
			<div
				class="content overflow-x-hidden break-words whitespace-pre-wrap"
				style="word-break: break-word;"
			>
				{@render content?.()}
			</div>
		</div>
	</div>
</div>
