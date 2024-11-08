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
    await addTests("StreamingSound", [
        {
            name: "Create sound with `autoplay` option set",
            duration: 3,
            test: async () => {},
        },
    ]);
}
