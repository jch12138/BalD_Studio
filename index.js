let logoFont;
let logoPos;
let logoTextAlpha = 0;
let logoAlpha = 0;
let logoR = 100;
let logoIsLoaded = false;

let easing = 0.05;

let mousePos;
let offset;

function preload(){
    logoFont = loadFont('font/batmfa__.ttf');
}

function setup(){
    createCanvas(windowWidth, windowHeight);
    logoPos = createVector(width/2, height);
    mousePos = createVector(mouseX, mouseY);
}

function draw(){
    background(255);
    drawLogo();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    logoPos = createVector(width/2, logoPos.y);
}

function drawLogo(){
    mousePos = createVector(mouseX, mouseY);
    offset = p5.Vector.sub(mousePos, logoPos);
    offset.setMag(map(offset.mag(), 0, 100, 0, 8));
    if(logoPos.y <= height/2 + 3){
        noFill();
        logoAlpha += (160 - logoAlpha)*easing;
        stroke(0, 120, 220, logoAlpha);
        strokeWeight(logoR/4.47407);
        strokeCap(SQUARE);
        arc(width/2+offset.x*0.5, height/2+offset.y*0.5, logoR, logoR, HALF_PI, TWO_PI);
        arc(width/2+offset.x*0.8, height/2+offset.y*0.8, 2*logoR, 2*logoR, HALF_PI, TWO_PI-HALF_PI);
        arc(width/2+offset.x, height/2+offset.y, 3*logoR, 3*logoR, HALF_PI, TWO_PI-PI);
    }
    stroke(0, 0, 0, logoTextAlpha);
    strokeWeight(1);
    fill(0, 0, 0, logoTextAlpha);
    textSize(80);
    textAlign(CENTER, CENTER);
    textFont(logoFont);
    logoPos.y += (height/2 - logoPos.y)*easing;
    logoTextAlpha += (180 - logoTextAlpha)*easing;
    text('BalD Studio', logoPos.x-offset.x, logoPos.y-offset.y);
}

function logoInteract(){
    mousePos = createVector(mouseX, mouseY);
    //mousePosP = createVector(pmouseX, pmouseY);
    let offset = p5.Vector.sub(mousePos, logoPos);
    offset.setMag(map(offset.mag(), 0, 100, 0, 8));
    noFill();
    stroke(0, 120, 220, logoAlpha);
    strokeWeight(logoR/4.47407);
    strokeCap(SQUARE);
    arc(width/2+offset.x, height/2+offset.y, logoR, logoR, HALF_PI, TWO_PI);
    arc(width/2+offset.x, height/2+offset.y, 2*logoR, 2*logoR, HALF_PI, TWO_PI-HALF_PI);
    arc(width/2+offset.x, height/2+offset.y, 3*logoR, 3*logoR, HALF_PI, TWO_PI-PI);
    stroke(0, 0, 0, logoTextAlpha);
    strokeWeight(1);
    fill(0, 0, 0, logoTextAlpha);
    textSize(80);
    textAlign(CENTER, CENTER);
    textFont(logoFont);
    text('BalD Studio', logoPos.x-offset.x, logoPos.y-offset.y);
}