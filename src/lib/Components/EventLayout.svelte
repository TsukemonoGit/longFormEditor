<script lang="ts">
	interface Props {
		icon?: () => any;

		name?: () => any;
		time?: () => any;

		content?: () => any;
	}
	let {
		icon,
		name,
		time,

		content
	}: Props = $props();
</script>

<div class={'grid w-full grid-cols-[auto_1fr] gap-0.5 overflow-hidden p-1'}>
	{@render icon?.()}

	<div class="max-w-full overflow-hidden pt-1">
		<div class="flex w-full overflow-x-hidden align-middle">
			<div class="flex max-w-full flex-wrap items-center overflow-hidden">
				{@render name?.()}
			</div>
			<div class="ml-auto w-fit text-xs">
				{@render time?.()}
			</div>
		</div>

		<div
			class="content overflow-hidden break-words whitespace-pre-wrap"
			style="word-break: break-word;"
		>
			{@render content?.()}
		</div>
	</div>
</div>
