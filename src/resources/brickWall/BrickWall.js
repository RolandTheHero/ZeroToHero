const wall= Utils.getElementById("wall");
const answerWall= Utils.getElementById("answerWall");
const brickRows= wall.querySelectorAll(".brickRow");
const movableBricks= document.querySelectorAll(".brick.movable");
const movingBricksDiv= Utils.getElementById("movingBricks");
const pile= Utils.getElementById("pile");
const gameArea= Utils.getElementById("gameArea");
const submitProgress= Utils.getElementById("submitProgress");

const solution= MetaData.str(wall, "solution");

const space= "\u00A0";

const glideTime= 500; // How long the snap-back glide takes

let dragging= false;
let gliding= false; // True while a rejected brick is animating home
let currentEmpty= null; // The current empty span the mouse is on while dragging
let lastSpot= null; // The space where the newly dragged brick just left

const isEmpty= e => e && e.classList && e.classList.contains("empty");

const setEmpty= e => { // Returns the first span of this group of empty
  const len= e.textContent.length;
  const parent= e.parentElement;
  e.removeEventListener("pointerdown", movableBrickEventListeners.get(e));
  movableBrickEventListeners.delete(e);
  let firstEmpty= null;
  for (let i= 0; i < len; i++) {
    const empty= document.createElement("span");
    empty.className = "empty";
    empty.textContent = space;
    parent.insertBefore(empty, e);
    if (i === 0) { firstEmpty = empty; }
    }
  lastSpot = findSlot(firstEmpty, ghostBrick.textContent.length);
  e.remove();
  }

const createGhost= e => {
  const ghost= document.createElement("span");
  ghost.textContent = e.textContent;
  ghost.className = "brick movable ghost";
  ghost.style.position = "absolute";
  movingBricksDiv.appendChild(ghost);
  return ghost;
  }

let ghostBrick= null;
const movableBrickEventListeners= new Map();

// Given an empty span the mouse is over, find the run of consecutive
// empty siblings starting at it that can fit the brick's length.
const findSlot= (startSpan, length) => {
  const slot= [];
  let cur= startSpan;
  while (cur && slot.length < length && isEmpty(cur)) {
    slot.push(cur);
    cur = cur.nextElementSibling;
    }
  return slot.length === length ? slot : null;
  }

const getBrickPosFromMouse= (brick, event) => {
  const rect= brick.getBoundingClientRect();
  const gameAreaRect= gameArea.getBoundingClientRect();
  return [event.clientX - gameAreaRect.left - rect.width/2, event.clientY - gameAreaRect.top - rect.height/2];
  }

const registerMovable= e => {
  const handler= event => {
    if (gliding) { return; }
    dragging = true;
    ghostBrick = createGhost(e);
    const pos= getBrickPosFromMouse(e, event);
    ghostBrick.style.left = `${pos[0]}px`;
    ghostBrick.style.top = `${pos[1]}px`;
    startSparkles(ghostBrick);
    setEmpty(e);
    answerWall.classList.add("hidden");
    };
  e.addEventListener("pointerdown", handler);
  movableBrickEventListeners.set(e, handler);
  }

movableBricks.forEach(b => registerMovable(b));

document.addEventListener("pointermove", e => {
  if (ghostBrick === null) { return; }

  ghostBrick.style.visibility = "hidden";
  const target= document.elementFromPoint(e.clientX, e.clientY);
  ghostBrick.style.visibility = "";

  const slot= isEmpty(target) ? findSlot(target, ghostBrick.textContent.length) : null;

  if (slot !== null) {
    const rect= slot[0].getBoundingClientRect();
    const gameAreaRect= gameArea.getBoundingClientRect();
    ghostBrick.style.left = `${rect.left - gameAreaRect.left}px`;
    ghostBrick.style.top = `${rect.top - gameAreaRect.top}px`;
    currentEmpty = slot[0];
    } else {
    const pos= getBrickPosFromMouse(ghostBrick, e);
    ghostBrick.style.left = `${pos[0]}px`;
    ghostBrick.style.top = `${pos[1]}px`;
    currentEmpty = null;
    }
  });

// Turn a run of empty spans into a single placed brick.
const commitBrick= (slot, text) => {
  const parent= slot[0].parentElement;
  const ref= slot[0];
  const placed= document.createElement("span");
  placed.textContent = text;
  placed.className = "brick movable";
  parent.insertBefore(placed, ref);
  slot.forEach(s => s.remove());
  registerMovable(placed);
  updateVisuals();
  }

// Ease the ghost from wherever it was dropped back onto its slot.
const glideTo= (ghost, slot, done) => {
  const rect= slot[0].getBoundingClientRect();
  const gameAreaRect= gameArea.getBoundingClientRect();
  const toX= rect.left - gameAreaRect.left;
  const toY= rect.top - gameAreaRect.top;
  const fromX= parseFloat(ghost.style.left) || 0;
  const fromY= parseFloat(ghost.style.top) || 0;

  if (Math.abs(toX - fromX) < 0.5 && Math.abs(toY - fromY) < 0.5) {
    done();
    return;
    }

  const start= performance.now();
  const step= t => {
    const progress= Math.min((t - start) / glideTime, 1);
    const eased= 1 - Math.pow(1 - progress, 3);
    ghost.style.left = `${fromX + (toX - fromX) * eased}px`;
    ghost.style.top = `${fromY + (toY - fromY) * eased}px`;
    if (progress < 1) { requestAnimationFrame(step); }
    else { done(); }
    };

  requestAnimationFrame(step);
  }

document.addEventListener("pointerup", e => {
  if (ghostBrick === null || gliding) { return; }
  ghostBrick.classList.remove("ghost");

  const text= ghostBrick.textContent;
  let slot= currentEmpty !== null ? findSlot(currentEmpty, text.length) : null;
  const snapBack= slot === null;
  if (snapBack) { slot = lastSpot; }

  const ghost= ghostBrick;
  const finish= () => {
    commitBrick(slot, text);
    ghost.remove();
    currentEmpty = null;
    ghostBrick = null;
    dragging = false;
    gliding = false;
    stopSparkles();
    };

  if (snapBack) {
    gliding = true;
    ghostBrick = null; // Stops pointermove from grabbing it mid-glide
    dragging = false;
    currentEmpty = null;
    glideTo(ghost, slot, finish);
    } else {
    finish();
    }
  });

const normaliseWallText= () => {
  let str= "";
  brickRows.forEach(r => {
    [...r.children].forEach(c => { str += c.textContent; });
    str += "\n";
    });
  str = Utils.normalize(str);
  console.log(str);
  return str;
  };

const onComplete= () => {
  Utils.flashImage("rgba(0, 250, 0, 0.5)","levelEndCharacter","translateY(-5%)");
  const nextLevelUrl= MetaData.str(document.body, "next");
  Utils.checkExists(nextLevelUrl);
  setTimeout(() => window.location.href = nextLevelUrl, 5000);
  };
const onFail= () => { console.log("Nay"); };

const checkSolution= () => {
  const wallText= normaliseWallText();
  if (wallText === Utils.normalize(solution)) { onComplete(); }
  else { onFail(); }
  };

const hint= () => {
  answerWall.classList.remove("hidden");
  };

const buttonActions= {
  submitBtn: checkSolution,
  hintBtn: hint,
  };
const Buttons= initButtons(() => {}, buttonActions);


let sparkleInterval= null;

const spawnSparkle= brick => {
  if (!brick) return;

  const brickRect= brick.getBoundingClientRect();
  const containerRect= movingBricksDiv.getBoundingClientRect();

  const sparkle= document.createElement("div");
  sparkle.className = "sparkle";

  // Random position within the brick
  const x= brickRect.left - containerRect.left + Math.random() * brickRect.width;
  const y= brickRect.top - containerRect.top + Math.random() * brickRect.height;

  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;

  gameArea.appendChild(sparkle);

  setTimeout(() => sparkle.remove(), 1000);
  };

const startSparkles= brick => {
  stopSparkles();
  sparkleInterval = setInterval(() => spawnSparkle(brick), 80);
  };

const stopSparkles= () => {
  if (sparkleInterval !== null) {
    clearInterval(sparkleInterval);
    sparkleInterval = null;
    }
  };

const enableSubmitButton= () => {
  submitBtn.classList.remove("transparent");
  submitBtn.disabled = false;
  //submitProgress.style.opacity = "0";
  };
const disableSubmitButton= () => {
  submitBtn.classList.add("transparent");
  submitBtn.disabled = true;
  //submitProgress.style.opacity = "1";
  };
disableSubmitButton();
enableSubmitButton();
let displayedPercent= 0;
const updateVisuals= () => {
  const wallText = normaliseWallText().replace(/[\s\u00A0]/g, "");
  const sol = Utils.normalize(solution).replace(/[\s\u00A0]/g, "");
  let correct = 0;
  for (let i = 0; i < sol.length; i++) {
    if (wallText[i] !== sol[i]) { break; }
    correct++;
    }
  const percent= correct / sol.length;
  disableSubmitButton();

  function animateProgress(toPercent, duration) {
    const fromPercent= displayedPercent;
    const start= performance.now();
    function frame(time) {
      const t = Math.min((time - start) / duration, 1);
      const progress = fromPercent + (toPercent - fromPercent) * t;
      submitProgress.style.setProperty("--progress", `${progress * 360}deg`);
      displayedPercent = progress;
      if (progress >= 1) {
        enableSubmitButton();
        }
      if (t < 1) {
        requestAnimationFrame(frame);
        } else {
        displayedPercent = toPercent;
        }
     }
    requestAnimationFrame(frame);
    };

  animateProgress(percent, 500);
  };

updateVisuals();