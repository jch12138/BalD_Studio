let logoFont;
let mainLogo;
let flock;

function preload(){
    logoFont = loadFont('font/batmfa__.ttf');
}

function setup(){
    createCanvas(windowWidth, windowHeight);
    smooth(1);
    frameRate(30);
    mainLogo = new Logo();
    flock = new Flock()
    for(let i=0; i<100; i++){
        flock.addBoid(new Boid(width/2, height/2));
    }
}

function draw(){
    background(255);
    flock.run();
    mainLogo.update(mouseX, mouseY);
    mainLogo.drawLogo();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    mainLogo.center();
}

function mousePressed() {
    flock.addBoid(new Boid(mouseX,mouseY));
  }

class Logo{
    constructor(){
        this.logoPos = createVector(width/2, height);
        this.logoTextAlpha = 0;
        this.logoAlpha = 0;
        this.logoR = 100;
        this.easing = 0.05;
        this.offset; 
    }
    
    center(){
        this.logoPos = createVector(width/2, this.logoPos.y);
    }


    update(mouseX, mouseY){
        let mousePos = createVector(mouseX, mouseY);
        this.offset = p5.Vector.sub(mousePos, this.logoPos);
        this.offset.setMag(map(this.offset.mag(), 0, 100, 0, 8));
    }

    drawLogo(){
        if(this.logoPos.y <= height/2 + 3){
            noFill();
            this.logoAlpha += (160 - this.logoAlpha)*this.easing;
            stroke(0, 120, 220, this.logoAlpha);
            strokeWeight(this.logoR/4.47407);
            strokeCap(SQUARE);
            arc(width/2+this.offset.x*0.5, height/2+this.offset.y*0.5, this.logoR, this.logoR, HALF_PI, TWO_PI);
            arc(width/2+this.offset.x*0.8, height/2+this.offset.y*0.8, 2*this.logoR, 2*this.logoR, HALF_PI, TWO_PI-HALF_PI);
            arc(width/2+this.offset.x, height/2+this.offset.y, 3*this.logoR, 3*this.logoR, HALF_PI, TWO_PI-PI);
        }
        stroke(0, 0, 0, this.logoTextAlpha);
        strokeWeight(1);
        fill(0, 0, 0, this.logoTextAlpha);
        textSize(80);
        textAlign(CENTER, CENTER);
        textFont(logoFont);
        this.logoPos.y += (height/2 - this.logoPos.y)*this.easing;
        this.logoTextAlpha += (180 - this.logoTextAlpha)*this.easing;
        text('BalD Studio', this.logoPos.x-this.offset.x, this.logoPos.y-this.offset.y);
    }
}
    

class Boid{
    constructor(x_, y_){
        this.pos = createVector(x_, y_);
        let angle = random(TWO_PI);
        this.vel = createVector(cos(angle), sin(angle));
        this.acc = createVector(0, 0);
        this.r = 5;
        this.maxSpeed = 4;
        this.maxForce = 0.05;
        this.theta = 0;
    }

    run(boids_) {
        this.flock(boids_);
        this.update();
        this.edge();
        this.display();
    }
    
    // We accumulate a new acceleration each time based on three rules
    flock(boids_) {
        let sep = this.separate(boids_);   // Separation
        let ali = this.align(boids_);      // Alignment
        let coh = this.cohesion(boids_);   // Cohesion 凝聚
        // Arbitrarily weight these forces
        sep.mult(1.5);
        ali.mult(1.0);
        coh.mult(1.0);
        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }

    update(){
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc = createVector(0, 0);
    }
    
    applyForce(force){
        this.acc.add(force);
    }

    seek(target){
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if(d < 100){
            let m = map(d, 0, 100, 0, this.maxSpeed);
            desired.setMag(m);
        }
        else{
            desired.setMag(this.maxSpeed);
        }
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    separate (boids_) {
        let desiredseparation = 25.0;
        let steer = createVector(0, 0);
        let count = 0;
        // For every boid in the system, check if it's too close
        for (let i=0; i<boids_.length; i++) {
          let d = p5.Vector.dist(this.pos, boids_[i].pos);
          // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
          if ((d > 0) && (d < desiredseparation)) {
            // Calculate vector pointing away from neighbor
            let diff = p5.Vector.sub(this.pos, boids_[i].pos);
            diff.normalize();
            diff.div(d);        // Weight by distance
            steer.add(diff);
            count++;            // Keep track of how many
          }
        }
        // Average -- divide by how many
        if (count > 0) {
          steer.div(float(count));
        }
    
        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
          // First two lines of code below could be condensed with new PVector setMag() method
          // Not using this method until Processing.js catches up
          // steer.setMag(maxspeed);
    
          // Implement Reynolds: Steering = Desired - Velocity
          steer.normalize();
          steer.mult(this.maxSpeed);
          steer.sub(this.vel);
          steer.limit(this.maxForce);
        }
        return steer;
    }

    // Alignment
    // For every nearby boid in the system, calculate the average velocity
    align (boids_) {
        let neighbordist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i=0; i<boids_.length; i++) {
            let d = p5.Vector.dist(this.pos, boids_[i].pos);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids_[i].vel);
                count++;
            }
        }
        if (count > 0) {
            sum.div(float(count));
            // First two lines of code below could be condensed with new PVector setMag() method
            // Not using this method until Processing.js catches up
            // sum.setMag(maxspeed);

            // Implement Reynolds: Steering = Desired - Velocity
            sum.normalize();
            sum.mult(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce);
            return steer;
        } 
        else {
            return createVector(0, 0);
        }
    }

    // Cohesion
    // For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position
    cohesion (boids_) {
        let neighbordist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i=0; i<boids_.length; i++) {
            let d = p5.Vector.dist(this.pos, boids_[i].pos);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids_[i].pos);
                count++;
            }
        }

        if (count > 0) {
            sum.div(count);
            return this.seek(sum);  // Steer towards the position
        } 
        else {
            return createVector(0, 0);
        }
    }

    edge(){
        if(this.pos.x < 0)this.pos.x = width;
        if(this.pos.x > width)this.pos.x = 0;
        if(this.pos.y < 0)this.pos.y = height;
        if(this.pos.y > height)this.pos.y = 0;
    }

    display(){
        this.theta = this.vel.heading() + PI;
        fill(0, 0, 0, 60);
        stroke(0);
        rectMode(CENTER);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.theta);
        // beginShape(TRIANGLES);
        // vertex(0, -this.r*2);
        // vertex(-this.r, this.r*2);
        // vertex(this.r, this.r*2);
        // endShape();
        textSize(20);
        fill(0, 0, 0, 100);
        text("BalD", 0, 0);
        pop();
    }
}

class Flock {
    constructor() {
      this.boids = []; // Initialize the ArrayList
    }
  
    run() {
      for (let i=0; i<this.boids.length; i++) {
        this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
      }
    }
  
    addBoid(b) {
      this.boids.push(b);
    }
  
  }