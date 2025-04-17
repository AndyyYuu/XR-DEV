/* Background */
class Background {
  constructor() {
    this.container = document.querySelector(".js-background");

    this.init();
  }

  init() {
    this.resizeHandler();
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("resize", this.resizeHandler.bind(this));
  }

  resizeHandler() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.updateWords();
  }

  updateWords() {
    const el = this.container.querySelector(".js-word");

    const size = el.clientHeight;
    const total = Math.ceil(this.height / size) + 2;

    if (size > 0) {
      this.container.innerHTML = "";

      for (let i = 0; i < total; i++) {
        const word = el.cloneNode(true);

        word.style.setProperty("--i", `${i}`);
        word.style.setProperty("--position", String(Math.random()));
        word.style.setProperty("--duration", String(Math.random() * 2));

        this.container.appendChild(word);
      }
    }
  }
}

const background = new Background();

/* Cursor */
class Cursor {
  constructor() {
    this.mouse = {
      position: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
      smoothPosition: { x: 0, y: 0 },
      speed: 0
    };

    this.windowSize = Math.hypot(window.innerWidth, window.innerHeight);

    this.touch = { x: 0, y: 0 };

    this.scene = document.querySelector(".js-cursor-scene");
    this.wrapper = document.querySelector(".js-cursor-wrapper");
    this.points = [];

    this.init();
  }

  init() {
    this.resizeHandler();
    this.bindEvents();

    this.getMouseMovement();

    gsap.ticker.add(this.tick.bind(this));
  }

  bindEvents() {
    window.addEventListener("resize", this.resizeHandler.bind(this));
    window.addEventListener("mousemove", this.mouseHandler.bind(this));

    window.addEventListener("touchstart", this.touchHandler.bind(this));
    window.addEventListener("touchmove", this.touchHandler.bind(this));
  }

  resizeHandler() {
    this.windowSize = Math.hypot(window.innerWidth, window.innerHeight);

    this.scene.setAttribute("width", window.innerWidth + "px");
    this.scene.setAttribute("height", window.innerHeight + "px");
  }

  mouseHandler(e) {
    this.mouse.position.x = e.pageX;
    this.mouse.position.y = e.pageY;
  }

  touchHandler(e) {
    const touch = e.touches[0];

    this.mouse.position.x = touch.pageX;
    this.mouse.position.y = touch.pageY;
  }

  getMouseMovement() {
    const distX = this.mouse.position.x - this.mouse.last.x;
    const distY = this.mouse.position.y - this.mouse.last.y;
    const dist = Math.hypot(distX, distY);

    this.mouse.speed += (dist - this.mouse.speed) * 0.1;
    if (this.mouse.speed < 0.001) {
      this.mouse.speed = 0;
    }

    this.mouse.last = {
      x: this.mouse.position.x,
      y: this.mouse.position.y
    };

    setTimeout(this.getMouseMovement.bind(this), 20);
  }

  emitCursor() {
    const maxPoints = 1000;
    if (this.points.length < maxPoints) {
      for (let i = maxPoints - this.points.length; i > 0; i--) {
        const point = new Point(
          this.mouse.smoothPosition.x,
          this.mouse.smoothPosition.y,
          this
        );
        this.wrapper.prepend(point.el);
        this.points.push(point);
      }
    }
  }

  tick() {
    this.emitCursor();

    // Move mouse
    this.mouse.smoothPosition.x +=
      (this.mouse.position.x - this.mouse.smoothPosition.x) * 0.1;
    this.mouse.smoothPosition.y +=
      (this.mouse.position.y - this.mouse.smoothPosition.y) * 0.1;

    document.documentElement.style.setProperty(
      "--mouse-x",
      this.mouse.smoothPosition.x
    );
    document.documentElement.style.setProperty(
      "--mouse-y",
      this.mouse.smoothPosition.y
    );
  }
}

class Point {
  constructor(x = 0, y = 0, cursor) {
    this.cursor = cursor;

    this.anchor = { x, y };
    this.x = x;
    this.y = y;
    this.r =
      Math.random() *
      Math.min(this.cursor.mouse.speed, this.cursor.windowSize * 0.005);
    this.seed = Math.random() * 1000;
    this.freq = 0.05 + Math.random() * 0.1;
    this.amplitude = Math.random() * 10;

    this.el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.el.setAttribute("cx", this.x);
    this.el.setAttribute("cy", this.y);
    this.el.setAttribute("r", this.r);

    let color = Math.random();
    if (color < 0.33) {
      color = "#4cede1";
    } else if (color < 0.66) {
      color = "#ffc53a";
    } else {
      color = "#ff858d";
    }
    color += Math.round(Math.random() * 255).toString(16);
    this.el.setAttribute("fill", color);

    this.init();
  }

  init() {
    const self = this;

    gsap.to(this, {
      duration: 1 + Math.random() * 2,
      y: "-=" + Math.random() * 200 + "px",
      r: 0,
      ease: "power1.inOut",
      onUpdate: () => {
        self.x =
          self.anchor.x +
          Math.cos((gsap.ticker.frame + self.seed) * self.freq) *
            self.amplitude;
        self.el.setAttribute("cy", self.y);
        self.el.setAttribute("cx", self.x);
        self.el.setAttribute("r", self.r);
      },
      onComplete: this.kill.bind(this)
    });
  }

  kill() {
    const self = this;

    this.cursor.points.forEach((point, index) => {
      if (point === self) {
        self.cursor.points.splice(index, 1);
      }
    });

    self.el.remove();
  }
}

const cursor = new Cursor();

