/**
 * @file bumpin-that web component.
 * @link https://blog.logrocket.com/audio-visualizer-from-scratch-javascript/
 */

import { html, css, LitElement } from "https://esm.sh/lit";

export default class BumpinThat extends LitElement {
  constructor() {
    super();
    this.worker = new Worker(new URL("./worker.js", import.meta.url));
    this.audioCtx = new AudioContext();
    this.audioSource = null;
    this.analyzer = null;
    this.bufferLength = null;
    this.dataArray = null;
    this.animate = this.animate.bind(this);
  }

  static tagName = "bumpin-that";

  static register() {
    if (!window.customElements.get(this.tagName)) {
      window.customElements.define(this.tagName, this);
    }
  }

  static properties = {
    /** URL for the audio source. */
    src: { type: String },
  };

  static styles = css`
    :host {
      all: unset;
      box-sizing: border-box;
      display: block;
    }

    *,
    *::after,
    *::before {
      box-sizing: border-box;
      margin: 0px;
      padding: 0px;
    }

    canvas {
      inline-size: 100%;
    }
  `;

  get canvas() {
    return this.renderRoot.querySelector("#canvas");
  }

  get audio() {
    if (!this.src) {
      return this.querySelector("audio");
    }

    return this.renderRoot.querySelector("#audio");
  }

  static makeCanvasWidth() {
    return window.innerWidth;
  }

  static makeCanvasHeight() {
    return window.innerHeight / 2;
  }

  init() {
    const canvas = this.canvas.transferControlToOffscreen();
    this.worker.postMessage({ canvas }, [canvas]);
    this.audioSource = this.audioCtx.createMediaElementSource(this.audio);
    this.analyzer = this.audioCtx.createAnalyser();
    this.audioSource.connect(this.analyzer);
    this.analyzer.connect(this.audioCtx.destination);
    // Not setting this to 128 makes the RGB calculations off.
    // Need to redo math for how to properly get red, green, and blue if we want 1024.
    this.analyzer.fftSize = 128;
    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  animate() {
    this.analyzer.getByteFrequencyData(this.dataArray);
    this.worker.postMessage(
      { bufferLength: this.bufferLength, dataArray: this.dataArray },
      {},
    );
    window.requestAnimationFrame(this.animate);
  }

  firstUpdated() {
    this.init();
    this.animate();
  }

  disconnectedCallback() {
    this.worker.terminate();
    super.disconnectedCallback();
  }

  render() {
    return html`
      <slot>
        <audio id="audio" controls crossorigin src="${this.src}">
          Your browser doesn't support audio.
        </audio>
      </slot>
      <canvas
        part="canvas"
        id="canvas"
        width="${BumpinThat.makeCanvasWidth()}"
        height="${BumpinThat.makeCanvasHeight()}"
        >Your browser doesn't support canvas.</canvas
      >
    `;
  }
}
