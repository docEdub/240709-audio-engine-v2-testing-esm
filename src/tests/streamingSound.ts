import {
    ac3SoundUrl,
    addTests,
    assertSpeechEquals,
    createAudioEngine,
    createStreamingSound,
    executeCallbackAtTime,
    mp3SoundUrl,
    resumeOnInteraction,
    soundEnded,
    testSoundUrl,
} from "../testUtils";

const createSound = createStreamingSound;

export async function run() {
    await addTests("StreamingSound", [
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
    ]);
}
