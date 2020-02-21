//Written by BalD Studio
//2020.01.31 
let canvas;
let data = {};  //保存API中的数据
let balance = [];  //保存余额
let dosage = [];  //保存每用量
let fanData = [];  //保存扇形图的数据
let linechartNum = 3;
let fanchartNum = 1;
let graphs = [];
let graphPos = [];
let graphSize = [];
let title = ["本月余额", "本周余额", "今日余额", "每天每时占用百分比"]; //图表的大标题
let xtitle = ["星期", "天", "小时"];  //x轴的单位
let bHorizon = [];  //余额x轴的数值
let dHorizon = [];  //用量x轴的数值
let switchButton;
let inputButton;
let method = 0;
let layoutIndex = [0, 0, 0, 1];  //1代表放大显示
let boxPos, boxW, boxH;
let promptBox;
let prompting = false;
let getBound = false;
let neuralNetwork;
let o_pred = "";

function preload() {
    let p5_loading = document.getElementById("p5_loading");
    p5_loading.style.top = "100px";
    //从api获取数据
    let url = "https://biccloud.club:4000/getElectricityFees";
    loadJSON(url,gotData,'json');
}

function setup(){
    frameRate(60);
    canvas = createCanvas(windowWidth, windowHeight);
    dataProcess();
    for(let i=0; i<linechartNum+fanchartNum-1; i++){
        graphPos[i] = createVector(0, 0);
        graphSize[i] = createVector(0, 0);
    }
    switchButton = createButton("查看用电情况");
    switchButton.id("switchButton");
    switchButton.position(10, height-switchButton.height-20);
    promptBox = new myPromptBox(80, height-2*switchButton.height-20, 120, 40);
    let options = {
        inputs: 1,
        outputs: 1,
        task: 'regression',
        debug: 'true' 
    };
    neuralNetwork = ml5.neuralNetwork(options);
    for(let i=0; i<dosage.length; i++){
        let x = i;
        let y = dosage[i];
        neuralNetwork.addData([x], [y]);   
    }
    //neuralNetwork.normalizeData();
    trainOptions = {
        epochs: 200,
    };
    neuralNetwork.train(trainOptions, whileTraining, finishedTraining);
}

function draw(){
    promptBox.update(prompting);
    if(!prompting){
        switchButton.mouseClicked(switchButtonClicked);
        update();
        graphs[3].update(layoutIndex[3]);
    }
    background(255);
    overview();
    for(let i=0; i<linechartNum; i++){
        graphs[i].display();
    }
    graphs[3].display();
    promptBox.display();
    if(prompting){
        promptBox.applybutton.mouseClicked(sendMessage);
    }
    
}

function gotData(data_) {
    //从JSON获取数据,保存到data中
    data = data_;
}

function sendMessage(){
    let email = promptBox.emailInput.elt.value;
    let value = promptBox.valueInput.elt.value;
    let httpRequest = new XMLHttpRequest();  //建立所需的对象
    let url = "https://biccloud.club:4000/setNotice?mailAddress="+email+"&value="+value;
    let result;
    let emailRegex = /\w+@\w+.com/;
    let valueRegex = /\d+/;
    if(emailRegex.test(email) && valueRegex.test(value)){
        httpRequest.open('GET', url, true);  //打开连接  将请求参数写在url中
        httpRequest.send();  //发送请求  将请求参数写在URL中
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                result = httpRequest.responseText;//获取到json字符串，还需解析
                if(result != undefined){
                    console.log(result);
                    promptBox.title = "邮箱已绑定";
                    getBound = true;
                }
            }
        }
    }
    else if(!emailRegex.test(email)){
        promptBox.title = "邮箱格式错误，请重新填写";
    }
    else if(!valueRegex.test(value)){
        promptBox.title = "请输入提醒电费";
    }
}

function dataProcess(){
    let tempBalance = [];
    let tempDosage = [];
    let tempHorizon = [];
    //保存每月每天的余额
    for(let i=1; i<data["result"]["month"].length; i++){
        tempBalance.push(data["result"]["month"][i]["balance"]);
    }
    balance.push(tempBalance);
    bHorizon.push(["前三周", "前两周", "前一周", "本周"]);

    //保存每月每天的用量
    tempHorizon = [];
    for(let i=1; i<data["result"]["month"].length-1; i++){
        let delta = data["result"]["month"][i]["balance"] - data["result"]["month"][i+1]["balance"];
        tempDosage.push(abs(delta.toFixed(2)));
    }
    dosage.push(tempDosage);
    dHorizon.push(["前三周", "前两周", "前一周", "本周"]);

    //保存每周每天的余额
    tempBalance = [];
    tempHorizon = [];
    for(let i=0; i<data["result"]["week"].length; i++){
        tempBalance.push(data["result"]["week"][i]["balance"]);
        let date = data["result"]["week"][i]["date"]["month"] + "/" + data["result"]["week"][i]["date"]["day"];
        tempHorizon.push(date);
    }
    balance.push(tempBalance);
    bHorizon.push(tempHorizon);

    //保存每周每天的用量
    tempDosage = [];
    tempHorizon = [];
    for(let i=0; i<data["result"]["week"].length-1; i++){
        let delta = data["result"]["week"][i]["balance"] - data["result"]["week"][i+1]["balance"];
        tempDosage.push(abs(delta.toFixed(2)));
        let date = data["result"]["week"][i]["date"]["month"] + "/" + data["result"]["week"][i]["date"]["day"];
        tempHorizon.push(date);
    }
    dosage.push(tempDosage);
    dHorizon.push(tempHorizon);

    //保存每天每小时的余额
    tempBalance = [];
    tempHorizon = [];
    for(let i=0; i<data["result"]["day"].length; i++){
        tempBalance.push(data["result"]["day"][i]["balance"]);
        tempHorizon.push(data["result"]["day"][i]["hour"])
    }
    balance.push(tempBalance);
    bHorizon.push(tempHorizon);

    //保存每天每小时的用量
    tempDosage = [];
    tempHorizon = [];
    for(let i=0; i<data["result"]["day"].length-1; i++){
        let delta = data["result"]["day"][i]["balance"] - data["result"]["day"][i+1]["balance"];
        tempDosage.push(abs(delta.toFixed(2)));
        tempHorizon.push(data["result"]["day"][i]["hour"])
    }
    dosage.push(tempDosage);
    dHorizon.push(tempHorizon);
    
    //扇形图数据处理
    fanData = data["result"]["fan"];
    let sum = 0;
    for(let i=0; i<fanData.length-1; i++){
        sum = sum + Number(fanData[i].toFixed(2));
    }
    fanData[fanData.length-1] = Number((1-sum).toFixed(2));
    //扇形图图示处理
    let temp = [];
    for(let i=0; i<fanData.length; i++){
        let s = String(i+6)+":00-"+String(i+7)+":00";
        temp.push(s);
    }
    title[3] = temp;
}

function overview(){
    textAlign(CENTER,CENTER);
    textSize(20);
    noStroke();
    fill(0);
    let num = data["result"]["day"].length - 1;
    let o_b = "当前余额：" + data["result"]["day"][num]["balance"] + "度";
    let o_q = "当前电费：" + data["result"]["day"][num]["quantity"] + "元";
    let o_p = "当前功率：" + data["result"]["power"] + "W";
    text(o_b, width/5*2, height/10);
    text(o_q, width/5*3, height/10);
    text(o_p, width/5*4, height/10);
    let todaySum = data["result"]["day"][0]["balance"] - data["result"]["day"][num]["balance"];
    let o_t = "今日用电量：" + todaySum.toFixed(2) + "度";
    if(data["result"]["warning"] == 1){
        fill(255, 10, 10);
    }
    text(o_t, width/5, height/10);
    if(data["result"]["warning"] == 1){
        textSize(12);
        fill(0);
        text("已超出预计用电量，请注意用电", width/5, height/10 - 30);
    }
    text(o_pred, width/5*2, height/10 - 30);

}

function update(){
    setLayout();
    if(method == 0){
        for(let i=0; i<linechartNum; i++){
            graphs[i] = new Linechart(graphPos[i], graphSize[i], balance[i], title[i], xtitle[i], bHorizon[i]);
        }
    }
    else{
        for(let i=0; i<linechartNum; i++){
            graphs[i] = new Linechart(graphPos[i], graphSize[i], dosage[i], title[i], xtitle[i], bHorizon[i]);
        }
    }
    graphs[linechartNum] = new Fanchart(graphPos[linechartNum], graphSize[linechartNum], fanData, title[3]);
}

function setLayout(){
    boxPos = createVector(width*0.5, height*0.55);
    boxW = width * 0.8;
    boxH = height * 0.75;
    let num = 0;
    let subW = 0.3*boxW;
    let subH = 0.333*boxH;
    let nPercent = 0.8;
    let hPercent = 0.9;

    let tPos = [];
    let pPos = [];
    if(graphPos != undefined){
        for(let i=0; i<graphPos.length; i++){
            pPos.push(graphPos[i]);
        }
    }
    let tSize = [];
    let pSize = [];
    if(graphSize != undefined){
        for(let i=0; i<graphSize.length; i++){
            pSize.push(graphSize[i]);
        }
    }
    //计算图表的位置和大小
    for(let i=0; i<layoutIndex.length; i++){
        if(layoutIndex[i] == 0){
            let subPos = createVector(boxPos.x - boxW/3, boxPos.y+(num-1)*subH);
            if(mouseX<subPos.x+subW/2&&mouseX>subPos.x-subW/2&&mouseY<subPos.y+subH/2&&mouseY>subPos.y-subH/2){
                graphSize[i] = createVector(subW * hPercent, subH * hPercent);
            }
            else{
                graphSize[i] = createVector(subW * nPercent, subH * nPercent);
            }
            graphPos[i] = subPos;
            num += 1;
        }
        else{
            graphPos[i] = createVector(boxPos.x+boxW/6, boxPos.y);
            graphSize[i] = createVector(2/3*boxW, boxH);
        }   
    }
    
    //动画
    let easing = 0.1;

    if(pPos != undefined){
        for(let i=0; i<graphPos.length; i++){
            pPos.push(graphPos[i]);
        }
    }
    for(let i=0; i<graphPos.length; i++){
        tPos.push(graphPos[i]);
    }

    if(pSize != undefined){
        for(let i=0; i<graphSize.length; i++){
            pSize.push(graphSize[i]);
        }
    }
    for(let i=0; i<graphSize.length; i++){
        tSize.push(graphSize[i]);
    }
    for(let i=0; i<graphPos.length; i++){
        pPos[i].x += (tPos[i].x - pPos[i].x) * easing;
        pPos[i].y += (tPos[i].y - pPos[i].y) * easing;
        graphPos[i] = createVector(pPos[i].x, pPos[i].y);
    }
    for(let i=0; i<graphSize.length; i++){
        pSize[i].x += (tSize[i].x - pSize[i].x) * easing;
        pSize[i].y += (tSize[i].y - pSize[i].y) * easing;
        graphSize[i] = createVector(pSize[i].x, pSize[i].y);
    }
    
}

function mouseClicked(){
    for(let i=0; i<graphs.length; i++){
        if(graphs[i].isOnGraph()){
            for(let j=0; j<layoutIndex.length; j++){
                layoutIndex[j] = 0;
            }
            layoutIndex[i] = 1;
            break;   
        }
    }

    if(promptBox.getSwitch()){
        prompting = !prompting;
    }
}

function switchButtonClicked(){
    if(method == 1){
        method = 0;
        title[0] = "本月余额";
        title[1] = "本周余额";
        title[2] = "今日余额";
        switchButton.elt.innerHTML = "查看用电情况";
    }
    else{
        method = 1;
        title[0] = "本月每周用电情况";
        title[1] = "本周每日用电情况";
        title[2] = "今日每时用电情况";
        switchButton.elt.innerHTML = "查看余额";
    }
}

function whileTraining(epoch, loss){
    //o_pred = "正在预计剩余可用天数";
    console.log(epoch);
}

function finishedTraining() {
    console.log("training finished!");
    let inputs = {
        x: 24,
    }
    neuralNetwork.predict(inputs, gotResult);
}

function gotResult(error, results){
    if (error) {
        console.error(error);
        return;
      }
      console.log(results);
}

class Linechart{
    constructor(position_, size_, value_, title_, xtitle_, bHorizon_){
        this.pos = position_;  //图表的位置
        this.size = size_;   //图表的大小
        this.value = value_;  //y值
        this.xSegs = max(value_.length, 1);  //x轴的分段数 
        this.ySegs = 8;       //y轴的分段数
        this.percent = 0.8;   //坐标占图表的比例大小
        this.xLen = this.percent * size_.x;  //x轴的像素长度
        this.yLen = this.percent * size_.y;  //y轴的像素长度
        this.xMax = max(value_.length, 1);  //x轴的数值最大值
        this.yMax = max(value_)+abs(max(min(value_),0.01));  //y轴的数值最大值
        this.xUnit = 1  ;   //x轴的单位数值大小
        this.yUnit = this.yMax/this.ySegs;  //y轴的单位数值大小
        this.xUnitLen = this.xLen / (this.xSegs+1);  //x轴的单位像素长度
        this.yUnitLen = this.yLen / this.ySegs;   //y轴的单位像素长度
        //坐标原点
        let originOffset = createVector(-this.xLen/2, this.yLen/2);
        this.originPos = p5.Vector.add(this.pos, originOffset);
        this.title = title_;
        this.xtitle = xtitle_;
        this.bHorizon = bHorizon_;
    }

    display(){
        stroke(0);
        strokeWeight(1);
        fill(255);
        rectMode(CENTER);
        this.drawCoor();
        this.drawDot();
        this.drawLine();
    }

    drawCoor(){
        strokeWeight(1);
        stroke("#649dad");
        fill("#649dad");
        line(this.originPos.x, this.originPos.y, this.originPos.x+this.xLen, this.originPos.y);  //x Axis
        line(this.originPos.x, this.originPos.y, this.originPos.x, this.originPos.y-this.yLen);  //y Axis
        noStroke();
        textAlign(LEFT, TOP);
        textSize(12);
        text(this.xtitle, this.originPos.x+this.xLen, this.originPos.y+10);
        //显示x轴以及数值
        for(var i=1; i<= this.xSegs;i++){
            stroke("#649dad");
            strokeWeight(0.5);
            line(this.originPos.x+i*this.xUnitLen, this.originPos.y, this.originPos.x+i*this.xUnitLen, this.originPos.y-this.originPos.y*0.02);
            noStroke();
            textAlign(CENTER);
            textSize(10);
            for(let i=0; i<this.bHorizon.length; i++){
                text(this.bHorizon[i],this.originPos.x+(i+1)*this.xUnitLen, this.originPos.y+10);
            }
            
        }
        //显示y轴以及数值
        for(i=1; i<= this.ySegs;i++){
            stroke("#649dad");
            strokeWeight(0.5);
            line(this.originPos.x, this.originPos.y - i*this.yUnitLen, this.originPos.x+this.xLen, this.originPos.y-i*this.yUnitLen);
            noStroke();
            textAlign(CENTER);
            textSize(10);
            text((i*this.yUnit).toFixed(2), this.originPos.x-20, this.originPos.y - i*this.yUnitLen);
        }
        textSize(18);
        text(this.title, this.pos.x, this.originPos.y-this.yLen-30);
    }

    drawDot(){
        for(let i=0; i<this.value.length; i++){
            let x = this.originPos.x + ((i+1)/this.xMax)*(this.xLen - this.xUnitLen);
            let y = this.originPos.y - (this.value[i]/this.yMax)*this.yLen;
            noStroke();
            if(this.value[i] > 20){
                fill("#1fab89");
            }
            else{
                fill("#ff2e63");;
            }
            if(mouseX>x-5&&mouseX<x+5&&mouseY>y-5&&mouseY<y+5){
                ellipse(x, y, 10, 10);
                textSize(12);
                text(this.value[i], x, y-20);
            }
            else{
                ellipse(x, y, 5, 5);
                
            }
            
        }
    }

    drawLine(){
        if(this.value.length >= 2){
            for(let i=0; i<this.value.length-1; i++){
                let x = this.originPos.x + ((i+1)/this.xMax)*(this.xLen - this.xUnitLen);
                let y = this.originPos.y - (this.value[i]/this.yMax)*this.yLen;
                let px = this.originPos.x + ((i+2)/this.xMax)*(this.xLen - this.xUnitLen);
                let py = this.originPos.y - (this.value[i+1]/this.yMax)*this.yLen;
                if(this.value[i] > 20){
                    stroke("#1fab89");
                }
                else{
                    stroke("#ff2e63");;
                }
                strokeWeight(1);
                line(x, y, px, py);
            }
        }
    }

    isOnGraph(){
        if(mouseX>this.pos.x-this.size.x/2&&
            mouseX<this.pos.x+this.size.x/2&&
            mouseY>this.pos.y-this.size.y/2&&
            mouseY<this.pos.y+this.size.y/2){
                return true;
            }
        else{
            return false;
        }
    }
}

class Fanchart{
    constructor(position_, size_, data_, title_){
        this.data = data_;
        this.radius = min(size_.x, size_.y);
        this.title = title_;
        //选择颜色
        let from = color("#84fab0");
        let to = color("#8fd3f4");
        let b = 1/this.data.length;
        this.color = [];
        for(let i=0; i<this.data.length; i++){
            this.color.push(lerpColor(from, to, b*i));
        }
        //扇形原点
        this.originPos = createVector(position_.x, position_.y);
        //记录选择的扇区
        this.selectPart = null;

        this.tVisible = true;
    }

    checkSelect(){
        let s1,s2;
        let mouseLoc = createVector(mouseX, mouseY);
        let relLoc = p5.Vector.sub(mouseLoc, this.originPos);
        let theta;
        let relDis = relLoc.mag();
        if(relLoc.heading() > 0){
            theta = relLoc.heading();
        }
        else{
            theta = TWO_PI + relLoc.heading();
        }
        let startA = 0;
        let endA = 0;
        
        for(let i=0; i<this.data.length; i++){
            endA = endA + this.data[i] * TWO_PI;
            if(theta > startA && theta < endA && relDis < this.radius/2){
                s1 = i;
                break;
            }
            else{
                s1 = null;
            }
            startA = endA;
        }

        let x = this.originPos.x + this.radius/2 + 50;
        let w = 20;
        let h = 10;
        let gap = 2;
        for(let i=0; i<this.data.length; i++){
            let y = this.originPos.y + i*(h+gap);
            fill(this.color[i]);
            if(mouseX<x+w/2&&mouseX>x-w/2&&mouseY<y+h/2&&mouseY>y-h/2){
                s2 = i;
                break;
            }
            else{
                s2 = null;
            }
        }
        if(s1!=null){
            this.selectPart = s1;
        }
        if(s2!=null){
            this.selectPart = s2;
        }
    }

    showData(){
        fill(0);
        noStroke();
        textAlign(CENTER);
        textSize(24);
        text(floor(this.data[this.selectPart]*100) + '%', mouseX, mouseY);
    }

    update(index){
        this.checkSelect();
        if(index == 1){
            this.tVisible = true;
        }
        else{
            this.tVisible = false;
        }
    }

    drawFan(){
        noStroke();
        let startA = 0;
        let endA = 0;
        for(let i=0; i<this.data.length; i++){
            endA = endA + this.data[i] * TWO_PI;
            fill(this.color[i]);
            stroke(255);
            strokeWeight(0.5);
            if(i == this.selectPart){
                let a = (startA + endA) / 2;
                let r = 10;
                push();
                translate(r*cos(a), r*sin(a));
                arc(this.originPos.x, this.originPos.y, this.radius, this.radius, startA, endA, PIE);
                pop();
                this.showData();
            }
            else{
                arc(this.originPos.x, this.originPos.y, this.radius, this.radius, startA, endA, PIE);
            }
            startA = endA;
        }
        for(let i=0; i<this.data.length; i++){
            if(i == this.selectPart){
                this.showData();
            }
        }
    }

    drawNote(){
        if(this.tVisible){
            let x = this.originPos.x + this.radius/2 + map(this.radius, 0, 600, 0, 50);
            let w = 20;
            let h = 10;
            let gap = 2;
            for(let i=0; i<this.data.length; i++){
                let y = this.originPos.y + i*(h+gap);
                fill(this.color[i]);
                if(this.selectPart==i){
                    stroke(0);
                    strokeWeight(0.5);
                }else{
                    noStroke();
                }
                rectMode(CENTER);
                rect(x, y, w, h);
                fill(0);
                textAlign(LEFT, CENTER);
                textSize(10);
                text(this.title[i], x+1.2*w, y);
            }
 
        }
        
    }

    display(){
        this.drawNote();
        this.drawFan();   
    }

    isOnGraph(){
        if(mouseX>this.originPos.x-this.radius/2&&
            mouseX<this.originPos.x+this.radius/2&&
            mouseY>this.originPos.y-this.radius/2&&
            mouseY<this.originPos.y+this.radius/2){
                return true;
        }
        else{
            return false;
        }
    }
}

class myButton{
    constructor(x, y, w, h, t){
        this.pos = createVector(x, y);
        this.size = createVector(w, h);
        this.t = t;
        this.round = 5;
        this.nBgColor = "#649dad";
        this.hBgColor = "#649ddd";
    }

    display(){
        rectMode(CENTER);
        noStroke();
        fill(this.nBgColor);
        rect(this.pos.x, this.pos.y, this.size.x, this.size.y, this.round);
        textAlign(CENTER);
        textSize(18);
        fill(0);
        text(this.t, this.pos.x, this.pos.y);
    }

    isHover(){
        if(mouseX>this.pos.x-this.size.x/2&&
            mouseX<this.pos.x+this.size.x/2&&
            mouseY>this.pos.y-this.size.y/2&&
            mouseY<this.pos.y+this.size.y/2){
                return true;
            }
        else{
            return false;
        }
    }
}

class myPromptBox{
    constructor(x, y, w, h){
        this.rPos = createVector(x, y);
        this.rSize = createVector(w, h);
        this.pos = createVector(x, y);
        this.size = createVector(w, h);
        this.tPos = createVector(width/2, height/2);
        this.tSize = createVector(width, height);
        this.tSize.x = width * 0.3;
        this.tSize.y = height * 0.4;
        this.round = 5;
        this.prompting = false;
        this.title = "绑定邮箱提醒";

        this.bgaphla = 0;

        this.applybutton = createButton("绑定");  
        this.crossbutton = createButton("关闭");
        let inputW = this.size.x * 0.6;
        let inputH = 80;
        this.emailInput = createInput();  //email输入框
        this.emailInput.width = inputW;
        this.emailInput.height = inputH;
        this.valueInput = createInput();  //value输入框
        this.valueInput.width = inputW;
        this.valueInput.height = inputH;

    }
    
    update(prompting_){
        let inputW = this.size.x * 0.6;
        let inputH = 80;
        this.prompting = prompting_;
        if(prompting_){
            this.applybutton.elt.style.display = "";
            this.crossbutton.elt.style.display = "";
            this.emailInput.elt.style.display = "";
            this.valueInput.elt.style.display = "";
        }
        else{
            this.applybutton.elt.style.display = "none";
            this.crossbutton.elt.style.display = "none";
            this.emailInput.elt.style.display = "none";
            this.valueInput.elt.style.display = "none";
        }
        this.applybutton.position(this.pos.x-this.applybutton.width/2, this.pos.y+this.size.y/2-this.applybutton.height/2-40);
        this.crossbutton.position(this.pos.x+this.size.x/2-this.crossbutton.width-20, this.pos.y-this.size.y/2+20);
        this.emailInput.position(this.pos.x-inputW/2, this.pos.y);
        this.valueInput.position(this.pos.x-inputW/2, this.pos.y+50);


    }

    display(){
        let easing = 0.2;
        let tp,ts;
        let r;
        let a;
        rectMode(CENTER);
        if(this.prompting){
            tp = this.tPos;
            ts = this.tSize;
            r = 20;
            a = 200 ;
            this.bgaphla += (a - this.bgaphla) * easing;
            fill(255, 255, 255, this.bgaphla);
            rect(width/2, height/2, width, height);
        }
        else{
            tp = this.rPos;
            ts = this.rSize;
            r = 5;
            a = 0;
            this.bgaphla += (a - this.bgaphla) * easing;
            fill(255, 255, 255, this.bgaphla);
            rect(width/2, height/2, width, height);
        }
        stroke(0);
        strokeWeight(1);
        fill(255);
        this.pos.x += (tp.x - this.pos.x) * easing;
        this.pos.y += (tp.y - this.pos.y) * easing;
        this.size.x += (ts.x - this.size.x) * easing;
        this.size.y += (ts.y - this.size.y) * easing;
        this.round += (r - this.round) * easing;
        stroke(0, 0, 0, this.bgaphla);
        !this.prompting ? fill(231, 231, 231):fill(255, 255, 255);
        rect(this.pos.x, this.pos.y, this.size.x, this.size.y, this.round);
        fill(0);
        noStroke();
        textAlign(CENTER,CENTER);
        let tts = map(this.size.x, 100, this.tSize.x, 12, 30);  //标题字体大小
        textSize(tts);
        let tty = map(this.size.x, 100, this.tSize.x, this.pos.y, this.pos.y-this.size.y/5);
        text(this.title, this.pos.x, tty);

        if(this.prompting){
            fill(0);
            noStroke();
            textAlign(LEFT, BOTTOM);
            textSize(12);
            text("邮箱：", this.emailInput.x, this.emailInput.y - 10);
            text("提醒电费：", this.valueInput.x, this.valueInput.y -10);
        }
        else{
            
        }
    }

    getSwitch(){
        if(this.prompting){
            if(mouseX>this.crossbutton.x&&
                mouseX<this.crossbutton.x+this.crossbutton.width&&
                mouseY>this.crossbutton.y&&
                mouseY<this.crossbutton.y+this.crossbutton.height){
                    if(!getBound){
                        this.title = "绑定邮箱提醒";
                    }
                    return true;
            }
            else if(mouseX<this.pos.x-this.size.x/2&&
                mouseX>this.pos.x+this.size.x/2&&
                mouseY<this.pos.y-this.size.y/2&&
                mouseY>this.pos.y+this.size.y/2){
                    return true;
            }
            else{
                return false;
            }
        }
        else{
            if(mouseX>this.pos.x-this.size.x/2&&
                mouseX<this.pos.x+this.size.x/2&&
                mouseY>this.pos.y-this.size.y/2&&
                mouseY<this.pos.y+this.size.y/2){
                    return true;
            }
            else{
                return false;
            }
                
        }
        
    }
}