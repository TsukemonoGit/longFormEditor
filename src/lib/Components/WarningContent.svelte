<!-- WarningContent.svelte -->
<script lang="ts">
	import { t } from '@konemono/svelte5-i18n';
	let { warningMessage = $bindable(), isWarning = $bindable() } = $props();
</script>

<div class="setting-item">
	<label class="checkbox-wrapper">
		<input type="checkbox" class="checkbox" bind:checked={isWarning} />
		<span class="checkbox-label">{$t('warning.button')}</span>
	</label>

	{#if isWarning}
		<div class="input-section">
			<label class="input-label" for="warning-input">
				{$t('warning.message')}
			</label>
			<input
				id="warning-input"
				type="text"
				class="text-input"
				bind:value={warningMessage}
				placeholder="Warning!"
			/>
		</div>
	{/if}
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

	.input-section {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--color-surface-50-950);
		margin-left: 30px;
	}

	.input-label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-surface-950-50);
		margin-bottom: 8px;
	}

	.text-input {
		width: 100%;
		padding: 12px 16px;

		border-radius: 8px;
		font-size: 14px;
		background-color: var(--color-surface-50-950);
		color: var(--color-surface-950-50);
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	.text-input:focus {
		outline: none;
		border-color: var(--color-primary-800-200);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.text-input::placeholder {
		color: var(--color-surface-400-600);
		opacity: 1;
	}

	/* レスポンシブ対応 */
	@media (max-width: 640px) {
		.input-section {
			margin-left: 0;
			padding-left: 0;
		}
	}

	/* アニメーション */
	.input-section {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
