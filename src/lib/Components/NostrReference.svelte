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

<style lang="postcss">
	.nostr-placeholder {
		min-height: 8rem;
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed;
		border-color: light-dark(
			var(--color-surface-300) /* oklch(87% 0 0deg) = #d4d4d4 */,
			var(--color-surface-700) /* oklch(37.1% 0 0deg) = #404040 */
		);
		background-color: light-dark(
			var(--color-surface-50) /* oklch(98.5% 0 0deg) = #fafafa */,
			var(--color-surface-950) /* oklch(14.5% 0 0deg) = #0a0a0a */
		);
		border-radius: 8px;
		margin: 1rem 0;
	}

	.nostr-loading-container {
		min-height: 8rem;
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid;
		border-color: light-dark(var(--color-surface-200), var(--color-surface-800));

		border-radius: 8px;
		margin: 1rem 0;
	}

	.nostr-loading {
		color: var(--color-surface-500);
		font-style: italic;
		padding: 1rem;
		font-size: 1.1rem;
		text-align: center;
	}

	.nostr-error {
		color: var(--color-error-500);
		border-color: var(--color-error-500);

		font-style: italic;
		padding: 0.5rem;
		border: 1px solid;
		border-radius: 4px;
	}
</style>
