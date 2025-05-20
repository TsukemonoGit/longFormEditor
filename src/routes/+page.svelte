<script lang="ts">
	import Bytemd from '$lib/Components/Bytemd.svelte';
	import MenuList from '$lib/Components/MenuList.svelte';
	import * as Nostr from 'nostr-typedef';
	import LightSwitch from '$lib/Components/LightSwitch.svelte';
	import Footer from '$lib/Components/Footer.svelte';

	let event: Nostr.Event | null = $state(null);

	let showSidebar = $state(false);
</script>

<!-- ヘッダーにメニューボタン（モバイル用） -->
<div class="flex items-center justify-between border-b p-2 md:hidden">
	<button onclick={() => (showSidebar = true)} class="text-lg">☰ メニュー</button>
</div>

<!-- モバイル用サイドバー（オーバーレイ） -->
{#if showSidebar}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 bg-black/20 md:hidden"
		onclick={() => (showSidebar = false)}
	></div>
	<div
		class="dark:bg-surface-950 fixed top-0 left-0 z-50 h-full w-64 overflow-auto bg-white shadow-md md:hidden"
	>
		<div class="flex items-center justify-between border-b p-4">
			<span class="font-bold">メニュー</span>
			<button onclick={() => (showSidebar = false)}>✕</button>
		</div>
		<MenuList bind:event />
	</div>
{/if}

<!-- サイドバー（PCのみ表示） -->
<div class="l-0 t-0 fixed hidden h-full w-64 overflow-y-auto border-r pr-2 md:block">
	<MenuList bind:event />
</div>

<!-- メイン -->
<main class="h-full flex-1 overflow-y-auto pl-2 md:ml-64">
	<Bytemd {event} />
	<Footer />
</main>
