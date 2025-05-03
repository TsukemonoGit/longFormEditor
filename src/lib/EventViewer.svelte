<script lang="ts">
import type { Event as NostrEvent} from 'nostr-tools';
let {event}=$props();

const  getProfile=(event:NostrEvent)=>{
try{
    return JSON.parse(event.content);
}catch(e){
    console.error("Error parsing event content:", e);
    return null;
}
}
</script>
{#if event.kind===0}
{@const profile=getProfile(event)}
{#if profile}
<div class="nostr-profile">
    <h2>{profile.name}</h2>
    <p>{profile.about}</p>
    {#if profile.picture}
        <img src={profile.picture} alt="Profile Picture" />
    {/if}
    </div>  
{:else}
{event.content}
{/if}

{:else}
{event.kind}
{event.content}
{/if}


