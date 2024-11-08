import { AbstractAudioEngine } from "@babylonjs/core/Audio/v2/abstractAudioEngine";
import { AbstractSound } from "@babylonjs/core/Audio/v2/abstractSound";
import { StaticSound } from "@babylonjs/core/Audio/v2/staticSound";
import { StaticSoundBuffer } from "@babylonjs/core/Audio/v2/staticSoundBuffer";
import { StreamingSound } from "@babylonjs/core/Audio/v2/streamingSound";
import { CreateAudioEngineAsync, IWebAudioEngineOptions } from "@babylonjs/core/Audio/v2/webAudio/webAudioEngine";
import { CreateSoundAsync, CreateSoundBufferAsync, IWebAudioStaticSoundBufferOptions, IWebAudioStaticSoundOptions } from "@babylonjs/core/Audio/v2/webAudio/webAudioStaticSound";
import { CreateStreamingSoundAsync, IWebAudioStreamingSoundOptions } from "@babylonjs/core/Audio/v2/webAudio/webAudioStreamingSound";
import { Nullable } from "@babylonjs/core/types";
import { Whisper } from "./whisper";

const useOfflineAudioContext = false;
const reuseAudioContext = true; // Requires a user interaction on the page for each test.
const logSpeechTextResults = false;
const downloadAudio = false;

export const resumeOnInteraction = true;

export const testSoundUrl = "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3";
export const ac3SoundUrl = "https://amf-ms.github.io/AudioAssets/testing/ac3.ac3";
export const mp3SoundUrl = "https://amf-ms.github.io/AudioAssets/testing/mp3-enunciated.mp3";

let audioContext: AudioContext | OfflineAudioContext;
let audioEngine: AbstractAudioEngine;

function resetAudioContext(duration: number): void {
    if (useOfflineAudioContext) {
        // Whisper requires 16kHz sample rate.
        audioContext = new OfflineAudioContext(2, duration * 16000, 16000);
    } else if (reuseAudioContext) {
        audioContext = new AudioContext();
    }
}

export async function createAudioEngine(options: Nullable<IWebAudioEngineOptions> = null): Promise<AbstractAudioEngine> {
    if (!options) {
        options = {};
    }
    options.audioContext = audioContext;

    audioEngine = await CreateAudioEngineAsync(options);

    return audioEngine;
}

export async function createSound(options: IWebAudioStaticSoundOptions): Promise<StaticSound> {
    return await CreateSoundAsync("", audioEngine, options);
}

export async function createSoundBuffer(options: IWebAudioStaticSoundBufferOptions): Promise<StaticSoundBuffer> {
    return await CreateSoundBufferAsync(audioEngine, options);
}

export async function createStreamingSound(options: IWebAudioStreamingSoundOptions): Promise<StreamingSound> {
    return await CreateStreamingSoundAsync("", audioEngine, options);
}

export async function soundEnded(sound: AbstractSound): Promise<void> {
    return new Promise<void>((resolve) => {
        if (audioContext instanceof OfflineAudioContext) {
            resolve();
        } else if (audioContext instanceof AudioContext || audioContext === undefined) {
            sound.onEndedObservable.addOnce(() => {
                resolve();
            });
        }
    });
}

export function executeCallbackAtTime(time: number, callback: () => void): void {
    if (audioContext instanceof OfflineAudioContext) {
        audioEngine.pause(time).then(() => {
            callback();
            audioEngine.resume();
        });
    } else {
        setTimeout(() => {
            callback();
        }, time * 1000);
    }
}

let whisper: Nullable<Whisper> = null;
if (useOfflineAudioContext) {
}

let currentGroup = "";
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

export async function assertSpeechEquals(expected: string): Promise<void> {
    if (!(audioContext instanceof OfflineAudioContext)) {
        console.log(`    - Done. Expected: "${expected}"`);
        return;
    }

    if (!whisper) {
        throw new Error("Whisper.cpp not initialized");
    }

    const renderedBuffer = await audioContext.startRendering();
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
        console.log(`    - Passed speech to text. Got: "${sttOutput}"`);
    } else {
        console.warn(`    - Failed speech to text. Expected: "${expected}", Got: "${sttOutput}"`);

        // Download audio if test failed and `downloadAudio` flag is turned off.
        if (!downloadAudio) {
            make_download(renderedBuffer, renderedBuffer.length);
        }
    }
}

export async function beforeAllTests() {
    if (!whisper && useOfflineAudioContext) {
        console.log("");

        whisper = new Whisper();
        await whisper.init();

        console.log("");
    }
}

export async function afterAllTests() {
    console.log("");
    console.log("All tests done.");
    console.log("");
}

function beforeEachTest(name: string, duration: number = 10): void {
    resetAudioContext(duration);
}

function afterEachTest(): void {
    // console.log(`${currentTest} - done`);
}

export interface ITestConfig {
    name: string;
    duration?: number;
    test: () => Promise<void>;
}

export async function addTests(group: string, config: Array<ITestConfig>): Promise<void> {
    console.log("");

    let i = 1;
    for (const testConfig of config) {
        const { name, duration, test } = testConfig;

        currentGroup = group;
        currentTest = name;

        console.log(`${currentGroup} [${i++} of ${config.length}] -> ${currentTest}`);

        beforeEachTest(name, duration);
        await test();
        afterEachTest();
    }
}
