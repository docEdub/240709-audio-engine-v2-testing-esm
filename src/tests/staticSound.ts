import {
    ac3SoundUrl,
    addTests,
    assertSpeechEquals,
    createAudioEngine,
    createSound,
    createSoundBuffer,
    executeCallbackAtTime,
    mp3SoundUrl,
    resumeOnInteraction,
    soundEnded,
    testSoundUrl,
} from "../testUtils";

export async function run() {
    await addTests("StaticSound", [
        {
            name: "Create sound with `autoplay` option set",
            duration: 3,
            test: async () => {
                await createAudioEngine({ resumeOnInteraction: resumeOnInteraction });
                const sound = await createSound({ source: testSoundUrl, autoplay: true });

                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound with `autoplay` and `duration` options set",
            duration: 2,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, autoplay: true, duration: 2 });

                await soundEnded(sound);

                await assertSpeechEquals("01");
            },
        },
        {
            name: "Create sound and call `play` on it using `await`",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound and call `play` on it using `then`",
            duration: 3,
            test: async () => {
                await createAudioEngine();

                await new Promise<void>((resolve) => {
                    createSound({ source: testSoundUrl }).then(async (sound) => {
                        sound.play();
                        await soundEnded(sound);
                        resolve();
                    });
                });

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound and call `play` on it twice",
            duration: 4,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                executeCallbackAtTime(0.5, () => {
                    sound.play();
                });
                await soundEnded(sound);

                await assertSpeechEquals("001122");
            },
        },
        {
            name: "Create sound, call `play` on it twice, and call `stop` on it",
            duration: 2,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                executeCallbackAtTime(0.5, () => {
                    sound.play();
                });
                executeCallbackAtTime(1.2, () => {
                    sound.stop();
                });
                await soundEnded(sound);

                await assertSpeechEquals("00");
            },
        },
        {
            name: "Create sound with loop set to true",
            duration: 6,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, loop: true });

                sound.play();
                executeCallbackAtTime(4.2, () => {
                    sound.stop();
                });
                await soundEnded(sound);

                await assertSpeechEquals("0120");
            },
        },
        {
            name: "Create sound with loop set to true, loopStart to 1 and loopEnd to 2",
            duration: 5,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, loop: true, loopStart: 1, loopEnd: 2 });
                sound.play();
                executeCallbackAtTime(3.2, () => {
                    sound.stop();
                });
                await soundEnded(sound);
                await assertSpeechEquals("011");
            },
        },
        {
            name: "Create sound with pitch set to 200",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, pitch: 200 });

                sound.play();
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound with playbackRate set to 1.2",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, playbackRate: 1.2 });

                sound.play();
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound with playbackRate set to 1.05 and pitch set to 200",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, playbackRate: 1.05, pitch: 200 });

                sound.play();
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Play two sounds, with the second sound's play waitTime set to 3",
            duration: 6,
            test: async () => {
                await createAudioEngine();
                const sound1 = await createSound({ source: testSoundUrl });

                sound1.play();
                sound1.play(3);
                await soundEnded(sound1);

                await assertSpeechEquals("012012");
            },
        },
        {
            name: "Play sound with startOffset set to 1.0",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play(null, 1);
                await soundEnded(sound);

                await assertSpeechEquals("12");
            },
        },
        {
            name: "Play sound with duration set to 2.2",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play(null, null, 2.2);
                await soundEnded(sound);

                await assertSpeechEquals("01");
            },
        },
        {
            name: "Play sound and call stop with waitTime set to 2",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                sound.stop(2);
                await soundEnded(sound);

                await assertSpeechEquals("01");
            },
        },
        {
            name: "Create sound with sourceBuffer set",
            duration: 3,
            test: async () => {
                await createAudioEngine();
                const buffer = await createSoundBuffer({ source: testSoundUrl });
                const sound = await createSound({ source: buffer });

                sound.play();
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create 2 sounds using same buffer and play them 500 ms apart",
            duration: 4,
            test: async () => {
                await createAudioEngine();
                const sound1 = await createSound({ source: testSoundUrl });
                const sound2 = await createSound({ source: sound1.buffer });

                sound1.play();
                executeCallbackAtTime(0.5, () => {
                    sound2.play();
                });
                await soundEnded(sound1);
                await soundEnded(sound2);

                await assertSpeechEquals("001122");
            },
        },
        {
            name: "Create sound with sources set to ac3 and mp3 files",
            duration: 3,
            test: async () => {
                const engine = await createAudioEngine();
                const sound = await createSound({ source: [ac3SoundUrl, mp3SoundUrl], playbackRate: 1.3 });
                sound.play();
                await soundEnded(sound);
                if (engine.formatIsValid("ac3")) {
                    await assertSpeechEquals("ac3");
                } else {
                    await assertSpeechEquals("mp3");
                }
            },
        },
        {
            name: "Create sound with source array set to ac3 and mp3 files, with skipCodecCheck set to true",
            test: async () => {
                // Should throw EncodingError on ac3 file in all browsers other than Safari

                await createAudioEngine();

                try {
                    await createSound({ skipCodecCheck: true, source: [ac3SoundUrl, mp3SoundUrl], playbackRate: 1.3 });
                } catch (e) {
                    console.log(`    - Passed. Expected decoding error was thrown.`);
                    return;
                }
                console.log(`    - Failed. Expected decoding error was not thrown.`);
            },
        },
        {
            name: "Play sound, pause it, and resume it",
            duration: 4,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                executeCallbackAtTime(1, () => {
                    sound.pause();
                });
                executeCallbackAtTime(1.5, () => {
                    sound.resume();
                });
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Play sound, pause it, and resume it by calling play",
            duration: 4,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl });

                sound.play();
                executeCallbackAtTime(1, () => {
                    sound.pause();
                });
                executeCallbackAtTime(1.5, () => {
                    sound.play();
                });
                await soundEnded(sound);

                await assertSpeechEquals("012");
            },
        },
        {
            name: "Create sound with `maxInstances` set to 1",
            duration: 5,
            test: async () => {
                await createAudioEngine();
                const sound = await createSound({ source: testSoundUrl, maxInstances: 1 });

                sound.play();
                executeCallbackAtTime(1, () => {
                    sound.play();
                });
                await soundEnded(sound);

                await assertSpeechEquals("0012");
            },
        },
        {
            name: "Create sound with `maxInstances` set to 2",
            duration: 6,
            test: async () => {
                await createAudioEngine({ resumeOnInteraction: resumeOnInteraction });
                const sound = await createSound({ source: testSoundUrl, maxInstances: 2 });

                sound.play();
                executeCallbackAtTime(0.5, () => {
                    sound.play();
                });
                executeCallbackAtTime(2, () => {
                    sound.play();
                });
                await soundEnded(sound);

                // Breakdown of the speech output by instance:
                //           Instance 1: "0 1    "
                //           Instance 2: " 0 1 2 "
                //           Instance 3: "    0 12"
                await assertSpeechEquals("00110212");
            },
        },
    ]);
}
