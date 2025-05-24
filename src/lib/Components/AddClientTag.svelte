<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { addClientTag = $bindable() } = $props();
	onMount(() => {
		if (browser) {
			localStorage.getItem('clientTag') === 'true' ? (addClientTag = true) : (addClientTag = false);
		}
	});
	const onChange = () => {
		if (browser) {
			localStorage.setItem('clientTag', addClientTag ? 'true' : 'false');
		}
	};
</script>

<label class="mt-2 flex! items-center">
	<input
		type="checkbox"
		class="checkbox mr-1 h-5! w-5!"
		bind:checked={addClientTag}
		onchange={onChange}
	/>
	<div class="w-fit">Add Client Tag</div></label
>
