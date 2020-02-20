let classifier;
let extractor;

let webcam;
let label = '';

let upButton;
let downBuntton;
let leftButton;
let rightButton;
let trainButton;

let xV = 1;
let yV = 0;

let v = 5;

let pos;

// When the model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
}

function webcamReady(){
  console.log('webcam is Ready!');
}

function gotResults(error, result) {
    if(error){
      console.error(error);
    }
    else{
      //console.log(result);
      label = result[0].label;
      classifier.classify(gotResults);
    }
}

function whileTraining(loss){
  if(loss == null){
    console.log("训练完成");
    classifier.classify(gotResults);
  }
  else{
    console.log(loss);
  }
}

function setDirection(){
  if(label == "up"){
    xV = 0;
    yV = -1 * v;
  }
  if(label == "down"){
    xV = 0;
    yV = 1 * v;
  }
  if(label == "left"){
    xV = -1 * v;
    yV = 0;
  }
  if(label == "right"){
    xV = 1 * v;
    yV = 0;
  }
}

function setup() {
  createCanvas(600, 600);
  frameRate(30);
  //创建一个webcam
  webcam = createCapture(VIDEO);
  webcam.size(200, 200)
  webcam.hide();
  //创建一个featureExtractor，使用 MobileNet
  const options = { numLabels: 4 };
  extractor = ml5.featureExtractor('MobileNet', options, modelLoaded);
  //
  classifier = extractor.classification(webcam, webcamReady);
  //创建捕捉按钮
  upButton = createButton('向上');
  downButton = createButton('向下');
  leftButton = createButton('向左');
  rightButton = createButton('向右');
  upButton.mousePressed(function(){
    classifier.addImage('up');
  });
  downButton.mousePressed(function(){
    classifier.addImage('down');
  });
  leftButton.mousePressed(function(){
    classifier.addImage('left');
  });
  rightButton.mousePressed(function(){
    classifier.addImage('right');
  });

  trainButton = createButton('TRAIN');
  trainButton.mousePressed(function(){
    classifier.train(whileTraining);
  });
  
  pos = createVector(width/2, height/2);

}

function draw() {
  background(200);
  image(webcam, 0, 0);
  textSize(36);
  textAlign(LEFT, BOTTOM);
  text(label, 0, height);
  fill(255);
  strokeWeight(4);
  stroke(0);
  ellipse(pos.x, pos.y, 20, 20);
  setDirection();
  pos.x = pos.x + xV;
  pos.y = pos.y + yV;
  if(pos.x > width){
    pos.x = 0;
  }
  if(pos.x < 0){
    pos.x = width;
  }
  if(pos.y > height){
    pos.y = 0;
  }
  if(pos.y < 0){
    pos.y = height;
  }
}

