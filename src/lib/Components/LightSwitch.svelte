<script lang="ts">
	import { isDark } from '$lib/store.svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Moon, Sun } from 'lucide-svelte';
	import { onMount } from 'svelte';
	// Icons
	onMount(() => {
		const mode = window.matchMedia('(prefers-color-scheme: dark)');

		updateClass(mode.matches);
	});
	// Handle the change in state when toggled.
	function handleModeChange(checked: boolean) {
		// NOTE: implementation may differ per Tailwind config and framework:
		// https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
		console.log(checked);
		updateClass(checked);
	}
	const updateClass = (isDarkMode: boolean) => {
		document.documentElement.classList.toggle('dark', isDarkMode);
		isDark.set(isDarkMode);
	};
</script>

<Switch
	name="mode"
	controlActive="bg-surface-200"
	checked={isDark.get()}
	onCheckedChange={(e) => handleModeChange(e.checked)}
>
	{#snippet inactiveChild()}<Moon size="28" />{/snippet}
	{#snippet activeChild()}<Sun size="28" />{/snippet}
</Switch>
