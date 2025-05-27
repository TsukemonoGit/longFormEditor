<!-- AddClientTag.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { t } from '@konemono/svelte5-i18n';

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

<div class="setting-item">
	<label class="checkbox-wrapper">
		<input type="checkbox" class="checkbox" bind:checked={addClientTag} onchange={onChange} />
		<span class="checkbox-label">{$t('addClientTag')}</span>
	</label>
</div>

<style>
	.setting-item {
		margin-bottom: 20px;
		padding: 16px;
		border: 1px solid var(--color-surface-300-700);
		border-radius: 8px;
		background-color: var(--color-surface-100-900);
		transition: all 0.2s ease;
	}

	.setting-item:hover {
		background-color: var(--color-surface-200-800);
		border-color: var(--color-surface-200-800);
	}

	.setting-item:last-child {
		margin-bottom: 0;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label {
		font-weight: 500;
		color: var(--color-surface-950-50);
		font-size: 15px;
		line-height: 1.4;
	}
</style>
