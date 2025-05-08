<script lang="ts">
	import * as Nostr from 'nostr-typedef';
	let { event } = $props();

	const getProfile = (event: Nostr.Event) => {
		try {
			return JSON.parse(event.content);
		} catch (e) {
			console.error('Error parsing event content:', e);
			return null;
		}
	};
</script>

{#if event.kind === 0}
	{@const profile = getProfile(event)}
	{#if profile}
		<div class="nostr-profile">
			@{profile.name || profile.display_name || 'noname'}{#if profile.picture}<img
					class="h-6 w-6 object-contain"
					src={profile.picture}
					alt={profile.name || profile.display_name || 'noname'}
				/>{/if}
		</div>
	{:else}
		{event.content}
	{/if}
{:else}
	<div class=" m-1 w-full cursor-pointer rounded-md border border-cyan-700 p-1 text-left">
		<div class="flex justify-between">
			<div class="font-bold">kind:{event.kind}</div>
			<time datetime={new Date(event.created_at * 1000).toString()}
				>{new Date(event.created_at * 1000).toLocaleString()}</time
			>
		</div>

		<p>{event.content}</p>
	</div>
{/if}

<style>
	.nostr-profile {
		text-decoration: underline;
		color: blueviolet;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}
</style>
