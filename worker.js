class BumpinThatController {
  #canvas;

  get canvas() {
    return this.#canvas;
  }

  set canvas(value) {
    this.#canvas = value;
  }

  static makeBarColors(indexNumber, barHeight) {
    return {
      red: (indexNumber * barHeight) / 10,
      green: indexNumber * 4,
      blue: barHeight / 4 - 12,
    };
  }

  drawVisualizer({ bufferLength, dataArray }) {
    const ctx = this.canvas.getContext("2d");
    const barWidth = this.canvas.width / 2 / bufferLength;
    const iterator = new Array(bufferLength).fill(0);

    let barHeight;
    let firstX = 0;
    let secondX = bufferLength * barWidth;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    iterator.forEach((_number, i) => {
      barHeight = dataArray[i];

      const { red, green, blue } = BumpinThatController.makeBarColors(
        i,
        barHeight,
      );

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

      ctx.fillRect(
        this.canvas.width / 2 - firstX,
        this.canvas.height - barHeight,
        barWidth,
        barHeight,
      );

      firstX += barWidth;

      ctx.fillRect(
        secondX,
        this.canvas.height - barHeight,
        barWidth,
        barHeight,
      );

      secondX += barWidth;
    });
  }
}

const Bumpin = new BumpinThatController();

onmessage = function (e) {
  const { bufferLength, dataArray, canvas } = e.data;

  if (canvas) {
    Bumpin.canvas = canvas;
  } else {
    Bumpin.drawVisualizer({ bufferLength, dataArray });
  }
};
