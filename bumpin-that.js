/**
 * @file bumpin-that web component.
 * @link https://blog.logrocket.com/audio-visualizer-from-scratch-javascript/
 */

import { html, css, LitElement } from "https://esm.sh/lit";

export default class BumpinThat extends LitElement {
  constructor() {
    super();
    this.worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    this.audioCtx = new AudioContext();
    this.audioSource = null;
    this.analyzer = null;
    this.bufferLength = null;
    this.dataArray = null;

    this.visualizerType = "standard";
    this.fftSize;
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
    /**
     * @attribute visualizertype
     * @type {'split' | 'standard'} */
    visualizerType: { type: String },
    /**
     * fftSize property of the audio AnalyzerNode.
     * @type {number}
     * @link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
     */
    fftSize: { type: Number },
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
      block-size: 100%;
      display: block;
      inline-size: 100%;
      inset: 0;
      pointer-events: none;
      position: fixed;
    }
  `;

  get canvas() {
    return this.renderRoot.querySelector("#canvas");
  }

  get audio() {
    if (this.querySelector("audio")) {
      return this.querySelector("audio");
    }

    return this.renderRoot.querySelector("#audio");
  }

  static makeCanvasWidth() {
    return window.innerWidth;
  }

  static makeCanvasHeight() {
    return window.innerHeight;
  }

  setupWorker() {
    const canvas = this.canvas.transferControlToOffscreen();
    this.worker.postMessage({ canvas }, [canvas]);
  }

  setupAudioContext() {
    this.audioSource = this.audioCtx.createMediaElementSource(this.audio);
    this.analyzer = this.audioCtx.createAnalyser();
    this.audioSource.connect(this.analyzer);
    this.analyzer.connect(this.audioCtx.destination);
    if (this.fftSize) this.analyzer.fftSize = this.fftSize;
    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  setupAudioPlayer() {
    this.audio?.addEventListener("play", this.handleAudioPlay);
  }

  init() {
    this.setupWorker();
    this.setupAudioContext();
    this.setupAudioPlayer();
  }

  visualize = () => {
    this.analyzer.getByteFrequencyData(this.dataArray);
    this.worker.postMessage(
      {
        bufferLength: this.bufferLength,
        dataArray: this.dataArray,
        visualizerType: this.visualizerType,
      },
      {},
    );
    window.requestAnimationFrame(this.visualize);
  };

  handleAudioPlay = () => {
    this.visualize();
  };

  firstUpdated() {
    this.init();
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
