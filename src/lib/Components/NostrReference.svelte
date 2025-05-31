<!-- NostrReference.svelte -->
<script lang="ts">
	import { nostrIdLink } from '../nostr-fetch-utils';

	import EventViewer from './EventViewer.svelte';
	import { viewport } from '$lib/useViewportAction';
	import LoadEvent from './LoadEvent.svelte';
	import { t } from '@konemono/svelte5-i18n';

	let { nostrId } = $props();

	let hasLoaded = $state(false);
	const handleEnterViewport = () => {
		if (!hasLoaded) {
			//console.log('Loading Nostr event:', nostrId);
			hasLoaded = true;
		}
	};
</script>

<div use:viewport={null} onenterViewport={handleEnterViewport}>
	{#if !hasLoaded}
		<div class="nostr-placeholder">
			<div class="nostr-loading">{$t('loading_reference')}</div>
		</div>
	{:else}
		<LoadEvent {nostrId}>
			{#snippet content(event)}
				<EventViewer {event} link={nostrIdLink(nostrId)} />
			{/snippet}
			{#snippet loading()}
				<div class="nostr-loading-container">
					<div class="nostr-loading">{$t('loading_reference')}</div>
				</div>
			{/snippet}
			{#snippet error(errorMessage)}
				<div class="nostr-error">{errorMessage}</div>
			{/snippet}
		</LoadEvent>
	{/if}
</div>

<style>
	.nostr-placeholder {
		min-height: 8rem;
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed #ccc;
		border-radius: 8px;
		margin: 1rem 0;
		background-color: #f9f9f9;
	}

	.nostr-loading-container {
		min-height: 8rem;
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #ddd;
		border-radius: 8px;
		margin: 1rem 0;
		background-color: #fff;
	}

	.nostr-loading {
		color: #888;
		font-style: italic;
		padding: 1rem;
		font-size: 1.1rem;
		text-align: center;
	}

	.nostr-error {
		color: #e74c3c;
		font-style: italic;
		padding: 0.5rem;
		border: 1px solid #e74c3c;
		border-radius: 4px;
		background-color: #fdf2f2;
	}
</style>
