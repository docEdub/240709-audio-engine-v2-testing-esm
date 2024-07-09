
class AudioEngine {
    static get CurrentTime() {
        return BABYLON.Engine.audioEngine!.audioContext!.currentTime;
    }

    static get Latency() {
        const audioContext = BABYLON.Engine.audioEngine!.audioContext!;
        // NB: Safari does not support `outputLatency`.
        return audioContext.baseLatency + (audioContext.outputLatency ?? 0);
    }

    static get SoundTracks() {
        return BABYLON.Engine.LastCreatedScene!.soundTracks!;
    }
}
