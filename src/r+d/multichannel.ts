

export function runMultichannelRnD() {
    const audioContext = new AudioContext();

    const destination = audioContext.destination;
    destination.channelCount = 6;
    console.log(`audioContext.destination.maxChannelCount = ${audioContext.destination.maxChannelCount}`);
}