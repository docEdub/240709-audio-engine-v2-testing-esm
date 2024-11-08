import { CreateAudioEngineAsync } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";
import { CreateSoundBufferAsync } from "@babylonjs/core/Audio/v2/webAudio/webAudioStaticSound";
import { expect, test } from "@playwright/test";

test("StaticSoundBuffer", async ({ page }) => {
    console.log("Running WebAudioStaticSound tests...");

    const engine = await CreateAudioEngineAsync();
    const buffer = await CreateSoundBufferAsync(engine, { sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3" });

    expect(engine.mainOutput).toBeDefined();
    expect(buffer).toBeDefined();
});
