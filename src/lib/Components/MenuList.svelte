<script lang="ts">
	import { articles } from '$lib/store.svelte';
	import * as Nostr from 'nostr-typedef';

	let { event = $bindable() }: { event: Nostr.Event | null } = $props();
	const handleClickNew = () => {
		console.log('create new');
		event = null;
	};
	const getTitle = (ev: Nostr.Event): string | undefined => {
		return (
			ev.tags.find((tag) => tag[0] === 'title')?.[1] || ev.tags.find((tag) => tag[0] === 'd')?.[1]
		);
	};

	const handleClickArticle = (ev: Nostr.Event) => {
		console.log(ev);
		event = ev;
	};
</script>

<div class="my-1 flex flex-col gap-2 p-1">
	<button
		type="button"
		class="btn preset-filled-secondary-500 font-bold whitespace-break-spaces"
		onclick={handleClickNew}>+ create new</button
	>

	{#each articles.get() as article}
		<button
			class="btn preset-filled-primary-500 whitespace-break-spaces"
			onclick={() => handleClickArticle(article)}>{getTitle(article)}</button
		>
	{/each}
</div>
