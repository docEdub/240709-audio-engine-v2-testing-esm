import { AbstractSound } from "@babylonjs/core/Audio/v2/abstractSound";
import { AbstractSoundInstance } from "@babylonjs/core/Audio/v2/abstractSoundInstance";
import { CreateAudioEngine } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";

const reuseAudioContext = true;
const testSoundUrl = "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3";

let audioContext: AudioContext | undefined = undefined;
if (reuseAudioContext) {
    audioContext = new AudioContext();
}

async function soundEnded(sound: AbstractSound): Promise<void> {
    return new Promise<void>((resolve) => {
        sound.onEndedObservable.addOnce(() => {
            resolve();
        });
    });
}

async function soundInstanceEnded(soundInstance: AbstractSoundInstance): Promise<void> {
    return new Promise<void>((resolve) => {
        soundInstance.onEndedObservable.addOnce(() => {
            resolve();
        });
    });
}

export async function run() {
    await test_1();
    await test_2();
    await test_3();
    await test_4();
    await test_5();
    console.log("All tests done.");
}

/**
 * Create sound, call `play` on it twice, and call `stop` on it.
 *
 * Should start two sound instances 500ms apart and stop them after the second "zero" is spoken.
 */
async function test_5(): Promise<void> {
    console.log("test_5 ...");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    await sound.play();

    setTimeout(() => {
        sound.play();
    }, 500);

    setTimeout(() => {
        sound.stop();
    }, 1200);

    await soundEnded(sound);
    console.log("test_5 - done");
}

/**
 * Create sound and call `play` on it twice.
 *
 * Should start two sound instances 500ms apart.
 */
async function test_4(): Promise<void> {
    console.log("test_4 ...");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    await sound.play();

    setTimeout(() => {
        sound.play();
    }, 500);

    await soundEnded(sound);
    console.log("test_4 - done");
}

/**
 * Create sound and call `play` on it using `then`.
 */
async function test_3(): Promise<void> {
    console.log("test_3 ...");

    const engine = await CreateAudioEngine({ audioContext });

    return new Promise<void>((resolve) => {
        engine.createSound("", { sourceUrl: testSoundUrl }).then(async (sound) => {
            sound.play();
            await soundEnded(sound);
            console.log("test_3 - done");
            resolve();
        });
    });
}

/**
 * Create sound and call `play` on it using `await`.
 */
async function test_2(): Promise<void> {
    console.log("test_2 ...");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    const instance = await sound.play();
    await soundInstanceEnded(instance);

    console.log("test_2 - done");
}

/**
 * Create sound with `autoplay` option set.
 */
async function test_1(): Promise<void> {
    console.log("test_1 ...");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, autoplay: true });
    await soundEnded(sound);

    console.log("test_1 - done");
}
