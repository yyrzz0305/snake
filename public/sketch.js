// Create connection to Node.js Server
const socket = io();

let canvas;

let randomX;
let randomY;

let me; // for storing my socket.id
let experienceState = {
  users: {} // socket.id -> movement data
};

// Permission button (iOS)
let askButton;
let isMobileDevice = true;
let hasPermission = false;
let needsPermission = false;

// Device motion
let accX = 0;
let accY = 0;
let accZ = 0;
let rrateX = 0;
let rrateY = 0;
let rrateZ = 0;

// Device orientation
let rotateDegrees = 0;
let frontToBack = 0;
let leftToRight = 0;

// throttle device motion sending
let lastSent = 0;
const SEND_RATE = 30; // ms (~33 fps)

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container");

  //random position used for visualisation
  randomX = random(50, width - 50);
  randomY = random(50, height - 50);

  rectMode(CENTER);
  angleMode(DEGREES);

  //text styling
  textSize(16);
  textWrap(WORD);

  // simplified DESKTOP vs. MOBILE DETECTION
  isMobileDevice = checkMobileDevice();

  // iOS permission handling (robust)
  needsPermission =
    typeof DeviceMotionEvent?.requestPermission === "function" ||
    typeof DeviceOrientationEvent?.requestPermission === "function";

  if (needsPermission) {
    // add a button for permissions
    askButton = createButton("Enable Motion Sensors");
    askButton.id("permission-button");

    // IMPORTANT: make sure it is clickable above the canvas
    askButton.style("position", "fixed");
    askButton.style("left", "16px");
    askButton.style("top", "16px");
    askButton.style("z-index", "9999");
    askButton.style("font-size", "16px");
    askButton.style("padding", "10px 14px");

    // mobile: touchStarted is more reliable than mousePressed
    askButton.mousePressed(handlePermissionButtonPressed);
    askButton.touchStarted(handlePermissionButtonPressed);
  } else {
    // Android / non-permission devices
    startSensors();
    hasPermission = true;
  }
}

function draw() {
  background(240);

  //draw movers for everyone
  for (let id in experienceState.users) {
    //if I'm a moving device not a PC / laptop
    if (experienceState.users[id].deviceMoves) {
      drawOthers(id);
    }
  }

  // DESKTOP MESSAGE
  if (!isMobileDevice) {
    displayDesktopMessage();
  } else {
    // WAITING FOR PERMISSION
    if (!hasPermission) {
      displayPermissionMessage();
    } else {
      // MY MOBILE DEVICE
      //debug / show my own data
      visualiseMyData();

      // Send my data to the server (throttle via frameRate if needed)
      emitData();
    }
  }
}

// --------------------
// Custom Functions
// --------------------

//visualise other drawing
function drawOthers(id) {
  let u = experienceState.users[id];
  if (!u.motionData) return;

  let motion = u.motionData;

  let rectHeight = map(motion.orientation.beta, -90, 90, 0, height); //front to back is beta

  fill(0, 0, 255, 100); // slightly transparent
  push();
  rectMode(CORNER);
  noStroke();
  rect(motion.screenPosition.x, 0, 40, rectHeight);
  pop();
}

function visualiseMyData() {
  // Simple movement threshold visualisation
  let totalMovement = Math.abs(accX) + Math.abs(accY) + Math.abs(accZ);

  if (totalMovement > 2) {
    background(255, 0, 0, 50); // make it slightly transparent
  }

  // Orientation arrows
  push();
  fill(0);
  translate(width / 2, height / 2);

  if (frontToBack > 40) {
    push();
    rotate(180);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  } else if (frontToBack < 0) {
    triangle(-30, -40, 0, -100, 30, -40);
  }

  if (leftToRight > 20) {
    push();
    rotate(90);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  } else if (leftToRight < -20) {
    push();
    rotate(-90);
    triangle(-30, -40, 0, -100, 30, -40);
    pop();
  }

  pop();

  push();
  fill(255);
  rectMode(CORNER);
  rect(0, 20, width / 2, 190);
  pop();

  // Debug text
  fill(0);
  textAlign(LEFT);

  text("Acceleration:", 10, 40);
  text(
    accX.toFixed(2) + ", " + accY.toFixed(2) + ", " + accZ.toFixed(2),
    10,
    60
  );

  text("Rotation rate:", 10, 100);
  text(
    rrateX.toFixed(2) + ", " + rrateY.toFixed(2) + ", " + rrateZ.toFixed(2),
    10,
    120
  );

  text("Orientation:", 10, 160);
  text(
    rotateDegrees.toFixed(2) +
      ", " +
      leftToRight.toFixed(2) +
      ", " +
      frontToBack.toFixed(2),
    10,
    180
  );
}

// SEND DATA TO SERVER
function emitData() {
  // throttle
  let now = millis();
  if (now - lastSent < SEND_RATE) {
    return;
  }
  lastSent = now;

  let myMotionData = {
    screenPosition: {
      x: randomX,
      y: randomY
    },
    acceleration: {
      x: accX,
      y: accY,
      z: accZ
    },
    rotationRate: {
      alpha: rrateZ,
      beta: rrateX,
      gamma: rrateY
    },
    orientation: {
      alpha: rotateDegrees,
      beta: frontToBack,
      gamma: leftToRight
    }
  };

  // update experience state in my browser
  if (experienceState.users[me]) {
    experienceState.users[me].deviceMoves = true;
    experienceState.users[me].motionData = myMotionData;
  }

  socket.emit("motionData", myMotionData);
}

//not mobile message
function displayDesktopMessage() {
  fill(0);
  textAlign(CENTER);
  let message =
    "This is a mobile experience. Please also open this URL on your phone’s browser.";
  text(message, width / 2, 30, width);
}

function displayPermissionMessage() {
  fill(0);
  textAlign(CENTER);
  let message =
    "Waiting for motion sensor permission, tap the button (or tap the screen) to allow.";
  text(message, width / 2, 30, width);
}

// --------------------
// Socket events
// --------------------

// initial full state
socket.on("init", (data) => {
  me = data.id;
  experienceState = data.state;
  console.log(experienceState);
});

// someone joined
socket.on("userJoined", (data) => {
  experienceState.users[data.id] = data.user;
});

// someone left
socket.on("userLeft", (id) => {
  delete experienceState.users[id];
});

// someone moved
socket.on("userMoved", (data) => {
  let id = data.id;
  if (experienceState.users[id]) {
    experienceState.users[id].deviceMoves = data.deviceMoves;
    experienceState.users[id].motionData = data.motion;
  }
});

// --------------------
// Permission handling (robust)
// --------------------

function startSensors() {
  window.addEventListener("devicemotion", deviceMotionHandler, { passive: true });
  window.addEventListener("deviceorientation", deviceOrientationHandler, {
    passive: true
  });
}

async function handlePermissionButtonPressed() {
  try {
    // iOS: must be called from a user gesture (button/touch)
    if (typeof DeviceMotionEvent?.requestPermission === "function") {
      const motion = await DeviceMotionEvent.requestPermission();
      if (motion !== "granted") throw new Error("Motion permission denied");
    }

    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      const orient = await DeviceOrientationEvent.requestPermission();
      if (orient !== "granted") throw new Error("Orientation permission denied");
    }

    startSensors();
    hasPermission = true;

    if (askButton) {
      askButton.html("Sensors Enabled");
      askButton.attribute("disabled", "");
      askButton.style("opacity", "0.7");
    }
  } catch (err) {
    console.error(err);
    hasPermission = false;
    if (askButton) askButton.html("Permission Failed (tap again)");
  }
}

// iOS fallback: tapping the screen can also trigger permission
function touchStarted() {
  if (needsPermission && !hasPermission) {
    handlePermissionButtonPressed();
  }
  return false;
}

// --------------------
// Window Resize
// --------------------

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --------------------
// Sensor handlers
// --------------------

// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event
function deviceMotionHandler(event) {
  // iPhone sometimes provides only accelerationIncludingGravity
  const a = event.acceleration || event.accelerationIncludingGravity;
  if (!a || !event.rotationRate) return;

  //acceleration in meters per second^2
  accX = a.x || 0;
  accY = a.y || 0;
  accZ = a.z || 0;

  //degrees per second
  rrateZ = event.rotationRate.alpha || 0;
  rrateX = event.rotationRate.beta || 0;
  rrateY = event.rotationRate.gamma || 0;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
function deviceOrientationHandler(event) {
  rotateDegrees = event.alpha ?? 0;
  frontToBack = event.beta ?? 0;
  leftToRight = event.gamma ?? 0;
}

// --------------------
// Mobile Device Check
// --------------------

// Simple mobile device check using the browser's userAgent string
function checkMobileDevice() {
  let userAgent = navigator.userAgent;
  let mobileRegex = /Mobi|Android|iPhone|iPad|iPod/i;
  return mobileRegex.test(userAgent);
}
