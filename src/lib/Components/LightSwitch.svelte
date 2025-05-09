<script lang="ts">
	import { isDark } from '$lib/store.svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Moon, Sun } from 'lucide-svelte';
	import { onMount } from 'svelte';
	const SAVENAME = 'theme';

	// Icons
	onMount(() => {
		// Check localStorage first
		const savedTheme = window.localStorage.getItem(SAVENAME);

		if (savedTheme !== null) {
			// Use saved theme preference if available
			const isDarkMode = savedTheme === 'dark';
			updateClass(isDarkMode);
		} else {
			// Fall back to system preference if no saved theme
			const mode = window.matchMedia('(prefers-color-scheme: dark)');
			updateClass(mode.matches);
			// Save the initial theme
			window.localStorage.setItem(SAVENAME, mode.matches ? 'dark' : 'light');
		}
	});

	// Handle the change in state when toggled.
	function handleModeChange(checked: boolean) {
		updateClass(checked);
		// Save the preference to localStorage
		window.localStorage.setItem(SAVENAME, checked ? 'dark' : 'light');
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
	{#snippet inactiveChild()}<Moon size="14" />{/snippet}
	{#snippet activeChild()}<Sun size="14" />{/snippet}
</Switch>
