declare const Module: any;

const WhisperModule = Module;

let instance = null;

export class Whisper {
    public transcribe(): void {
        if (!instance) {
            instance = new WhisperModule.init("whisper.bin");

            if (instance) {
                console.log("js: whisper initialized, instance: " + instance);
            }
        }
    }
}
