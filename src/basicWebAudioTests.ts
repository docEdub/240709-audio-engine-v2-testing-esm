import { AbstractSound } from "@babylonjs/core/Audio/v2/abstractSound";
import { CreateAudioEngine } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";

import { Whisper } from "./whisper";

const logSpeechTextResults = false;
const downloadAudio = false;

const testSoundUrl = "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3";
const ac3SoundUrl = "https://amf-ms.github.io/AudioAssets/testing/ac3.ac3";
const mp3SoundUrl = "https://amf-ms.github.io/AudioAssets/testing/mp3-enunciated.mp3";

async function wait(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

let audioContext: OfflineAudioContext;

function resetAudioContext(duration: number): void {
    // Whisper requires 16kHz sample rate.
    audioContext = new OfflineAudioContext(2, duration * 16000, 16000);
}

async function soundEnded(sound: AbstractSound): Promise<void> {
    return new Promise<void>((resolve) => {
        // sound.onEndedObservable.addOnce(() => {
        resolve();
        // });
    });
}

const whisper = new Whisper();
let currentTest = "";
let sttOutput = "";

// Convert an AudioBuffer to a Blob using WAVE representation
function bufferToWave(abuffer, len) {
    var numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = new Array<any>(),
        i,
        sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
function make_download(abuffer, total_samples) {
    var new_file = URL.createObjectURL(bufferToWave(abuffer, total_samples));

    var download_link = document.createElement("a");
    download_link.href = new_file;
    var name = `${currentTest}.wav`;
    download_link.download = name;
    download_link.click();
}

async function assertSpeechEquals(expected: string): Promise<void> {
    const renderedBuffer = await audioContext?.startRendering();
    if (!renderedBuffer) {
        console.log("Failed to render audio buffer");
        return;
    }

    // console.log(`Rendered buffer length: ${renderedBuffer.length}`);

    if (downloadAudio) {
        make_download(renderedBuffer, renderedBuffer.length);
    }

    const audio = renderedBuffer.getChannelData(0);
    // console.log("js: audio loaded, size: " + audio.length);

    whisper.transcribe(audio);

    sttOutput = await whisper.getText();

    if (logSpeechTextResults) {
        console.log("raw sttOutput:", sttOutput);
    }

    // Remove the trailing [BLANK_AUDIO] added by whisper.
    sttOutput = sttOutput.replace("[BLANK_AUDIO]", "");

    // Remove spaces.
    sttOutput = sttOutput.replace(/\s+/g, "");

    // Remove punctuation, hyphens and parenthesis added by whisper.
    sttOutput = sttOutput.replace(/(\,|\.|\-|\(|\))/g, "");
    sttOutput = sttOutput.toLowerCase();

    if (sttOutput === expected) {
        console.log(`${currentTest} passed speech to text. Got: "${sttOutput}"`);
    } else {
        console.warn(`${currentTest} failed speech to text. Expected: "${expected}", Got: "${sttOutput}"`);

        // Download audio if test failed and `downloadAudio` flag is turned off.
        if (!downloadAudio) {
            make_download(renderedBuffer, renderedBuffer.length);
        }
    }
}

function startTest(name: string, duration: number = 10): void {
    console.log("");
    console.log(`${name} ...`);
    currentTest = name;

    resetAudioContext(duration);
}

function endTest(): void {
    console.log(`${currentTest} - done`);
}

export async function run() {
    await whisper.init();

    await test_1();
    await test_1b();
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
    await test_17();
    await test_17b();
    await test_18();
    await test_19();

    console.log("");
    console.log("All tests done.");
}

/**
 * Play sound, pause it, and resume it by calling play.
 */
async function test_19(): Promise<void> {
    startTest("test_19", 4);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });

    sound.play();

    audioContext.suspend(1).then(() => {
        sound.pause();
        audioContext.resume();
    });

    audioContext.suspend(2).then(() => {
        sound.play();
        audioContext.resume();
    });

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Play sound, pause it, and resume it.
 */
async function test_18(): Promise<void> {
    startTest("test_18", 4);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });

    sound.play();

    audioContext.suspend(1).then(() => {
        sound.pause();
        audioContext.resume();
    });

    audioContext.suspend(2).then(() => {
        sound.resume();
        audioContext.resume();
    });

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with sourceUrls set to ac3 and mp3 files, with sourceUrlsSkipCodecCheck set to true.
 * Should throw EncodingError on ac3 file in all browsers other than Safari.
 */
async function test_17b(): Promise<void> {
    startTest("test_17b");

    const engine = await CreateAudioEngine({ audioContext });

    try {
        const sound = await engine.createSound("", { sourceUrlsSkipCodecCheck: true, sourceUrls: [ac3SoundUrl, mp3SoundUrl], playbackRate: 1.3 });
    } catch (e) {
        console.log(`${currentTest} passed. Expected decoding error was thrown.`);

        endTest();
        return;
    }

    console.log(`${currentTest} failed. Expected decoding error was not thrown.`);

    endTest();
}

/**
 * Create sound with sourceUrls set to ac3 and mp3 files.
 */
async function test_17(): Promise<void> {
    startTest("test_17", 3);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrls: [ac3SoundUrl, mp3SoundUrl], playbackRate: 1.3 });

    sound.play();
    await soundEnded(sound);

    if (engine.formatIsValid("ac3")) {
        await assertSpeechEquals("ac3");
    } else {
        await assertSpeechEquals("mp3");
    }

    endTest();
}

/**
 * Create 2 sounds using same buffer and play them 500 ms apart.
 */
async function test_16(): Promise<void> {
    startTest("test_16", 4);

    const engine = await CreateAudioEngine({ audioContext });
    const sound1 = await engine.createSound("", { sourceUrl: testSoundUrl });
    const sound2 = await engine.createSound("", { sourceBuffer: sound1.buffer });
    sound1.play();

    audioContext.suspend(0.5).then(() => {
        sound2.play();
        audioContext.resume();
    });

    await soundEnded(sound1);
    await soundEnded(sound2);

    await assertSpeechEquals("001122");

    endTest();
}

/**
 * Create sound with sourceBuffer set.
 */
async function test_15(): Promise<void> {
    startTest("test_15", 3);

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
    startTest("test_14", 3);

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
    startTest("test_13", 3);

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
    startTest("test_12", 3);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play(null, 1);

    await soundEnded(sound);

    await assertSpeechEquals("12");

    endTest();
}

/**
 * Play two sounds, with the second sound's play waitTime set to 3.
 */
async function test_11(): Promise<void> {
    startTest("test_11", 6);

    const engine = await CreateAudioEngine({ audioContext });
    const sound1 = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound1.play();
    sound1.play(3);

    await soundEnded(sound1);

    await assertSpeechEquals("012012");

    endTest();
}

/**
 * Create sound with playbackRate set to 1.05 and pitch set to 200.
 */
async function test_10(): Promise<void> {
    startTest("test_10", 3);

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
    startTest("test_9", 3);

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
    startTest("test_8", 3);

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
    startTest("test_7", 5);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, loop: true, loopStart: 1, loopEnd: 2 });
    sound.play();

    audioContext.suspend(3.2).then(() => {
        sound.stop();
        audioContext.resume();
    });

    await soundEnded(sound);

    await assertSpeechEquals("011");

    endTest();
}

/**
 * Create sound with loop set to true.
 */
async function test_6(): Promise<void> {
    startTest("test_6", 6);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, loop: true });
    sound.play();

    audioContext.suspend(4.2).then(() => {
        sound.stop();
        audioContext.resume();
    });

    await soundEnded(sound);

    await assertSpeechEquals("0120");

    endTest();
}

/**
 * Create sound, call `play` on it twice, and call `stop` on it.
 */
async function test_5(): Promise<void> {
    startTest("test_5", 2);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();

    audioContext.suspend(0.5).then(() => {
        sound.play();
        audioContext.resume();
    });

    audioContext.suspend(1.2).then(() => {
        sound.stop();
        audioContext.resume();
    });

    await soundEnded(sound);

    await assertSpeechEquals("00");

    endTest();
}

/**
 * Create sound and call `play` on it twice.
 */
async function test_4(): Promise<void> {
    startTest("test_4", 4);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();

    audioContext.suspend(0.5).then(() => {
        sound.play();
        audioContext.resume();
    });

    await soundEnded(sound);

    await assertSpeechEquals("001122");

    endTest();
}

/**
 * Create sound and call `play` on it using `then`.
 */
async function test_3(): Promise<void> {
    startTest("test_3", 3);

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
 * Create sound and call `play` on it.
 */
async function test_2(): Promise<void> {
    startTest("test_2", 3);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl });
    sound.play();
    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}

/**
 * Create sound with `autoplay` and `duration` options set.
 */
async function test_1b(): Promise<void> {
    startTest("test_1b", 2);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, autoplay: true, duration: 2 });
    await soundEnded(sound);

    await assertSpeechEquals("01");

    endTest();
}

/**
 * Create sound with `autoplay` option set.
 */
async function test_1(): Promise<void> {
    startTest("test_1", 3);

    const engine = await CreateAudioEngine({ audioContext });
    const sound = await engine.createSound("", { sourceUrl: testSoundUrl, autoplay: true });
    await soundEnded(sound);

    await assertSpeechEquals("012");

    endTest();
}
