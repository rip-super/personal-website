let x = [];
let fourierCoefficients;
let time = 0;
let path = [];
let isDrawingStarted = false;

class Complex {
    constructor(a, b) {
        this.realPart = a;
        this.imaginaryPart = b;
    }

    add(c) {
        this.realPart += c.realPart;
        this.imaginaryPart += c.imaginaryPart;
    }

    mult(c) {
        const realPart = this.realPart * c.realPart - this.imaginaryPart * c.imaginaryPart;
        const imaginaryPart = this.realPart * c.imaginaryPart + this.imaginaryPart * c.realPart;
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

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    fill(255);
    textAlign(CENTER);
    textSize(64);
    textFont('Poppins');
    textStyle(BOLD);
    text("Click to start!", width / 2, height / 2);
}

function mousePressed() {
    isDrawingStarted = true;
    background(0);
    const skip = 8;
    for (let i = 0; i < drawing.length; i += skip) {
        const c = new Complex(drawing[i].x, drawing[i].y);
        x.push(c);
    }
    fourierCoefficients = computeFourierTransform(x);
    fourierCoefficients.sort((a, b) => b.amp - a.amp);
    loop();
}

function epicycles(x, y, rotation, coefficients) {
    for (let i = 0; i < coefficients.length; i++) {
        let prevX = x;
        let prevY = y;
        let freq = coefficients[i].freq;
        let radius = coefficients[i].amp;
        let phase = coefficients[i].phase;
        x += radius * cos(freq * time + phase + rotation);
        y += radius * sin(freq * time + phase + rotation);

        stroke(255, 100);
        noFill();
        ellipse(prevX, prevY, radius * 2);
        stroke(255);
        line(prevX, prevY, x, y);
    }
    return createVector(x, y);
}

function startDrawing() {
    if (!drawing || drawing.length === 0) return;

    x = [];
    path = [];
    time = 0;

    const skip = 8;
    for (let i = 0; i < drawing.length; i += skip) {
        const c = new Complex(drawing[i].x, drawing[i].y);
        x.push(c);
    }

    fourierCoefficients = computeFourierTransform(x);
    fourierCoefficients.sort((a, b) => b.amp - a.amp);

    isDrawingStarted = true;
}

function draw() {
    if (!isDrawingStarted) return;

    background(0);

    let v = epicycles(width / 2, height / 2, 0, fourierCoefficients);

    path.unshift(v);
    if (path.length > fourierCoefficients.length) path.pop();

    stroke(5, 203, 252);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let i = 0; i < path.length; i++) {
        vertex(path[i].x, path[i].y);
    }
    endShape();

    const dt = TWO_PI / fourierCoefficients.length;
    time += dt;
    if (time > TWO_PI) time = 0;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
    fill(255);
    textAlign(CENTER);
    textSize(64);
    textFont('Poppins');
    textStyle(BOLD);
    text("Click to start!", width / 2, height / 2);
}