import { test } from "@playwright/test";

test("StaticSoundBuffer", async ({ page }) => {
    const BABYLON = await import("../src/tests/webAudioStaticSound");
    await BABYLON.test();
});
