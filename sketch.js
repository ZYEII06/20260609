// --- 遊戲狀態與變數 ---
let gameState = "START_MENU"; 
let video;
let handpose;
let predictions = [];
let isModelLoaded = false;
let modelStatusMsg = "正在初始化環境...";
let supportsWebGL = false;

// --- 圖片素材變數 ---
let imgBg1, imgBg2; 
let imgDogWalkSprite, imgDogSmileSprite; 
let imgAliceTalkSprite, imgAliceWalkSprite; 

// --- 第一階段：腳本與互動變數 ---
let aliceX, aliceY;
let aliceSpeed = 10;
let aliceDir = "right"; 
let isAliceMoving = false;

let dogX, dogY;
let dogDir = "left"; 

// 🐶 小狗 Sprite 動態計算變數
let dogWalkTotalFrames = 6;  
let dogWalkAnimFrame = 0;    
let dogSmileTotalFrames = 3;  
let dogSmileAnimFrame = 0;    

// 👱‍♀️ 愛麗絲 Sprite 動態計算變數
let aliceTalkTotalFrames = 3;
let aliceTalkAnimFrame = 0;
let aliceWalkTotalFrames = 6;
let aliceWalkAnimFrame = 0;

let storyStage = 0; 

// 📝 劇本
const dialogueScript = [
  { speaker: "ALICE", text: "「皮皮你好！我剛好在網路上看到『反社會人格』這個詞，\n是指那些不喜歡出門、不愛跟人講話、很孤僻的人嗎？」" },
  { speaker: "DOG", text: "「汪！愛麗絲，這就是大家最常搞混的迷思喔！\n不愛社交、孤僻的那叫『社交恐懼』或『內向』。\n『反社會人格障礙（ASPD）』完全是兩回事！」" },
  { speaker: "ALICE", text: "「哇，原來我一直理解錯了！\n那它到底是什麼意思呢？」" },
  { speaker: "DOG", text: "「簡單來說，這是一種『長期漠視、侵犯他人權益』的行為模式。\n為了讓大家更容易記住，我把它整理成三個最核心的特質！」" }
];
let currentDiagIndex = 0;

// --- 過渡關卡畫面變數 ---
let startBtn;
let transitionBtn;

// --- 第二階段：視訊測驗變數 (答案融入視訊中) ---
let captureBtn;
let quizFeedback = "";       
let feedbackTimer = 0;       
let nextBtnX, nextBtnY, nextBtnW, nextBtnH;
let videoLayer;

// --- 題庫系統 ---
const questions = [
  {
    q: "反社會人格障礙（ASPD）患者常表現出什麼樣的行為模式？",
    a: "面對利益衝突時，能退讓並以大局為重。",
    b: "為了個人利益，長期且反覆地欺騙與\n操縱他人。",
    correct: "B"
  },
  {
    q: "關於 ASPD 患者的「同理心」，以下敘述何者更精準？",
    a: "他們多數缺乏情感同理心，無法體會他人痛苦。",
    b: "他們完全不懂人情世故，常因笨拙而傷害他人。",
    correct: "A"
  },
  {
    q: "警犬皮皮提到 ASPD 的「表面魅力」，通常指的是什麼？",
    a: "長相英俊美麗，且對社會法規極度尊重。",
    b: "口才極佳且幽默，善於包裝自己以獲取信任。",
    correct: "B"
  },
  {
    q: "ASPD 與「內向者、社交恐懼者」最大的動態差異是什麼？",
    a: "ASPD 傾向侵犯他人權益，後者主要是迴避社交。",
    b: "ASPD 在任何場合都會感到極度焦慮與害羞。",
    correct: "A"
  },
  {
    q: "若在職場或生活中發現具有高風險 ASPD 特質的人，應如何應對？",
    a: "建立清晰的心理與行為邊界，並保持安全距離。",
    b: "付出更多愛心與包容，期待能感化並改變對方。",
    correct: "A"
  }
];

let currentQIndex = 0;
let quizSolved = false; 
let allCompleted = false;

// --- 懸停偵測計時器 ---
let hoverOption = null; // 目前指著哪個選項 ('A', 'B', 'NEXT')
let hoverCounter = 0;   // 計時器 (幀數)
const HOVER_THRESHOLD = 90; // 1.5秒 (60fps * 1.5)

// 視訊與視窗版面變數
let vidW, vidH;
let vidX, vidY;
let optAX, optAY, optBX, optBY, optW, optH;

// --- 第三階段：射擊遊戲變數 ---
let bubbles = [];
let playerBullet = null;
let score = 0;
let restartBtn;
let particles = []; 

// ==========================================
// 【預載入素材】
// ==========================================
function preload() {
  imgBg1 = loadImage("background/1.png");
  imgBg2 = loadImage("background/2.png"); 
  imgDogWalkSprite = loadImage("dog/dog walk/6.png"); 
  imgDogSmileSprite = loadImage("dog/smile/3.png"); 
  imgAliceTalkSprite = loadImage("alice/talk/3.png");  
  imgAliceWalkSprite = loadImage("alice/walk/6.png");  
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 計算視訊及選項之相對座標
  recalcLayout();

  aliceX = 100;
  aliceY = height - 340; 
  dogX = width - 250;
  dogY = height - 340;

  supportsWebGL = checkWebGLSupport();
  modelStatusMsg = supportsWebGL ? "環境支援 WebGL。正在啟動攝影機..." : "警告：此裝置不支援 WebGL。";

  let constraints = { video: { facingMode: "user" }, audio: false };
  video = createCapture(constraints, function(stream) {
    modelStatusMsg = "攝影機啟動成功，正在載入 ml5.js 手部辨識模型...";
    initHandpose();
  });
  video.size(vidW, vidH);
  video.hide();

  // 🏁 開始遊戲按鈕
  startBtn = createButton("開始心理防禦挑戰 🚀");
  startBtn.mousePressed(() => {
    gameState = "STAGE1";
    startBtn.hide();
  });
  customizeButton(startBtn);
  startBtn.style("background-color", "#4cc9f0");
  startBtn.style("font-size", "22px");
  startBtn.position(width / 2 - 120, height / 2 + 100);
  startBtn.hide();


  // 📸 拍照按鈕
  captureBtn = createButton("剪下 ASPD 視訊畫面 (JPG)");
  captureBtn.mousePressed(saveImageSnapshot);
  customizeButton(captureBtn);
  captureBtn.hide();

  // 過渡畫面按鈕
  transitionBtn = createButton("進入第二階段：手勢觀念測驗 ➡️");
  transitionBtn.mousePressed(() => {
    gameState = "STAGE2";
    transitionBtn.hide();
  });
  customizeButton(transitionBtn);
  transitionBtn.style("background-color", "#f72585");
  transitionBtn.style("font-size", "18px");
  transitionBtn.hide();

  // 🔄 重新挑戰按鈕
  restartBtn = createButton("🔄 重新挑戰");
  restartBtn.mousePressed(resetGame);
  customizeButton(restartBtn);
  restartBtn.style("background-color", "#4361ee");
  restartBtn.hide();

  initStage3();
}

function draw() {
  background("#e7c6ff"); 
  drawStatusMessage();

  if (gameState === "START_MENU") {
    drawStartMenu();
  } else if (gameState === "STAGE1") {
    drawStage1();
  } else if (gameState === "STAGE_TRANSITION") {
    drawStageTransition();
  } else if (gameState === "STAGE2") {
    drawStage2();
  } else if (gameState === "STAGE3") {
    drawStage3();
  }
}

// ==========================================
// 🏠【起始畫面：規則與說明】
// ==========================================
function drawStartMenu() {
  image(imgBg1, 0, 0, width, height);
  fill(0, 180);
  rect(0, 0, width, height);

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  // 中央說明卡片
  fill(255, 250);
  stroke("#4cc9f0");
  strokeWeight(6);
  rect(width / 2, height / 2 - 20, 900, 520, 25);
  
  // 標題
  noStroke();
  fill("#3f37c9");
  textSize(48);
  textStyle(BOLD);
  text("🛡️ 識破 ASPD：心理防禦戰 🛡️", width / 2, height / 2 - 200);

  // --- 新增：規則文字內容的內框 ---
  fill("#f8f9fa");
  stroke("#dee2e6");
  strokeWeight(2);
  rect(width / 2, height / 2 + 10, 840, 300, 15);
  
  // 遊戲規則說明
  noStroke();
  fill(40);
  textSize(20);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  let infoText = `歡迎來到互動教學遊戲！透過本遊戲，你將學習如何辨識與應對「反社會人格障礙」。

🌟 遊戲三大關卡：
1.【核心導讀】：跟隨愛麗絲與皮皮警犬，掌握 ASPD 的三大核心特質。
2.【手勢辨識】：舉起手對準視訊畫面，懸停選出正確的觀念應對方式。
3.【觀念爆破】：挑戰快速反應！點擊爆破正確答案的泡泡，獲取高分。

💡 操作小提示：
● 階段二需開啟鏡頭，利用「指尖」移動準星，懸停 1.5 秒確認答案。
● 階段三則是考驗你的滑鼠點擊精準度。`;
  
  text(infoText, width / 2 - 5, height / 2 + 10, 800, 280);
  
  // 閃爍的開始提示
  if (floor(frameCount / 30) % 2 === 0) {
    fill("#f72585");
    textSize(22);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("點擊下方按鈕開始旅程", width / 2, height / 2 + 195);
  }
  pop();

  startBtn.show();
  startBtn.position(width / 2 - 130, height / 2 + 220);
}

// ==========================================
// �【自適應網頁版面計算】
// ==========================================
function recalcLayout() {
  vidW = width * 0.62;
  vidH = height * 0.76;

  vidX = (width - vidW) / 2;
  vidY = (height - vidH) / 2 - 15; 

  // 縮放左右兩側的答案字卡
  optW = vidW * 0.38;
  optH = vidH * 0.35;
  
  optAX = vidX + (vidW * 0.08);
  optAY = vidY + (vidH / 2) - (optH / 2);
  
  optBX = vidX + vidW - optW - (vidW * 0.08);
  optBY = vidY + (vidH / 2) - (optH / 2);

  nextBtnW = 280;
  nextBtnH = 80;
  nextBtnX = width / 2 - nextBtnW / 2;
  nextBtnY = height / 2 - nextBtnH / 2;

  if (videoLayer) {
    videoLayer.resizeCanvas(vidW, vidH);
  } else {
    videoLayer = createGraphics(vidW, vidH);
  }
}

function checkWebGLSupport() {
  try {
    let canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

function initHandpose() {
  handpose = ml5.handpose(video, () => {
    isModelLoaded = true;
    modelStatusMsg = "ml5 手部辨識模型載入成功！請準備進入測驗。";
  });
  handpose.on("predict", results => { predictions = results; });
}

// ==========================================
// 【第一階段：角色互動與動畫控制】
// ==========================================
function drawStage1() {
  if (captureBtn) captureBtn.hide(); 
  if (transitionBtn) transitionBtn.hide();
  image(imgBg1, 0, 0, width, height);

  fill("#3f37c9");
  textSize(28);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  text("【 第一階段：認識反社會人格障礙 (ASPD) 】", width / 2 + 2, 27); 
  fill("#4cc9f0");
  text("【 第一階段：認識反社會人格障礙 (ASPD) 】", width / 2, 25);
  textStyle(NORMAL);

  let displayW = 140;
  let displayH = 140;

  isAliceMoving = false;
  if (storyStage === 0) {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { 
      aliceX -= aliceSpeed;
      aliceDir = "left";
      isAliceMoving = true;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { 
      aliceX += aliceSpeed;
      aliceDir = "right";
      isAliceMoving = true;
    }
    aliceX = constrain(aliceX, 50, width - 150);
  }

  if (storyStage === 0 && abs(aliceX - dogX) < 180) {
    storyStage = 1; 
    currentDiagIndex = 0; 
  }

  let dogSx = 0; 
  let dogSgW = 0;
  let dogSgH = 0;
  if (frameCount % 8 === 0) {
    dogSmileAnimFrame = (dogSmileAnimFrame + 1) % dogSmileTotalFrames;
  }
  dogSgW = imgDogSmileSprite.width / dogSmileTotalFrames;
  dogSgH = imgDogSmileSprite.height;
  dogSx = dogSmileAnimFrame * dogSgW; 

  let aliceSx = 0;
  let aliceSgW = 0;
  let aliceSgH = 0;
  let currentAliceImg;

  if (storyStage === 1) {
    currentAliceImg = imgAliceTalkSprite;
    let currentDiag = dialogueScript[currentDiagIndex];
    if (currentDiag && currentDiag.speaker === "ALICE") {
      if (frameCount % 8 === 0) {
        aliceTalkAnimFrame = (aliceTalkAnimFrame + 1) % aliceTalkTotalFrames;
      }
    } else {
      aliceTalkAnimFrame = 0; 
    }
    aliceSgW = imgAliceTalkSprite.width / aliceTalkTotalFrames;
    aliceSgH = imgAliceTalkSprite.height;
    aliceSx = aliceTalkAnimFrame * aliceSgW;
  } else {
    currentAliceImg = imgAliceWalkSprite;
    if (isAliceMoving) {
      if (frameCount % 4 === 0) {
        aliceWalkAnimFrame = (aliceWalkAnimFrame + 1) % aliceWalkTotalFrames;
      }
    } else {
      aliceWalkAnimFrame = 0; 
    }
    aliceSgW = imgAliceWalkSprite.width / aliceWalkTotalFrames;
    aliceSgH = imgAliceWalkSprite.height;
    aliceSx = aliceWalkAnimFrame * aliceSgW;
  }

  push();
  if (dogDir === "left") {
    translate(dogX + displayW, dogY);
    scale(-1, 1);
    image(imgDogSmileSprite, 0, 0, displayW, displayH, dogSx, 0, dogSgW, dogSgH);
  } else {
    translate(dogX, dogY);
    image(imgDogSmileSprite, 0, 0, displayW, displayH, dogSx, 0, dogSgW, dogSgH);
  }
  pop();

  fill(0);
  textSize(16);
  textStyle(BOLD);
  textAlign(CENTER);
  text("警犬皮皮 (Mentor)", dogX + displayW / 2, dogY + displayH + 25);

  push();
  if (storyStage !== 1 && aliceDir === "right") {
    translate(aliceX + displayW, aliceY);
    scale(-1, 1); 
    image(currentAliceImg, 0, 0, displayW, displayH, aliceSx, 0, aliceSgW, aliceSgH);
  } else {
    translate(aliceX, aliceY); 
    image(currentAliceImg, 0, 0, displayW, displayH, aliceSx, 0, aliceSgW, aliceSgH);
  }
  pop();

  fill(0);
  textSize(16);
  textStyle(BOLD);
  textAlign(CENTER);
  text("大眾代表 愛麗絲", aliceX + displayW / 2, aliceY + displayH + 25);
  textStyle(NORMAL);

  if (storyStage === 0) {
    drawHintBubble(aliceX + 20, aliceY - 80, "前面是科普警犬皮皮！\n按 ➡️ 或 D 鍵過去看看！");
  } 
  else if (storyStage === 1) {
    if (currentDiagIndex < dialogueScript.length) {
      let currentDiag = dialogueScript[currentDiagIndex];
      drawTheaterDialog(currentDiag.speaker, currentDiag.text);
    }
  } 
  else if (storyStage === 2) {
    drawKnowledgeCard(
      "🧠 ASPD 反社會人格三大核心特質",
      "1. 缺乏同理心與內疚感：\n   無法感同身受他人痛苦，傷害人不會自責。\n\n2. 擅長偽裝與表面魅力：\n   口才極佳且幽默，擅長利用欺騙來操縱他人。\n\n3. 衝動與漠視規則：\n   難以規劃未來，對法律與社會道德缺乏基本尊重。",
      "#f72585"
    );
  } 
  else if (storyStage === 3) {
    drawKnowledgeCard(
      "🛡️ 大眾面對高風險特質的自我保護原則",
      "● 觀察長期行為，而非表面言語：\n  不要只聽對方說什麼，要看他對待利益衝突與弱小動物的真實表現。\n\n● 建立清晰邊界，保持安全距離：\n  一旦發現嚴重欺騙或操縱傾向，切勿試圖改變對方。果斷保持社交距離！",
      "#4cc9f0"
    );
  }
}

function drawHintBubble(x, y, txt) {
  push();
  fill(0, 150);
  rect(x + 5, y + 5, 250, 70, 10);
  fill(255);
  stroke("#7209b7");
  strokeWeight(4);
  rect(x, y, 250, 70, 10);
  noStroke();
  fill(0);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(txt, x + 125, y + 35);
  pop();
}

function drawTheaterDialog(speaker, msg) {
  push();
  let boxW = width > 1000 ? 960 : width - 60;
  let boxH = 180; 
  let boxX = width / 2 - boxW / 2;
  let boxY = height - boxH - 30; 

  fill(0, 180); 
  rect(boxX + 8, boxY + 8, boxW, boxH, 8); 
  fill(248, 249, 250); 
  stroke(0); 
  strokeWeight(5); 
  rect(boxX, boxY, boxW, boxH, 8);

  noFill();
  stroke(speaker === "ALICE" ? "#f72585" : "#4361ee");
  strokeWeight(2);
  rect(boxX + 6, boxY + 6, boxW - 12, boxH - 12, 6);

  noStroke();
  fill(0); 
  rect(boxX + 34, boxY - 16, 170, 38, 4);
  fill(speaker === "ALICE" ? "#f72585" : "#4361ee"); 
  stroke(0);
  strokeWeight(3);
  rect(boxX + 30, boxY - 20, 170, 38, 4);
  
  noStroke();
  fill(255);
  textSize(18);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(speaker === "ALICE" ? "💬 愛麗絲 提問" : "💡 皮皮 隊長", boxX + 115, boxY - 1);

  fill(15);
  textSize(22);
  textStyle(BOLD);
  textLeading(36); 
  textAlign(LEFT, TOP);
  text(msg, boxX + 40, boxY + 36, boxW - 80, boxH - 60);

  let blink = floor(frameCount / 20) % 2; 
  if (blink === 0) {
    fill(speaker === "ALICE" ? "#f72585" : "#4361ee");
    textSize(14);
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text("▶ PRESS SPACE / CLICK TO NEXT", boxX + boxW - 40, boxY + boxH - 25);
  }
  pop();
}

function drawKnowledgeCard(title, content, themeColor) {
  push();
  let cardW = width > 900 ? 800 : width - 80;
  let cardH = 420;
  let cardX = width / 2 - cardW / 2;
  let cardY = height / 2 - cardH / 2;

  fill(0, 160);
  rect(cardX + 10, cardY + 10, cardW, cardH, 12);
  fill(255);
  stroke(0);
  strokeWeight(6);
  rect(cardX, cardY, cardW, cardH, 12);
  
  noFill();
  stroke(themeColor);
  strokeWeight(3);
  rect(cardX + 8, cardY + 8, cardW - 16, cardH - 16, 8);
  
  noStroke();
  fill(themeColor);
  rect(cardX + 11, cardY + 11, cardW - 22, 60, 4);
  stroke(0);
  strokeWeight(3);
  line(cardX + 8, cardY + 71, cardX + cardW - 8, cardY + 71);
  
  noStroke();
  fill(255);
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(title, width / 2, cardY + 41);
  
  fill(30);
  textStyle(BOLD);
  textSize(19);
  textLeading(32); 
  textAlign(LEFT, TOP);
  text(content, cardX + 45, cardY + 95, cardW - 90, cardH - 140);
  
  let blink = floor(frameCount / 25) % 2;
  if (blink === 0) {
    fill(100);
    textSize(14);
    textStyle(BOLD);
    textAlign(CENTER);
    text("【 點擊畫面 或 按空白鍵 關閉並進入測驗 】", width / 2, cardY + cardH - 30);
  }
  pop();
}

function advanceStory() {
  if (gameState === "STAGE1") {
    if (storyStage === 1) {
      currentDiagIndex++;
      if (currentDiagIndex >= dialogueScript.length) {
        storyStage = 2; 
      }
    } else if (storyStage === 2) {
      storyStage = 3; 
    } else if (storyStage === 3) {
      gameState = "STAGE_TRANSITION";
    }
  }
}

function resetGame() {
  // 1. 重置所有狀態
  gameState = "START_MENU";
  storyStage = 0;
  currentDiagIndex = 0;
  currentQIndex = 0;
  quizSolved = false;
  allCompleted = false;
  s3QIndex = 0;
  s3Score = 0;
  s3Finished = false;
  s3Result = null;
  
  // 2. 隱藏所有階段性按鈕
  restartBtn.hide();
  captureBtn.hide();
  transitionBtn.hide();
  
  // 3. 重置攝影機 (如果有的話)
  if (video) {
    video.play();
  }
}

function drawStageTransition() {
  // 1. 使用載入好的背景圖
  image(imgBg1, 0, 0, width, height);
  
  // 2. 加入深色半透明遮罩，增加文字可讀性與深度感
  fill(0, 160);
  rect(0, 0, width, height);

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  // --- 繪製中央提示卡片 ---
  let cardW = 850;
  let cardH = 360;
  fill(255, 245);
  stroke("#f72585");
  strokeWeight(5);
  rect(width / 2, height / 2 - 20, cardW, cardH, 20);
  
  // --- 標題：加入發光特效 ---
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = "#4cc9f0";
  fill("#3f37c9");
  textSize(42);
  textStyle(BOLD);
  text("🎉 第一階段：核心導讀完成！", width / 2, height / 2 - 130);
  
  drawingContext.shadowBlur = 0; // 關閉發光，保持內文清晰
  noStroke();
  fill(30);
  textSize(24);
  text("準備好接受「手勢觀念測驗」了嗎？", width / 2, height / 2 - 70);
  
  // --- 操作說明區塊 ---
  fill("#e7c6ff");
  rect(width / 2, height / 2 + 30, cardW - 100, 100, 12);
  fill(0);
  textSize(18);
  textStyle(NORMAL);
  text("💡 快速上手指南：\n請舉起手面向鏡頭，移動螢幕上的【瞄準準星】觸碰選項，\n「懸停懸停 1.5 秒」即可自動確認答案！", width / 2, height / 2 + 30);
  pop();

  transitionBtn.show();
  transitionBtn.position(width / 2 - 160, height / 2 + 180);
}

// ==========================================
// 【第二階段：視訊手勢互動測驗】
// ==========================================
function drawStage2() {
  captureBtn.show();
  captureBtn.position(width / 2 - 120, height - 45);
  
  // 1. 繪製背景圖
  image(imgBg2, 0, 0, width, height);

  // 2. 渲染橢圓鏡像視訊
  videoLayer.clear();
  videoLayer.push();
  videoLayer.drawingContext.beginPath();
  videoLayer.drawingContext.ellipse(vidW / 2, vidH / 2, vidW / 2, vidH / 2, 0, 0, TWO_PI);
  videoLayer.drawingContext.clip();

  videoLayer.translate(vidW, 0);
  videoLayer.scale(-1, 1);
  videoLayer.image(video, 0, 0, vidW, vidH); 
  videoLayer.pop();

  image(videoLayer, vidX, vidY);

  // 3. 外層金邊裝飾
  noFill();
  stroke("#d4af37"); 
  strokeWeight(4);
  ellipse(vidX + vidW / 2, vidY + vidH / 2, vidW, vidH);
  noStroke();

  // 4. 繪製選項卡片（完成所有題目後隱藏）
  if (!allCompleted) drawInVideoOptions();

  // 手勢偵測與瞄準器畫在最上層
  if (isModelLoaded && predictions.length > 0) {
    drawHandSkeletonAndDetect(predictions[0]);
  } else if (!allCompleted) {
    rectMode(CENTER);
    fill(74, 14, 78, 200); 
    rect(width / 2, height - 70, 380, 40, 5);
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("📷 請舉起手面向攝影機，正在捕捉手部節點...", width / 2, height - 70);
    rectMode(CORNER);
  }

  if (feedbackTimer > 0 || quizSolved || allCompleted) {
    drawQuizFeedback();
    if (feedbackTimer > 0) feedbackTimer--;
  }

  // 最上層：標題與問題文字（含底框與陰影）
  push();
  // 底框
  let qBoxW = 920;
  let qBoxH = 110;
  let qBoxX = width / 2 - qBoxW / 2;
  let qBoxY = 15;
  fill(255, 220);
  stroke("#d4af37");
  strokeWeight(2);
  rect(qBoxX, qBoxY, qBoxW, qBoxH, 10);
  noStroke();

  drawingContext.shadowColor = "rgba(0,0,0,0.6)";
  drawingContext.shadowBlur = 10;
  drawingContext.shadowOffsetX = 3;
  drawingContext.shadowOffsetY = 3;
  fill("#4a0e4e");
  textSize(32);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  text(`【第二階段：測驗中 (${currentQIndex + 1}/${questions.length})】`, width / 2, 22);
  textSize(22);
  textLeading(28);
  fill("#7b2cbf");
  text("問題：" + questions[currentQIndex].q, width / 2 - 440, 62, 880, 70);
  textStyle(NORMAL);
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  pop();
}

// ==========================================
// 🎯【核心修正：選項文字方塊精準定位】
// ==========================================
function drawInVideoOptions() {
  let curQ = questions[currentQIndex];
  push();
  rectMode(CENTER);

  let hdrH   = optH * 0.13;   // 標題列高度
  let hdrY   = -optH / 2 + hdrH;
  let txtX   = -optW / 2 + optW * 0.18 + 90;
  let txtY   = -optH / 2 + optH * 0.30 + 50;
  let txtW   = optW * 0.76;
  let txtH   = optH * 0.62;
  let tSize  = constrain(optW * 0.055, 12, 17);
  let tLead  = tSize * 1.5;

  // --- 選項 A (左側) ---
  push();
  let isHoverA = (hoverOption === 'A');
  let scaleA = isHoverA ? map(hoverCounter, 0, HOVER_THRESHOLD, 1.0, 1.1) : 1.0;
  let glowA  = isHoverA ? map(hoverCounter, 0, HOVER_THRESHOLD, 0, 30) : 0;
  translate(optAX + optW / 2, optAY + optH / 2);
  scale(scaleA);
  if (isHoverA) { drawingContext.shadowBlur = glowA; drawingContext.shadowColor = "#f72585"; }
  fill(0, 160); rect(5, 5, optW, optH, 12);
  fill(255, 240); stroke("#f72585"); strokeWeight(3); rect(0, 0, optW, optH, 8);
  noStroke(); drawingContext.shadowBlur = 0;
  fill("#6B3A2A"); rect(0, hdrY, optW, hdrH * 2, [12, 12, 0, 0]);
  fill(255); textSize(constrain(optW * 0.09, 14, 22)); textStyle(BOLD); textAlign(CENTER, CENTER);
  text("選項 A", 0, hdrY);
  fill(0); textSize(tSize); textLeading(tLead); textStyle(NORMAL); textAlign(LEFT, TOP);
  text(curQ.a, txtX, txtY, txtW, txtH);
  pop();

  // --- 選項 B (右側) ---
  push();
  let isHoverB = (hoverOption === 'B');
  let scaleB = isHoverB ? map(hoverCounter, 0, HOVER_THRESHOLD, 1.0, 1.1) : 1.0;
  let glowB  = isHoverB ? map(hoverCounter, 0, HOVER_THRESHOLD, 0, 30) : 0;
  translate(optBX + optW / 2, optBY + optH / 2);
  scale(scaleB);
  if (isHoverB) { drawingContext.shadowBlur = glowB; drawingContext.shadowColor = quizSolved ? "#4cc9f0" : "#7209b7"; }
  fill(0, 160); rect(5, 5, optW, optH, 12);
  if (quizSolved && curQ.correct === 'B') fill(230, 255, 235); else fill(255, 240);
  stroke(quizSolved ? "#4cc9f0" : "#7209b7"); strokeWeight(3); rect(0, 0, optW, optH, 12);
  noStroke(); drawingContext.shadowBlur = 0;
  fill("#6B3A2A"); rect(0, hdrY, optW, hdrH * 2, [12, 12, 0, 0]);
  fill(255); textSize(constrain(optW * 0.09, 14, 22)); textStyle(BOLD); textAlign(CENTER, CENTER);
  text("選項 B", 0, hdrY);
  fill(0); textSize(tSize); textLeading(tLead); textStyle(NORMAL); textAlign(LEFT, TOP);
  text(curQ.b, txtX, txtY, txtW, txtH);
  pop();
  pop();
}

function drawHandSkeletonAndDetect(hand) {
  let keypoints = hand.landmarks;
  let pX = vidX + (vidW - keypoints[8][0]);
  let pY = vidY + keypoints[8][1];
  
  drawHoverUI(pX, pY);

  let hitA = (pX > optAX && pX < optAX + optW && pY > optAY && pY < optAY + optH);
  let hitB = (pX > optBX && pX < optBX + optW && pY > optBY && pY < optBY + optH);
  let cBtnX = width / 2 - nextBtnW / 2;
  let cBtnY = height / 2 - nextBtnH / 2;
  let hitNext = allCompleted && (pX > cBtnX && pX < cBtnX + nextBtnW && pY > cBtnY && pY < cBtnY + nextBtnH);

  if (hitA) handleHover('A');
  else if (hitB) handleHover('B');
  else if (hitNext) handleHover('NEXT');
  else {
    hoverOption = null;
    hoverCounter = 0;
  }
}

function handleHover(opt) {
  if (quizSolved && opt !== 'NEXT') return; 

  if (hoverOption === opt) {
    hoverCounter++;
    if (hoverCounter >= HOVER_THRESHOLD) {
      if (opt === 'NEXT') {
        // 停止攝影機與手部辨識以節省效能
        if (video) { video.pause(); video.hide(); }
        if (handpose) { handpose.removeAllListeners(); }
        predictions = [];
        // 完整重置第三階段
        particles = [];
        s3QIndex = 0; s3Score = 0; s3Finished = false; s3Result = null;
        s3Bubbles = []; s3Distractors = [];
        loadS3Question();
        gameState = "STAGE3";
      } else {
        checkAnswer(opt);
      }
      hoverCounter = 0;
      hoverOption = null;
    }
  } else {
    hoverOption = opt;
    hoverCounter = 0;
  }
}

function checkAnswer(choice) {
  if (questions[currentQIndex].correct === choice) {
    quizFeedback = "CORRECT";
    quizSolved = true;
    if (currentQIndex === questions.length - 1) {
      allCompleted = true;
    } else {
      // 答對後 1.5 秒自動進入下一題
      setTimeout(() => {
        if (gameState === "STAGE2" && !allCompleted) {
          currentQIndex++;
          quizSolved = false;
          quizFeedback = "";
        }
      }, 1500);
    }
  } else {
    quizFeedback = "WRONG";
    feedbackTimer = 60;
  }
}

function drawHoverUI(pX, pY) {
  push();
  rectMode(CENTER);
  noFill(); stroke(255, 0, 0, 200); strokeWeight(3);
  rect(pX, pY, 50, 50, 5);
  line(pX - 35, pY, pX + 35, pY);
  line(pX, pY - 35, pX, pY + 35);

  if (hoverCounter > 0) {
    noStroke(); fill(255, 255, 0, 150);
    let arcSize = map(hoverCounter, 0, HOVER_THRESHOLD, 0, TWO_PI);
    arc(pX, pY, 60, 60, -HALF_PI, arcSize - HALF_PI);
  }
  pop();
}

function drawQuizFeedback() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  if (quizFeedback === "CORRECT") {
    if (!allCompleted) {
      // 答對單題提示
      fill(255, 250); stroke("#4cc9f0"); strokeWeight(5);
      rect(width / 2, vidY + vidH / 2 - 40, 480, 120, 15);
      noStroke(); fill("#4cc9f0"); textSize(30); textStyle(BOLD);
      text("🌟 太強了！觀念正確！", width / 2, vidY + vidH / 2 - 70);
      textSize(15); fill(40); textStyle(NORMAL);
      text("正在解鎖下一道知識防線，繼續保持！", width / 2, vidY + vidH / 2 - 20);
      pop();
      return;
    }

    // 全部完成：暗色遮罩讓按鈕突出
    fill(0, 160);
    rect(width / 2, height / 2, width, height);

    // 恭喜訊息框
    fill(255, 250); stroke("#4cc9f0"); strokeWeight(5);
    rect(width / 2, height / 2 - 100, 500, 130, 15);
    noStroke(); fill("#4cc9f0"); textSize(30); textStyle(BOLD);
    text("🏆 觀念大師！全對達成！", width / 2, height / 2 - 125);
    textSize(15); fill(40); textStyle(NORMAL);
    text("你已完成所有觀念測驗！\n請指著下方按鈕進入最後階段。", width / 2, height / 2 - 80);

    // 進入下一關按鈕
    let pulse = sin(frameCount * 0.1) * 3;
    let bW = nextBtnW + pulse, bH = nextBtnH + pulse;
    let bX = width / 2 - bW / 2;
    let bY = height / 2 - bH / 2;
    rectMode(CORNER);
    fill(0, 130); rect(bX + 6, bY + 6, bW, bH, 10);
    fill(hoverOption === 'NEXT' ? "#f72585" : "#7209b7");
    stroke(255); strokeWeight(3); rect(bX, bY, bW, bH, 10);
    noStroke(); fill(255); textSize(19); textStyle(BOLD); textAlign(CENTER, CENTER);
    text("🎮 進入下一關：觀念爆破", bX + bW / 2, bY + bH / 2);

    // 手勢瞄準器畫在最上層（重新呼叫）
    if (isModelLoaded && predictions.length > 0) {
      let kp = predictions[0].landmarks;
      let pX = vidX + (vidW - kp[8][0]);
      let pY = vidY + kp[8][1];
      drawHoverUI(pX, pY);
    }

  } else if (quizFeedback === "WRONG") {
    fill(255, 245); stroke("#f72585"); strokeWeight(5);
    rect(width / 2, vidY + vidH / 2, 340, 90, 15);
    noStroke(); fill("#f72585"); textSize(28); textStyle(BOLD);
    text("❌ 答錯囉，再試一次！", width / 2, vidY + vidH / 2 - 15);
    textSize(15); fill(50); textStyle(BOLD);
    text("再想想看！結合剛才皮皮警犬講的核心喔！", width / 2, vidY + vidH / 2 + 20);
  }
  pop();
}

// ==========================================
// 【第三階段：點擊爆破遊戲】
// ==========================================
const stage3Questions = [
  {
    q: "根據 DSM-5 診斷標準，反社會人格障礙（ASPD）患者必須具備什麼特徵？",
    options: [
      { label: "A: 嚴重社交恐懼", correct: false, color: "#4cc9f0" },
      { label: "B: 漠視並侵犯他人權益", correct: true,  color: "#f72585" },
      { label: "C: 強烈強迫症狀", correct: false, color: "#4361ee" }
    ]
  },
  {
    q: "心理醫學上，ASPD「正式確診」的最低年齡限制是幾歲？",
    options: [
      { label: "A: 須年滿 15 歲", correct: false, color: "#4cc9f0" },
      { label: "B: 須年滿 18 歲", correct: true,  color: "#f72585" },
      { label: "C: 須年滿 20 歲", correct: false, color: "#4361ee" }
    ]
  },
  {
    q: "在 15 歲之前，ASPD 患者通常必須有哪種障礙的臨床證據？",
    options: [
      { label: "A: 行為規範障礙", correct: true,  color: "#f72585" },
      { label: "B: 注意力不足過動", correct: false, color: "#4cc9f0" },
      { label: "C: 學習障礙", correct: false, color: "#4361ee" }
    ]
  },
  {
    q: "以下哪一項是 ASPD 患者在人際互動中最致命的核心特質？",
    options: [
      { label: "A: 極度自卑與退縮", correct: false, color: "#4cc9f0" },
      { label: "B: 缺乏同理心與懊悔感", correct: true,  color: "#f72585" },
      { label: "C: 過度依賴他人", correct: false, color: "#4361ee" }
    ]
  },
  {
    q: "面對身邊具有高風險 ASPD 特質的人，大眾最科學的自我保護態度是什麼？",
    options: [
      { label: "A: 用大量愛心感化對方", correct: false, color: "#4cc9f0" },
      { label: "B: 建立邊界並保持距離", correct: true,  color: "#f72585" },
      { label: "C: 當面嚴厲指責與爭辯", correct: false, color: "#4361ee" }
    ]
  }
];

let s3QIndex = 0;          // 目前第幾關
let s3Bubbles = [];        // 主要選項泡泡
let s3Distractors = [];    // 干擾球
let s3StartTime = 0;       // 本題開始時間（毫秒）
let s3LastDistractor = 0;  // 上次生成干擾球的時間
let s3Result = null;       // "CORRECT" | "WRONG" | null
let s3ResultTimer = 0;
let s3Score = 0;
let s3Finished = false;
let s3AutoNext = 0; // 答對後自動進題的時間點

const S3_TIME_LIMIT   = 15000;  // 15秒答題時間
const S3_DISTRACT_START = 500;  // 0.5秒後開始出現干擾球
const S3_DISTRACT_INTERVAL = 450; // 每 0.45 秒一顆

function initStage3() {
  s3QIndex = 0;
  s3Score = 0;
  s3Finished = false;
  s3AutoNext = 0;
  s3Result = null;
  s3ResultTimer = 0;
  s3Bubbles = [];
  s3Distractors = [];
  particles = [];
  bubbles = [];
  playerBullet = null;
  s3StartTime = 0; // 延遲到 loadS3Question 再設定
  loadS3Question();
}

function loadS3Question() {
  s3Bubbles = [];
  s3Distractors = [];
  s3Result = null;
  s3ResultTimer = 0;
  particles = []; // 每題開始清除殘留粒子
  s3StartTime = millis();
  s3LastDistractor = millis();

  let q = stage3Questions[s3QIndex];
  let positions = [
    { x: width * 0.25, y: height * 0.45 },
    { x: width * 0.50, y: height * 0.38 },
    { x: width * 0.75, y: height * 0.45 }
  ];
  for (let i = 0; i < 3; i++) {
    s3Bubbles.push({
      x: positions[i].x, y: positions[i].y,
      r: 80,
      label: q.options[i].label,
      correct: q.options[i].correct,
      color: q.options[i].color,
      alive: true,
      vx: random(-1.5, 1.5),
      vy: random(-1.5, 1.5)
    });
  }
}

function drawStage3() {
  if (captureBtn) captureBtn.hide();
  image(imgBg1, 0, 0, width, height);
  
  // --- 優先檢查是否已完成所有關卡 ---
  if (s3Finished) {
    push();
    fill(0, 210); // 深色背景讓結尾更突出
    rect(0, 0, width, height);
    rectMode(CENTER);
    fill(255, 252);
    stroke("#ff00bd"); strokeWeight(6); 
    rect(width / 2, height / 2, 650, 320, 25);
    noStroke();
    
    fill("#3f37c9"); textSize(42); textStyle(BOLD); textAlign(CENTER, CENTER);
    text("🎓 恭喜圓滿通關 🎓", width / 2, height / 2 - 100);
    
    fill(0); textSize(24);
    text("你已成功識破 ASPD 的迷思並守護了心理邊界！", width / 2, height / 2 - 30);
    
    fill("#f72585"); textSize(32); textStyle(BOLD);
    text("最終成就分： " + s3Score, width / 2, height / 2 + 35);
    
    fill(60); textSize(18); textStyle(NORMAL);
    text("感謝參與這趟學習旅程，現在你擁有更強大的心理力量！", width / 2, height / 2 + 95);

    // 顯示重新挑戰按鈕
    restartBtn.show();
    restartBtn.position(width / 2 - 65, height / 2 + 125);
    pop();
    return; // 直接結束函式，不執行後續題目讀取
  }

  let q = stage3Questions[s3QIndex]; // 此時 s3QIndex 必定在 0~4 之間
  let elapsed = millis() - s3StartTime;

  // --- 標題底框 ---
  push();
  fill(255, 220);
  stroke("#d4af37");
  strokeWeight(2);
  rect(width / 2 - 480, 12, 960, 100, 10);
  noStroke();
  fill("#3f37c9");
  textSize(26);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  text(`【第三階段：觀念爆破 關卡 ${s3QIndex + 1}／${stage3Questions.length}】`, width / 2, 18);
  textSize(18);
  fill(30);
  text(q.q, width / 2 - 460, 52, 920, 60);
  textStyle(NORMAL);
  pop();

  // --- 得分 ---
  push();
  fill("#7209b7");
  textSize(20);
  textStyle(BOLD);
  textAlign(RIGHT, TOP);
  text("得分：" + s3Score, width - 30, 18);
  pop();

  // --- 計時條 ---
  if (s3Result === null) {
    let ratio = constrain(1 - elapsed / S3_TIME_LIMIT, 0, 1);
    let barW = width * 0.6;
    let barX = width / 2 - barW / 2;
    let barY = 120;
    push();
    fill(0, 80);
    rect(barX, barY, barW, 16, 8);
    fill(ratio > 0.4 ? "#4cc9f0" : "#f72585");
    rect(barX, barY, barW * ratio, 16, 8);
    pop();

    // 超時判定
    if (elapsed > S3_TIME_LIMIT) {
      s3Result = "WRONG";
      s3ResultTimer = 120;
    }

    // 干擾球生成
    if (elapsed > S3_DISTRACT_START && millis() - s3LastDistractor > S3_DISTRACT_INTERVAL) {
      s3LastDistractor = millis();
      let distColors = ["#ff6b6b","#ffd166","#06d6a0","#118ab2","#073b4c"];
      s3Distractors.push({
        x: random(80, width - 80),
        y: random(160, height - 120),
        r: random(28, 48),
        color: random(distColors),
        vx: random(-2, 2),
        vy: random(-2, 2)
      });
    }
  }

  // --- 繪製干擾球 ---
  for (let d of s3Distractors) {
    d.x += d.vx; d.y += d.vy;
    if (d.x < d.r || d.x > width - d.r) d.vx *= -1;
    if (d.y < 140 || d.y > height - d.r) d.vy *= -1;
    push();
    noStroke();
    fill(d.color);
    ellipse(d.x, d.y, d.r * 2);
    fill(255, 180);
    textSize(11);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("✗", d.x, d.y);
    pop();
  }

  // --- 繪製主要泡泡（含晃動）---
  for (let b of s3Bubbles) {
    if (!b.alive) continue;
    // 移動
    b.x += b.vx; b.y += b.vy;
    if (b.x < b.r + 20 || b.x > width - b.r - 20) b.vx *= -1;
    if (b.y < 150 || b.y > height - b.r - 20) b.vy *= -1;
    push();
    noStroke();
    // 發光效果
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = b.color;
    fill(b.color);
    ellipse(b.x, b.y, b.r * 2);
    drawingContext.shadowBlur = 0;
    fill(255);
    textSize(15);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    textLeading(20);
    text(b.label, b.x, b.y, b.r * 1.7, b.r * 1.7);
    pop();
  }

  // --- 粒子效果 ---
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  // --- 結果反饋 ---
  if (s3Result !== null) {
    push();
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    if (s3Result === "CORRECT") {
      fill(255, 245);
      stroke("#4cc9f0"); strokeWeight(4);
      rect(width / 2, height / 2, 400, 110, 15);
      noStroke();
      fill("#4cc9f0"); textSize(32); textStyle(BOLD);
      text("✨ 完美爆破！正確！ ✨", width / 2, height / 2 - 22);
      fill(40); textSize(16); textStyle(NORMAL);
      text(s3QIndex + 1 < stage3Questions.length ? "1 秒後自動進入下一關..." : "1 秒後查看結果...", width / 2, height / 2 + 22);
    } else {
      fill(255, 245);
      stroke("#f72585"); strokeWeight(4);
      rect(width / 2, height / 2, 420, 110, 15);
      noStroke();
      fill("#f72585"); textSize(32); textStyle(BOLD);
      text("❌ 時間到！答錯了", width / 2, height / 2 - 22);
      fill(40); textSize(16); textStyle(NORMAL);
      text(s3QIndex + 1 < stage3Questions.length ? "點擊畫面繼續下一關" : "點擊畫面查看結果", width / 2, height / 2 + 22);
    }
    pop();
    if (s3ResultTimer > 0) s3ResultTimer--;
    // 答對自動進下一題
    if (s3Result === "CORRECT" && s3AutoNext > 0 && millis() > s3AutoNext) {
      s3AutoNext = 0;
      s3QIndex++;
      if (s3QIndex >= stage3Questions.length) { s3Finished = true; }
      else { particles = []; loadS3Question(); }
    }
  }

  // 操作提示
  if (s3Result === null) {
    push();
    fill(0, 140);
    rect(width / 2 - 220, height - 40, 440, 30, 8);
    fill(255); textSize(13); textAlign(CENTER, CENTER); textStyle(NORMAL);
    text("🖱️ 點擊正確答案泡泡爆破它！", width / 2, height - 25);
    pop();
  }
}

function s3HandleClick(mx, my) {
  if (s3Finished) return;

  if (s3Result !== null) {
    // 答對由自動進題處理，點擊無效
    if (s3Result === "CORRECT") return;
    // 答錯或超時：點擊才進下一關
    if (s3ResultTimer > 0) return;
    s3QIndex++;
    if (s3QIndex >= stage3Questions.length) {
      s3Finished = true;
    } else {
      particles = [];
      loadS3Question();
    }
    return;
  }

  // 點擊主要泡泡
  for (let b of s3Bubbles) {
    if (!b.alive) continue;
    if (dist(mx, my, b.x, b.y) < b.r) {
      b.alive = false;
      triggerExplosion(b.x, b.y, b.color);
      if (b.correct) {
        s3Score += 100;
        s3Result = "CORRECT";
      } else {
        s3Result = "WRONG";
      }
      s3ResultTimer = 80;
      if (b.correct) s3AutoNext = millis() + 1000; // 答對 1 秒後自動進下一題
      return;
    }
  }
}

function triggerExplosion(x, y, col) {
  for (let i = 0; i < 45; i++) { particles.push(new Particle(x, y, col)); }
}

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1.5, 5));
    this.alpha = 180;
    this.color = col;
    this.size = random(18, 50);   // 較大泡泡
    this.shrink = random(0.96, 0.99); // 慢慢縮小
  }
  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.97);          // 阻力輕一點，飄得遠
    this.size *= this.shrink;
    this.alpha -= 2.5;            // 淡出更緩慢
  }
  display() {
    push();
    let baseC = color(this.color);
    // 外圈光暈（極透明填色）
    baseC.setAlpha(this.alpha * 0.15);
    fill(baseC);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size * 1.4);
    // 主泡泡（半透明填色）
    baseC.setAlpha(this.alpha * 0.28);
    fill(baseC);
    ellipse(this.pos.x, this.pos.y, this.size);
    // 邊框（較亮）
    baseC.setAlpha(this.alpha * 0.85);
    noFill();
    stroke(baseC);
    strokeWeight(1.5);
    ellipse(this.pos.x, this.pos.y, this.size);
    // 高光小點
    baseC.setAlpha(this.alpha * 0.9);
    fill(baseC);
    noStroke();
    ellipse(this.pos.x - this.size * 0.18, this.pos.y - this.size * 0.18, this.size * 0.18);
    pop();
  }
  isDead() { return this.alpha <= 0 || this.size < 3; }
}

function drawStatusMessage() {
  push();
  fill(0, 170);
  rect(15, 15, 520, 40, 8);
  fill(255);
  textSize(13);
  textAlign(LEFT, CENTER);
  text("系統偵測 ➔ " + modelStatusMsg, 25, 35);
  pop();
}

function customizeButton(btn) {
  btn.style("padding", "10px 22px");
  btn.style("background-color", "#7209b7");
  btn.style("color", "#fff");
  btn.style("border", "none");
  btn.style("border-radius", "25px");
  btn.style("cursor", "pointer");
  btn.style("font-weight", "bold");
}

function saveImageSnapshot() {
  let snapshot = createGraphics(vidW, vidH);
  snapshot.push();
  snapshot.translate(vidW, 0);
  snapshot.scale(-1, 1);
  snapshot.image(video, 0, 0, vidW, vidH);
  snapshot.pop();
  save(snapshot, "ASPD_Camera_Snapshot.jpg");
}

function mousePressed() {
  advanceStory();
  if (gameState === "STAGE3") {
    s3HandleClick(mouseX, mouseY);
  }
}

function keyPressed() {
  if (keyCode === 32) { 
    if (gameState === "STAGE1") { advanceStory(); }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalcLayout();
}