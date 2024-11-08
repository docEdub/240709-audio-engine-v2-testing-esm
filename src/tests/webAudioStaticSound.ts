import { CreateAudioEngineAsync } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";
import { CreateSoundBufferAsync } from "@babylonjs/core/Audio/v2/webAudio/webAudioStaticSound";
import { expect } from "@playwright/test";

export async function test() {
    console.log("Running WebAudioStaticSound tests...");

    const engine = await CreateAudioEngineAsync();
    const buffer = await CreateSoundBufferAsync(engine, { sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3" });

    expect(engine.mainOutput).toBeDefined();
    expect(buffer).toBeDefined();
}
