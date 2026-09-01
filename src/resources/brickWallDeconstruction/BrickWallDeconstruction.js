let checkpoints= globalThis.checkpoints;

for (let i= 0; i < checkpoints.length; i++) {
  checkpoints[i] = Utils.normalize(checkpoints[i]);
  }

const solutionLength= Math.min(...checkpoints.map(s => s.length));
const solutions= checkpoints.filter(s => s.length === solutionLength);

let currentCheckpointStack= [];
let glowTimeout= null;
const score= BrickWallDeconstructionScore();

const hintChar= document.getElementById("hintCharacter");
const displayPanicMessage= (msg, image) => {
  hintChar.querySelector(".panicImg").src = "../../assets/panic/" + image;
  const speechBubble= hintChar.querySelector(".speechBubble");
  speechBubble.textContent = msg;
  hintChar.hidden = false;
  };

let vibratingBrick= null;

let brickWall= initBrickWall({
  wall,
  gameArea,
  movingBricksDiv,
  glideTime: 500,
  onBrickPickedUp: () => {
    if (vibratingBrick !== null) { vibratingBrick.classList.remove("vibrate"); }
    vibratingBrick = null;
    hintChar.hidden = true;
    },
  onBrickCommitted: () => {
    checkCheckpoint();
    },
  });

const initialWallText= brickWall.normaliseWallText();

const wallCorrectGlow= () => {
  wall.classList.add("correctGlow");
  clearTimeout(glowTimeout);
  glowTimeout = setTimeout(() => {
    wall.classList.remove("correctGlow");
    }, 3000);
  };

const checkCheckpoint= () => {
  const wallText= brickWall.normaliseWallText();
  let foundCheckpoint= null;
  for (const checkpoint of checkpoints) {
    if (wallText === checkpoint) {
      foundCheckpoint = checkpoint;
      break;
      }
    }
  if (foundCheckpoint === null) { return; }
  const lastCheckpoint= currentCheckpointStack.at(-1);
  if (lastCheckpoint === undefined || foundCheckpoint.length < lastCheckpoint.raw.length) {
    console.log("New Checkpoint: " + wallText);
    const oldLength= lastCheckpoint === undefined ? initialWallText.length : lastCheckpoint.raw.length;
    score.doSuccess(oldLength - foundCheckpoint.length);
    const wallCopy= bottom.cloneNode(true);
    currentCheckpointStack.push({
      element: wallCopy,
      raw: foundCheckpoint
      });
    if (solutions.includes(wallText)) {
      onComplete();
      return;
      }
    Utils.flashImage("rgba(0, 0, 0, 0)","levelEndCharacter","translateY(-5%)");
    wallCorrectGlow();
    }
  };

const onComplete= () => {
  Utils.flashImage("rgba(0, 250, 0, 0.5)","levelEndCharacter","translateY(-5%)");
  const nextLevelUrl= MetaData.str(document.body, "next");
  Utils.checkExists(nextLevelUrl);
  setTimeout(() => window.location.href = nextLevelUrl, 5000);
  };

const checkpointReturn= () => {
  console.log(currentCheckpointStack);
  if (currentCheckpointStack.length === 0) { return; }
  const wallCopy= currentCheckpointStack.at(-1).element.cloneNode(true);
  bottom.replaceWith(wallCopy);
  bottom = wallCopy;
  wall = Utils.getElementById("wall");
  brickWall = initBrickWall({
    wall,
    gameArea,
    movingBricksDiv,
    glideTime: 500,
    onBrickPickedUp: () => {
      if (vibratingBrick !== null) { vibratingBrick.classList.remove("vibrate"); }
      vibratingBrick = null;
      hintChar.hidden = true;
      },
    onBrickCommitted: () => {
      checkCheckpoint();
      },
    });
  };

const buttonActions= {
  checkpointReturnBtn: checkpointReturn,
  hintBtn: () => {},
  };
const Buttons= initButtons(() => {}, buttonActions);

console.log(checkpoints);
