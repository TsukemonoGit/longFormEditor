<script lang="ts">
	interface Props {
		servers: {
			name: string;
			url: string;
		}[];
		visible: Boolean;
		selectServer: (server: { name: string; url: string }) => void;
		closeModal: () => void;
	}
	let { servers = [], visible = $bindable(), selectServer, closeModal }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="server-selector-modal" class:visible>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeModal}></div>
	<div class="modal-content">
		<h3>サーバーを選択</h3>
		<div class="server-list">
			{#each servers as server}
				<button class="server-item" onclick={() => selectServer(server)}>
					{server.name}
				</button>
			{/each}
		</div>
		<button class="close-button" onclick={closeModal}>キャンセル</button>
	</div>
</div>

<style>
	.server-selector-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: none;
		z-index: 1000;
	}

	.visible {
		display: block;
	}

	.modal-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.modal-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		width: 300px;
		max-width: 90%;
	}

	h3 {
		margin-top: 0;
		text-align: center;
	}

	.server-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 16px 0;
	}

	.server-item {
		padding: 10px;
		text-align: left;
		background-color: #f0f0f0;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.server-item:hover {
		background-color: #e0e0e0;
	}

	.close-button {
		width: 100%;
		padding: 8px;
		background-color: #f44336;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
