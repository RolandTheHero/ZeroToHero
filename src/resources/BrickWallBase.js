// Shared initialization
let wall= Utils.getElementById("wall");
const gameArea= Utils.getElementById("gameArea");
const movingBricksDiv= Utils.getElementById("movingBricks");
const glideTime= 500;

// Initialize BrickWall base game mechanics
// Called by specialized BrickWall implementations (each passes their own wall)
const initBrickWall= (config) => {
  const {
    wall,
    gameArea,
    movingBricksDiv,
    glideTime = 500,
    onBrickPickedUp,
    onBrickCommitted,
  } = config;

  const space= "\u00A0";

  let dragging= false;
  let gliding= false;
  let currentEmpty= null;
  let lastSpot= null;
  let ghostBrick= null;
  const movableBrickEventListeners= new Map();

  const isEmpty= e => e && e.classList && e.classList.contains("empty");

  const findSlot= (startSpan, length) => {
    const slot= [];
    let cur= startSpan;
    while (cur && slot.length < length && isEmpty(cur)) {
      slot.push(cur);
      cur = cur.nextElementSibling;
      }
    return slot.length === length ? slot : null;
    };

  const getBrickPosFromMouse= (brick, event) => {
    const rect= brick.getBoundingClientRect();
    const gameAreaRect= gameArea.getBoundingClientRect();
    return [event.clientX - gameAreaRect.left - rect.width/2, event.clientY - gameAreaRect.top - rect.height/2];
    };

  const createGhost= e => {
    const ghost= document.createElement("span");
    ghost.textContent = e.textContent;
    ghost.className = "brick movable ghost";
    ghost.style.position = "absolute";
    movingBricksDiv.appendChild(ghost);
    return ghost;
    };

  const setEmpty= e => {
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
    };

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
      onBrickPickedUp?.();
      };
    e.addEventListener("pointerdown", handler);
    movableBrickEventListeners.set(e, handler);
    };

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
    };

  const commitBrick= (slot, text) => {
    const parent= slot[0].parentElement;
    const ref= slot[0];
    const placed= document.createElement("span");
    placed.textContent = text;
    placed.className = "brick movable";
    parent.insertBefore(placed, ref);
    slot.forEach(s => s.remove());
    registerMovable(placed);
    onBrickCommitted?.();
    };

  let sparkleInterval= null;

  const spawnSparkle= brick => {
    if (!brick) return;

    const brickRect= brick.getBoundingClientRect();
    const containerRect= movingBricksDiv.getBoundingClientRect();

    const sparkle= document.createElement("div");
    sparkle.className = "sparkle";

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

  const normaliseWallText= () => {
    let str= "";
    const brickRows= wall.querySelectorAll(".brickRow");
    brickRows.forEach(r => {
      [...r.children].forEach(c => { str += c.textContent; });
      str += "\n";
      });
    str = Utils.normalize(str);
    return str;
    };

  const getWallText= () => {
    let str= "";
    const brickRows= wall.querySelectorAll(".brickRow");
    brickRows.forEach(r => {
      [...r.children].forEach(c => { str += c.textContent; });
      str += "\n";
      });
    return str;
    };

  // Set up event listeners
  const brickRows= wall.querySelectorAll(".brickRow");
  const movableBricks= document.querySelectorAll(".brick.movable");
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
      }
    else {
      const pos= getBrickPosFromMouse(ghostBrick, e);
      ghostBrick.style.left = `${pos[0]}px`;
      ghostBrick.style.top = `${pos[1]}px`;
      currentEmpty = null;
      }
    });

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
      ghostBrick = null;
      dragging = false;
      currentEmpty = null;
      glideTo(ghost, slot, finish);
      }
    else {
      finish();
      }
    });

  return {
    registerMovable,
    normaliseWallText,
    getWallText,
    brickRows,
    };
  };
