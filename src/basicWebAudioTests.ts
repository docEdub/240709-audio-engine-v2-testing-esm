import { AbstractSound } from "@babylonjs/core/Audio/v2/abstractSound";
import { AbstractSoundInstance } from "@babylonjs/core/Audio/v2/abstractSoundInstance";
import { CreateAudioEngine } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";

const reuseAudioContext = true;
const testSoundUrl = "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3";

const logSpeechTextResults = false;

declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

function createSpeechToTextConverter(): any {
    if (webkitSpeechRecognition) {
        return new webkitSpeechRecognition();
    }
    if (SpeechRecognition) {
        return new SpeechRecognition();
    }
    return null;
}

async function wait(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

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

let speechToText: any;
let currentTest = "";
let sttOutput = "";

async function assertSpeechEquals(expected: string): Promise<void> {
    // Wait for the speech to text API to finish processing.
    await wait(0.75);

    speechToText.stop();
    sttOutput = sttOutput.replace(/\s+/g, "");

    if (logSpeechTextResults) {
        console.log("final sttOutput:", sttOutput);
    }

    if (sttOutput === expected) {
        console.log(`${currentTest} passed.`);
    } else {
        console.warn(`${currentTest} failed. Expected: "${expected}", Got: "${sttOutput}"`);
    }
}

function startTest(name: string): void {
    console.log("");
    console.log(`${name} ...`);
    currentTest = name;

    speechToText = createSpeechToTextConverter();
    speechToText.lang = "en-US";
    speechToText.continuous = true;
    speechToText.interimResults = true;

    const onResult = (event: any) => {
        sttOutput = "";
        for (let i = 0; i < event.results.length; ++i) {
            const text = event.results[i][0].transcript;
            sttOutput += text;
        }
        if (logSpeechTextResults) {
            console.log("sttOutput:", sttOutput);
        }
    };

    speechToText.addEventListener("result", onResult);

    speechToText.start();
}

function endTest(): void {
    console.log(`${currentTest} - done`);
}

export async function run() {
    await test_1();
    await test_2();
    await test_3();
    await test_4();
    await test_5();
    await test_6();
    await test_7();
    await test_8();
    await test_9();
    await test_10();
    await test_11();
    await test_12();
    await test_13();
    await test_14();
    await test_15();
    await test_16();

    console.log("");
    console.log("All tests done.");

    // speechToText.stop();
    // speechToText.removeEventListener("result", onResult);
}

/**
 * Create 2 sounds using same buffer and play them 500 ms apart.
 */
async function test_16(): Promise<void> {
    startTest("test_16");

    const engine = await CreateAudioEngine({ audioContext });
    const sound1 = await engine.createSound("", { sourceUrl: testSoundUrl });
    const sound2 = await engine.createSound("", { sourceBuffer: sound1.buffer });
    sound1.play();

    setTimeout(() => {
        sound2.play();
    }, 500);

    await soundEnded(sound1);
    await soundEnded(sound2);

    await assertSpeechEquals("001122");

    endTest();
}

/**
 * Create sound with sourceBuffer set.
 */
async function test_15(): Promise<void> {
    startTest("test_15");

    const engine = await CreateAudioEngine({ audioContext });
    const buffer = await engine.createSoundBuffer({ sourceUrl: testSoundUrl });
    const sound = await engine.createSound("", { sourceBuffer: buffer });
    await sound.play();

    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Play sound and call stop with waitTime set to 1.5.
 */
async function test_14(): Promise<void> {
    startTest("test_14");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();
    sound.stop(1.5);

    await soundEnded(sound);

    await assertSpeechEquals("01");

    endTest();
}

/**
 * Play sound with duration set to 2.2.
 */
async function test_13(): Promise<void> {
    startTest("test_13");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play(null, null, 2.2);

    await soundEnded(sound);

    await assertSpeechEquals("01");

    endTest();
}

/**
 * Play sound with startOffset set to 1.0.
 */
async function test_12(): Promise<void> {
    startTest("test_12");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play(null, 1);

    await soundEnded(sound);

    await assertSpeechEquals("12");

    endTest();
}

/**
 * Play two sounds, with the second sound's play waitTime set to 1.5.
 */
async function test_11(): Promise<void> {
    startTest("test_11");

    const engine = await CreateAudioEngine({ audioContext });
    const sound1 = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound1.play();
    sound1.play(1.5);

    await soundEnded(sound1);

    await assertSpeechEquals("010212");

    endTest();
}

/**
 * Create sound with playbackRate set to 1.05 and pitch set to 200.
 */
async function test_10(): Promise<void> {
    startTest("test_10");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, playbackRate: 1.05, pitch: 200 });
    sound.play();

    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with playbackRate set to 1.2.
 */
async function test_9(): Promise<void> {
    startTest("test_9");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, playbackRate: 1.2 });
    sound.play();

    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with pitch set to 200.
 */
async function test_8(): Promise<void> {
    startTest("test_8");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, pitch: 300 });
    sound.play();

    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with loop set to true, loopStart to 1 and loopEnd to 2.
 */
async function test_7(): Promise<void> {
    startTest("test_7");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, loop: true, loopStart: 1, loopEnd: 2 });
    sound.play();

    setTimeout(() => {
        sound.stop();
    }, 3200);

    await soundEnded(sound);

    await assertSpeechEquals("011");

    endTest();
}

/**
 * Create sound with loop set to true.
 */
async function test_6(): Promise<void> {
    startTest("test_6");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, loop: true });
    sound.play();

    setTimeout(() => {
        sound.stop();
    }, 4200);

    await soundEnded(sound);

    await assertSpeechEquals("0120");

    endTest();
}

/**
 * Create sound, call `play` on it twice, and call `stop` on it.
 */
async function test_5(): Promise<void> {
    startTest("test_5");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();

    setTimeout(() => {
        sound.play();
    }, 500);

    setTimeout(() => {
        sound.stop();
    }, 1200);

    await soundEnded(sound);

    await assertSpeechEquals("00");

    endTest();
}

/**
 * Create sound and call `play` on it twice.
 */
async function test_4(): Promise<void> {
    startTest("test_4");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();

    setTimeout(() => {
        sound.play();
    }, 500);

    await soundEnded(sound);

    await assertSpeechEquals("001122");

    endTest();
}

/**
 * Create sound and call `play` on it using `then`.
 */
async function test_3(): Promise<void> {
    startTest("test_3");

    const engine = await CreateAudioEngine({ audioContext });

    return new Promise<void>((resolve) => {
        engine.createSound("", { sourceUrl: testSoundUrl }).then(async (sound) => {
            sound.play();
            await soundEnded(sound);

            await assertSpeechEquals("012");

            endTest();
            resolve();
        });
    });
}

/**
 * Create sound and call `play` on it using `await`.
 */
async function test_2(): Promise<void> {
    startTest("test_2");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    const instance = sound.play();
    await soundInstanceEnded(instance);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with `autoplay` option set.
 */
async function test_1(): Promise<void> {
    startTest("test_1");

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, autoplay: true });
    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}
