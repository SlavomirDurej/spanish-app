// Runs on the audio thread: turns the microphone signal into 16-bit PCM and posts it
// to the page in chunks of 1600 samples (100 ms at the 16 kHz the chat's AudioContext uses).
class PcmWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Int16Array(1600);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        const s = Math.max(-1, Math.min(1, ch[i]));
        this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf.slice().buffer);
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-worklet', PcmWorklet);
