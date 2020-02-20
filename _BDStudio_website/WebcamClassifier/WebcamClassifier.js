let classifier;
let webcam;
let result = '';

function setup() {
  createCanvas(600, 600);
  //创建一个webcam
  webcam = createCapture(VIDEO);
  webcam.hide();
  //创建一个Image Classifier，使用 MobileNet
  classifier = ml5.imageClassifier('MobileNet', webcam, modelLoaded);
  // Make a prediction with a selected image
  //classifier.classify(document.getElementById('image'), (err, results) => {
  //  console.log(results);
  //});
}

function draw() {
  background(200);
  image(webcam, 0, 0);
  textSize(36);
  textAlign(LEFT, BOTTOM);
  text(result, 0, height);
}

// When the model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
  classifier.predict(gotResult);
}

function gotResult(error, results) {
    if(error){
      console.error(error);
    }
    else{
      //console.log(results);
      result = results[0]['label'];
      classifier.predict(gotResult);
    }
}