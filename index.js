let logoFont;
let logoPos;
let logoTextAlpha = 0;
let logoAlpha = 0;
let logoR = 100;
let logoIsLoaded = false;

let easing = 0.05;

let particles =[];
let lines = [];

let frame0 = 0;

let mousePos;
let temp_offset;

function preload(){
	logoFont = loadFont('fonts/batmfa__.ttf');
}

function setup(){
    frameRate(60);
    createCanvas(windowWidth, windowHeight);
    logoPos = createVector(width/2, height);
    mousePos = createVector(mouseX, mouseY);
	setParticles();
}

function draw(){
    background(255);
	drawParticles();
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
    let ts = map(windowWidth, 400, 1920, 36, 80);
    textSize(ts);
    textAlign(CENTER, CENTER);
    textFont(logoFont);
    logoPos.y += (height/2 - logoPos.y)*easing;
    logoTextAlpha += (180 - logoTextAlpha)*easing;
	text('BalD Studio', logoPos.x-offset.x, logoPos.y-offset.y);
	textSize(ts*0.2);
	textFont('SimHei');
	text('对抗击新冠肺炎疫情斗争牺牲的烈士和逝世同胞表示深切哀悼', logoPos.x-offset.x, logoPos.y-offset.y+ts);
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

var seed = "BalDStudio";
var nums;
var maxLife = 100;
var noiseScale = 447.407;
var	simulationSpeed = 0.3;
var fadeFrame = 0;
var distribution;
var color_from;
var color_to;

function setParticles(){
	seed = millis();
	randomSeed(seed);
	noiseSeed(seed);
	nums = 250;
	distribution = nums;
	//Normal Color
	color_from = color('#30cfd0');
	color_to = color('#330867');
	noStroke();
	smooth();
	
	for(var i = 0; i < nums; i++){
		var p = new Particle();
		p.pos.x = -50;
		p.pos.y = height/2 + int(random(-distribution, distribution));
		particles[i] = p;
	}
	
	fill(color(665));
}

function drawParticles(){
	++fadeFrame;
	if(fadeFrame % 5 == 0){
		
		blendMode(DIFFERENCE);
		fill(1, 1, 1);
		rect(0,0,width,height);

		blendMode(LIGHTEST);
		//blendMode(DARKEST); //looks terrible. stutters
		fill(0);
		rect(0,0,width,height);
	}
	
	blendMode(BLEND);
	
	for(var i = 0; i < nums; i++){
		var iterations = map(i,55,nums,15,20);
		var radius = map(i,0,nums,10,15);
		
		particles[i].move(iterations);
		particles[i].checkEdge();
		
		var alpha = 455;
		
		var particle_heading = particles[i].vel.heading()/PI;
		if(particle_heading < 0){
				particle_heading *= -1;
		}
		var particle_color = lerpColor(particles[i].color1, particles[i].color2, particle_heading);
		
		var fade_ratio; //TODO
		fade_ratio = min(particles[i].life * 5 / maxLife, 1);
		fade_ratio = min((maxLife - particles[i].life) * 5 / maxLife, fade_ratio);

		fill(red(particle_color), green(particle_color), blue(particle_color), alpha * fade_ratio);
		particles[i].display(radius);
	} 
}






class Particle{
	constructor(){
		this.vel = createVector(0, 0);
		this.pos = createVector(0, height/2 + int(random(-distribution, distribution)));
		this.life = random(0, maxLife);
		this.flip = int(random(0,2)) * 2 - 1;
		this.color1 = this.color2 = color('black');
		
		if(int(random(3)) <= 2){
			//this.color1 = color('palegreen');
			//this.color2 = color('cyan');
			this.color1 = color_from;
			this.color2 = color_to;
		}
	}
	
	move(iterations){
		if((this.life -= 0.016066) < 0)
			this.respawnSide();
		
		while(iterations > 0){
			var transition = map(this.pos.y, 0.2*height, 0.8*height, 0, 1);
			var angle = noise(this.pos.x/noiseScale, this.pos.y/noiseScale)*transition*TWO_PI*noiseScale;
			//var angle = noise(this.pos.x/noiseScale, this.pos.y/noiseScale)*1*TWO_PI*noiseScale;
			//var transition = map(this.pos.y, height/5, height-padding_top, 0, 1, true);
			//var angle = HALF_PI;
			//angle += (noise(this.pos.x/noiseScale, this.pos.y/noiseScale)-0.5)*transition*TWO_PI*noiseScale/66;

			this.vel.x = cos(PI - angle);
			this.vel.y = sin(angle);
			this.vel.mult(simulationSpeed);
			this.pos.add(this.vel);
			--iterations;
		}
	}

	checkEdge(){
		if(this.pos.x > width
		|| this.pos.x < -51
		|| this.pos.y > height
		|| this.pos.y < -1){
			this.respawnSide();
		}
	}
	
	respawnSide() {
		this.pos.x = -50;
		this.pos.y = height/2 + int(random(-distribution, distribution));
		this.life = maxLife;
		//this.color1 = lerpColor(color('white'), color_from, (this.pos.x-padding_side)/inner_square);
		//this.color2 = lerpColor(color('white'), color_to, (this.pos.x-padding_side)/inner_square);
	}

	display(r){
		noStroke();
		let heading = this.vel.heading();
		push();
		translate(this.pos.x, this.pos.y);
		rotate(heading);
		rectMode(CENTER);
		rect(0, 0, r, r);
		pop();
	}
}