/**
 * @file bumpin-that web component.
 * @link https://blog.logrocket.com/audio-visualizer-from-scratch-javascript/
 */

import { html, css, LitElement } from "https://esm.sh/lit";
import makeRGB from "./lib/makeRGB.js";
import iteratinator from "./lib/iterators.js";

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
    this.visual = "standard";
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
    /** @type {'split' | 'standard'} */
    visual: { type: String },
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
      block-size: 100dvh;
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

  drawGradient({ bufferLength, dataArray }) {
    const iterator = iteratinator(bufferLength);
    let gradients = [];

    iterator.forEach((_number, i) => {
      let barHeight = dataArray[i];
      let fill = makeRGB(i, barHeight);
      gradients.push(fill);
    });

    document.body.style.setProperty(
      "background-image",
      `radial-gradient(circle at top right, ${gradients.join(",")})`,
    );
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

  visualize = () => {
    this.analyzer.getByteFrequencyData(this.dataArray);
    this.worker.postMessage(
      {
        bufferLength: this.bufferLength,
        dataArray: this.dataArray,
        visual: this.visual,
      },
      {},
    );
    window.requestAnimationFrame(this.visualize);
  };

  lightShow = () => {
    this.analyzer.getByteFrequencyData(this.dataArray);
    this.drawGradient({
      bufferLength: this.bufferLength,
      dataArray: this.dataArray,
    });
    // TODO: need to keep state of play or pause and use that here to clean up when paused
    window.requestAnimationFrame(this.lightShow);
  };

  handleAudioPlay = () => {
    this.visualize();
    this.lightShow();
  };

  handleAudioPause = () => {
    document.body.style.background = "none";
  };

  firstUpdated() {
    this.init();
    this.audio?.addEventListener("play", this.handleAudioPlay);
    this.audio?.addEventListener("pause", this.handleAudioPause);
  }

  connectedCallback() {
    super.connectedCallback();
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
