const showOnly = (selector, activeName) => {
  document.querySelectorAll(selector).forEach((view) => {
    const name = view.dataset.shellView || view.dataset.ladderView;
    view.classList.toggle("active", name === activeName);
  });
};

const shellStart = document.querySelector("[data-shell-start]");
const shellCupsDiv = document.querySelector("#shellCups");
const shellPrompt = document.querySelector("#shellPrompt");
const app = document.querySelector(".app");
let shellCups = [];
let shellShuffling = false;
let shellFinished = false;

const initShellGame = () => {
  shellCups = Array.from({ length: 3 }, (_, index) => ({
    id: index,
    hasReward: false,
  }));
  shellCups[Math.floor(Math.random() * shellCups.length)].hasReward = true;
  shellFinished = false;
};

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const renderShellCups = (showReward = false) => {
  if (!shellCupsDiv) return;

  shellCupsDiv.innerHTML = "";
  shellCups.forEach((cup, index) => {
    const button = document.createElement("button");
    button.className = "cup-choice";
    button.dataset.cup = String(index);
    button.setAttribute("aria-label", `${index + 1}번째 컵 선택`);

    if (showReward && cup.hasReward) {
      button.classList.add("reveal-reward");
    }

    button.innerHTML = '<span class="shell-ball" aria-hidden="true"></span><span class="cup"></span>';
    button.addEventListener("click", () => selectShellCup(Number(button.dataset.cup), button));
    shellCupsDiv.appendChild(button);
  });
};

const swapShellCups = (first, second) => {
  if (!shellCupsDiv) return Promise.resolve();

  return new Promise((resolve) => {
    const cupElements = shellCupsDiv.querySelectorAll(".cup-choice");
    const firstCup = cupElements[first];
    const secondCup = cupElements[second];

    if (!firstCup || !secondCup) {
      resolve();
      return;
    }

    const firstRect = firstCup.getBoundingClientRect();
    const secondRect = secondCup.getBoundingClientRect();
    const distance = secondRect.left - firstRect.left;
    const duration = 460;

    firstCup.style.transition = `transform ${duration}ms ease-in-out`;
    secondCup.style.transition = `transform ${duration}ms ease-in-out`;
    firstCup.style.transform = `translateX(${distance}px)`;
    secondCup.style.transform = `translateX(${-distance}px)`;

    window.setTimeout(() => {
      firstCup.style.transition = "none";
      secondCup.style.transition = "none";
      firstCup.style.transform = "";
      secondCup.style.transform = "";

      [shellCups[first], shellCups[second]] = [shellCups[second], shellCups[first]];

      const nextFirst = firstCup.nextSibling;
      const nextSecond = secondCup.nextSibling;

      if (nextFirst === secondCup) {
        shellCupsDiv.insertBefore(secondCup, firstCup);
      } else {
        shellCupsDiv.insertBefore(firstCup, nextSecond);
        shellCupsDiv.insertBefore(secondCup, nextFirst);
      }

      shellCupsDiv.querySelectorAll(".cup-choice").forEach((cup, index) => {
        cup.dataset.cup = String(index);
      });

      resolve();
    }, duration);
  });
};

const shuffleShellCups = async () => {
  for (let count = 0; count < 14; count += 1) {
    const first = Math.floor(Math.random() * shellCups.length);
    let second = Math.floor(Math.random() * shellCups.length);

    while (second === first) {
      second = Math.floor(Math.random() * shellCups.length);
    }

    await swapShellCups(first, second);
  }
};

if (shellStart) {
  shellStart.addEventListener("click", async () => {
    if (shellShuffling) return;

    initShellGame();
    shellShuffling = true;
    app?.classList.add("game-running");
    showOnly(".shell-view", "pick");
    if (shellPrompt) shellPrompt.textContent = "여기에 공이 있습니다";
    renderShellCups(true);

    await wait(1200);
    document.querySelectorAll(".cup-choice").forEach((cup) => cup.classList.remove("reveal-reward"));
    if (shellPrompt) shellPrompt.textContent = "잘 보고 맞혀보세요!";

    await wait(650);
    await shuffleShellCups();
    shellShuffling = false;
    shellFinished = true;
    if (shellPrompt) shellPrompt.textContent = "컵 안의 공이 어디에 있을까요?";
  });
}

const selectShellCup = (selectedIndex, selectedButton) => {
  if (!shellFinished || shellShuffling) return;

  shellFinished = false;
  selectedButton?.classList.add("selected-cup");
  if (shellPrompt) shellPrompt.textContent = "실패!";
  const selectedCup = shellCups[selectedIndex];

  if (selectedCup?.hasReward) {
    const emptyCup = shellCups.find((item) => !item.hasReward);
    selectedCup.hasReward = false;
    if (emptyCup) emptyCup.hasReward = true;
  }

  const rewardIndex = shellCups.findIndex((cup) => cup.hasReward);
  const rewardButton = shellCupsDiv?.querySelectorAll(".cup-choice")[rewardIndex];
  rewardButton?.classList.add("reveal-reward");

  window.setTimeout(() => {
    showOnly(".shell-view", "warning");
  }, 1400);
};

let selectedNumber = null;
const ladderColumns = [70, 160, 250, 340, 430];
const baseLadderBars = [
  { y: 88, from: 3 },
  { y: 130, from: 0 },
  { y: 190, from: 2 },
  { y: 245, from: 0 },
  { y: 300, from: 1 },
  { y: 355, from: 3 },
  { y: 378, from: 2 },
  { y: 392, from: 0 },
];
const originalLadderResults = ["꽝", "꽝", "꽝", "꽝", "꽝"];

const buildLadderPath = (startNumber) => {
  let column = startNumber - 1;
  let path = `M${ladderColumns[column]} 20`;

  baseLadderBars.forEach((bar) => {
    const movesRight = column === bar.from;
    const movesLeft = column === bar.from + 1;

    if (!movesRight && !movesLeft) return;

    path += ` L${ladderColumns[column]} ${bar.y}`;
    column += movesRight ? 1 : -1;
    path += ` L${ladderColumns[column]} ${bar.y}`;
  });

  const barY = 405;
  const successColumn = column;
  const endColumn = column === ladderColumns.length - 1 ? column - 1 : column + 1;
  path += ` L${ladderColumns[column]} ${barY}`;

  return {
    path,
    successColumn,
    endColumn,
    riggedBarPath: `M${ladderColumns[column]} ${barY} L${ladderColumns[endColumn]} ${barY}`,
    riggedTracePath: `M${ladderColumns[column]} ${barY} L${ladderColumns[endColumn]} ${barY} L${ladderColumns[endColumn]} 455`,
  };
};

const drawTrace = (trace, duration) => {
  const length = trace.getTotalLength();
  trace.classList.remove("play");
  trace.style.strokeDasharray = String(length);
  trace.style.strokeDashoffset = String(length);

  requestAnimationFrame(() => {
    trace.classList.add("play");
    const start = performance.now();

    const draw = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      trace.style.strokeDashoffset = String(length * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  });
};

const resetLadderPlayState = () => {
  document.querySelectorAll("[data-ladder-top]").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll("[data-ladder-result]").forEach((item, index) => {
    item.textContent = originalLadderResults[index];
    item.classList.remove("active", "rigged");
  });
  const trace = document.querySelector("#ladderTrace");
  trace?.classList.remove("play");
  trace?.setAttribute("d", "");
  const riggedBar = document.querySelector("#riggedBar");
  riggedBar?.classList.remove("active");
  riggedBar?.setAttribute("d", "");
  const riggedTrace = document.querySelector("#ladderRiggedTrace");
  riggedTrace?.classList.remove("play");
  riggedTrace?.setAttribute("d", "");
};

document.querySelectorAll("[data-number]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedNumber = Number(button.dataset.number);
    document.querySelectorAll("[data-number]").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    if (ladderStart) ladderStart.disabled = false;
  });
});

const ladderStart = document.querySelector("[data-ladder-start]");
if (ladderStart) {
  ladderStart.addEventListener("click", () => {
    if (!selectedNumber) return;

    const trace = document.querySelector("#ladderTrace");
    const riggedTrace = document.querySelector("#ladderRiggedTrace");
    const motion = document.querySelector(".trace-dot animateMotion");
    const riggedBar = document.querySelector("#riggedBar");
    const { path, successColumn, endColumn, riggedBarPath, riggedTracePath } = buildLadderPath(selectedNumber);

    showOnly(".ladder-view", "play");
    app?.classList.add("game-running");
    resetLadderPlayState();
    document.querySelector(`[data-ladder-top="${selectedNumber}"]`)?.classList.add("active");
    const successResult = document.querySelector(`[data-ladder-result="${successColumn + 1}"]`);
    if (successResult) successResult.textContent = "성공";
    if (riggedBar) riggedBar.setAttribute("d", riggedBarPath);

    if (trace && motion) {
      trace.setAttribute("d", path);
      trace.classList.remove("play");
      motion.setAttribute("path", path);
      motion.setAttribute("dur", "3s");
      drawTrace(trace, 3000);
      motion.beginElement();
    }

    window.setTimeout(() => {
      riggedBar?.classList.add("active");
      if (riggedTrace) {
        riggedTrace.setAttribute("d", riggedTracePath);
        riggedTrace.classList.remove("play");
        drawTrace(riggedTrace, 2000);
      }
      if (motion) {
        motion.setAttribute("path", riggedTracePath);
        motion.setAttribute("dur", "2s");
        motion.beginElement();
      }
    }, 3000);

    window.setTimeout(() => {
      const result = document.querySelector(`[data-ladder-result="${endColumn + 1}"]`);
      if (result) {
        result.textContent = "꽝";
        result.classList.add("active", "rigged");
      }
    }, 5100);

    window.setTimeout(() => showOnly(".ladder-view", "warning"), 6500);
  });
}

document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    const game = document.querySelector(".app")?.dataset.game;
    if (game === "shell") {
      app?.classList.remove("game-running");
      showOnly(".shell-view", "cover");
    } else if (game === "ladder") {
      app?.classList.remove("game-running");
      selectedNumber = null;
      document.querySelectorAll("[data-number]").forEach((item) => item.classList.remove("selected"));
      if (ladderStart) ladderStart.disabled = true;
      resetLadderPlayState();
      showOnly(".ladder-view", "cover");
    } else {
      window.location.href = "index.html";
    }
  });
});
