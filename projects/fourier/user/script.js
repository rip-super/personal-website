const USER_DRAWING = 0;
const FOURIER_DRAWING = 1;

let userDrawnPoints = [];
let fourierCoefficients;
let animationTime = 0;
let epicyclePath = [];
let currentDrawing = [];
let currentState = -1;

class Complex {
  constructor(realPart, imaginaryPart) {
    this.realPart = realPart;
    this.imaginaryPart = imaginaryPart;
  }

  add(complexNum) {
    this.realPart += complexNum.realPart;
    this.imaginaryPart += complexNum.imaginaryPart;
  }

  mult(complexNum) {
    const realPart = this.realPart * complexNum.realPart - this.imaginaryPart * complexNum.imaginaryPart;
    const imaginaryPart = this.realPart * complexNum.imaginaryPart + this.imaginaryPart * complexNum.realPart;
    return new Complex(realPart, imaginaryPart);
  }
}

function computeFourierTransform(points) {
  const coefficients = [];
  const N = points.length;
  for (let k = 0; k < N; k++) {
    let sum = new Complex(0, 0);
    for (let n = 0; n < N; n++) {
      const phi = (TWO_PI * k * n) / N;
      const c = new Complex(cos(phi), -sin(phi));
      sum.add(points[n].mult(c));
    }
    sum.realPart = sum.realPart / N;
    sum.imaginaryPart = sum.imaginaryPart / N;

    let freq = k;
    let amp = sqrt(sum.realPart * sum.realPart + sum.imaginaryPart * sum.imaginaryPart);
    let phase = atan2(sum.imaginaryPart, sum.realPart);
    coefficients[k] = { realPart: sum.realPart, imaginaryPart: sum.imaginaryPart, freq, amp, phase };
  }
  return coefficients;
}

function mousePressed() {
  currentState = USER_DRAWING;
  currentDrawing = [];
  userDrawnPoints = [];
  animationTime = 0;
  epicyclePath = [];
}

function mouseReleased() {
  currentState = FOURIER_DRAWING;
  const skip = 1;
  for (let i = 0; i < currentDrawing.length; i += skip) {
    userDrawnPoints.push(new Complex(currentDrawing[i].x, currentDrawing[i].y));
  }
  fourierCoefficients = computeFourierTransform(userDrawnPoints);

  fourierCoefficients.sort((a, b) => b.amp - a.amp);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  fill(255);
  textAlign(CENTER);
  textSize(64);
  textFont('Poppins');
  textStyle(BOLD);
  text("Draw Something!", width / 2, height / 2);
  textSize(32);
  text("(In one continuous motion)", width / 2, height / 2 + 50);
}

function epicycles(x, y, rotation, coefficients) {
  for (let i = 0; i < coefficients.length; i++) {
    let prevX = x;
    let prevY = y;
    let freq = coefficients[i].freq;
    let radius = coefficients[i].amp;
    let phase = coefficients[i].phase;
    x += radius * cos(freq * animationTime + phase + rotation);
    y += radius * sin(freq * animationTime + phase + rotation);

    stroke(255, 100);
    noFill();
    ellipse(prevX, prevY, radius * 2);
    stroke(255);
    line(prevX, prevY, x, y);
  }
  return createVector(x, y);
}

function draw() {
  if (currentState == USER_DRAWING) {
    background(0);
    let point = createVector(mouseX - width / 2, mouseY - height / 2);
    currentDrawing.push(point);
    strokeWeight(2);
    stroke(255);
    noFill();
    beginShape();
    for (let currentPoint of currentDrawing) {
      vertex(currentPoint.x + width / 2, currentPoint.y + height / 2);
    }
    endShape();
  } else if (currentState == FOURIER_DRAWING) {
    background(0);
    let currentPoint = epicycles(width / 2, height / 2, 0, fourierCoefficients);
    epicyclePath.unshift(currentPoint);

    beginShape();
    noFill();
    strokeWeight(2);
    stroke(5, 203, 252);
    for (let i = 0; i < epicyclePath.length; i++) {
      vertex(epicyclePath[i].x, epicyclePath[i].y);
    }
    endShape();

    const deltaTime = TWO_PI / fourierCoefficients.length;
    animationTime += deltaTime;

    if (animationTime > TWO_PI) {
      animationTime = 0;
      epicyclePath = [];
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  fill(255);
  textAlign(CENTER);
  textSize(64);
  textFont('Poppins');
  textStyle(BOLD);
  text("Draw Something!", width / 2, height / 2);
  textSize(32);
  text("(In one continuous motion)", width / 2, height / 2 + 50);
}