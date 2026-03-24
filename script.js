/* ===========================
   GLOBAL STATE
=========================== */
let assignments = {};
let revealedPlayers = new Set();
let timerMinutes = 0;
let remainingSeconds = 0;
let timerInterval = null;
let timerPaused = false;
let currentPlayers = [];
let currentSpyCount = 0;
let currentLocation = null;
let gameStarted = false;

/* ===========================
   INITIALIZE
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const playerCountSelect = document.getElementById("playerCount");

  for (let i = 3; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + " Players";
    playerCountSelect.appendChild(option);
  }

  playerCountSelect.addEventListener("change", updateNameInputs);
  updateNameInputs();

  const timerSelect = document.getElementById("timerSelect");
  timerSelect.addEventListener("change", updateTimerDisplay);

  document.getElementById("card").style.display = "none";
});

/* ===========================
   UPDATE TIMER DISPLAY
=========================== */
function updateTimerDisplay() {
  const timerSelect = document.getElementById("timerSelect");
  const customTimerInput = document.getElementById("customTimerInput");

  if (timerSelect.value === "custom") {
    customTimerInput.style.display = "block";
  } else {
    customTimerInput.style.display = "none";
  }
}

/* ===========================
   UPDATE PLAYER NAME INPUTS
=========================== */
function updateNameInputs() {
  const count = parseInt(document.getElementById("playerCount").value);
  const container = document.getElementById("playerNameInputs");
  container.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Player " + i + " name";
    input.value = "Player " + i;
    container.appendChild(input);
  }
}

/* ===========================
   START SETUP
=========================== */
function startSetup() {
  const playerInputs = document.querySelectorAll("#playerNameInputs input");
  const players = Array.from(playerInputs)
    .map(input => input.value.trim())
    .filter(Boolean);

  const spyCount = parseInt(document.getElementById("spyCount").value);
  const timerSelect = document.getElementById("timerSelect");

  if (players.length < 3) {
    alert("Enter at least 3 player names.");
    return;
  }

  const uniquePlayers = new Set(players.map(p => p.toLowerCase()));
  if (uniquePlayers.size !== players.length) {
    alert("Player names must be unique.");
    return;
  }

  if (spyCount < 1 || spyCount >= players.length) {
    alert("Invalid spy count. Must be at least 1 and fewer than total players.");
    return;
  }

  // FIX #3 — Validate enough roles exist
  const locationNames = Object.keys(LOCATIONS);
  const maxRoles = Math.max(...locationNames.map(loc => LOCATIONS[loc].length));
  const civiliansNeeded = players.length - spyCount;
  if (civiliansNeeded > maxRoles) {
    alert(`Too many civilian players (${civiliansNeeded}). Maximum supported is ${maxRoles}. Reduce player count or increase spy count.`);
    return;
  }

  let selectedTimer = timerSelect.value;
  if (selectedTimer === "custom") {
    const customMinutes = parseInt(document.getElementById("customMinutes").value, 10);
    if (isNaN(customMinutes) || customMinutes < 1 || customMinutes > 60) {
      alert("Enter a valid custom time between 1 and 60 minutes.");
      return;
    }
    timerMinutes = customMinutes;
  } else {
    timerMinutes = parseInt(selectedTimer, 10);
    if (isNaN(timerMinutes)) timerMinutes = 0;
  }

  currentPlayers = [...players];
  currentSpyCount = spyCount;

  // FIX #2 — generateGame returns { assignments, location }
  const result = generateGame(players, spyCount);
  assignments = result.assignments;
  currentLocation = result.location;

  revealedPlayers.clear();
  showRevealScreen(players);
}

/* ===========================
   GENERATE GAME ASSIGNMENTS
=========================== */
function generateGame(players, spyCount) {
  const locationNames = Object.keys(LOCATIONS);
  const chosenLocation = locationNames[Math.floor(Math.random() * locationNames.length)];

  const roles = [...LOCATIONS[chosenLocation]];
  const playersCopy = [...players];

  shuffle(playersCopy);
  shuffle(roles);

  // FIX #3 — Cycle roles instead of falling back to "Observer"
  const civiliansNeeded = playersCopy.length - spyCount;
  const paddedRoles = [];
  for (let i = 0; i < civiliansNeeded; i++) {
    paddedRoles.push(roles[i % roles.length]);
  }

  const result = {};
  for (let i = 0; i < playersCopy.length; i++) {
    if (i < spyCount) {
      result[playersCopy[i]] = { location: null, role: "Spy" };
    } else {
      result[playersCopy[i]] = {
        location: chosenLocation,
        role: paddedRoles[i - spyCount]
      };
    }
  }

  // FIX #2 — Return location directly so currentLocation is never null
  return { assignments: result, location: chosenLocation };
}

/* ===========================
   SHUFFLE
=========================== */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* ===========================
   SHOW REVEAL SCREEN
=========================== */
function showRevealScreen(players) {
  switchScreen("revealScreen");

  const startBtn = document.getElementById("startGameBtn");
  // FIX — use !important via cssText to override the CSS display:flex !important
  startBtn.style.setProperty("display", "none", "important");

  const container = document.getElementById("playerButtons");
  container.innerHTML = "";

  const card = document.getElementById("card");
  card.style.display = "none";
  card.style.padding = "";

  players.forEach(player => {
    const button = document.createElement("button");
    button.textContent = player;
    button.onclick = (e) => {
      e.stopPropagation();
      revealCard(player, button);
    };
    container.appendChild(button);
  });
}

/* ===========================
   REVEAL CARD
=========================== */
function revealCard(playerName, buttonElement) {
  const card = document.getElementById("card");
  const data = assignments[playerName];

  if (!data) return;

  const isSpy = data.role === "Spy";

  // FIX #1 — Role is the big <h2>, location is the supporting <p>
  card.innerHTML = `
    <div class="card-header">
      <h3>${isSpy ? "Classification" : "Your Role"}</h3>
      <button class="card-close" onclick="hideCard(event)">✕</button>
    </div>
    <h2>${isSpy ? "— SPY —" : data.role}</h2>
    <p>${isSpy ? "Identify the location without being caught." : "<strong>Location:</strong> " + data.location}</p>
    <hr class="card-divider">
    <small>Tap to hide, then pass the device.</small>
  `;

  card.style.display = "block";
  card.style.padding = "28px"; // FIX — CSS has padding:0, must force it open here
  card.dataset.currentPlayer = playerName;

  if (buttonElement) {
    buttonElement.style.opacity = "0.5";
  }

  // FIX #5 — Clean listener reference, no stacking
  if (card._clickHandler) {
    card.removeEventListener("click", card._clickHandler);
  }
  card._clickHandler = (e) => handleCardClick(e, playerName);
  card.addEventListener("click", card._clickHandler);
}

/* ===========================
   HANDLE CARD CLICK
=========================== */
function handleCardClick(e, playerName) {
  e.stopPropagation();

  const card = document.getElementById("card");

  if (
    e.target === card ||
    e.target.tagName === "SMALL" ||
    e.target.tagName === "P" ||
    e.target.tagName === "H2" ||
    e.target.tagName === "HR" ||
    e.target.classList.contains("card-divider")
  ) {
    hideCard(e);
  }
}

/* ===========================
   HIDE CARD
=========================== */
function hideCard(event) {
  event.stopPropagation();
  const card = document.getElementById("card");
  const currentPlayer = card.dataset.currentPlayer;

  if (currentPlayer && !revealedPlayers.has(currentPlayer)) {
    card.style.display = "none";
    card.style.padding = ""; // FIX — reset padding on hide

    if (card._clickHandler) {
      card.removeEventListener("click", card._clickHandler);
      card._clickHandler = null;
    }

    revealedPlayers.add(currentPlayer);

    const buttons = document.querySelectorAll("#playerButtons button");
    buttons.forEach(button => {
      if (button.textContent === currentPlayer) {
        button.disabled = true;
        button.style.opacity = "0.35";
      }
    });

    // Only show Start Game after every player has viewed their card
    if (revealedPlayers.size === Object.keys(assignments).length) {
      document.getElementById("startGameBtn").style.setProperty("display", "flex", "important");
    }
  }
}

/* ===========================
   START GAME
=========================== */
function startGame() {
  switchScreen("gameScreen");
  gameStarted = true;

  // FIX #6 — Always hide gameActions at game start
  document.getElementById("gameActions").style.display = "none";

  timerPaused = false;
  document.getElementById("pauseBtn").textContent = "Pause Timer";

  if (timerMinutes > 0) {
    remainingSeconds = timerMinutes * 60;
    startTimer();
  } else {
    const display = document.getElementById("timerDisplay");
    display.textContent = "No Timer";
    display.style.color = "var(--text-muted)";
  }
}

/* ===========================
   TIMER
=========================== */
function startTimer() {
  const display = document.getElementById("timerDisplay");

  if (timerInterval) clearInterval(timerInterval);

  function tick() {
    const min = Math.floor(remainingSeconds / 60);
    const sec = remainingSeconds % 60;
    display.textContent = `${min}:${sec < 10 ? "0" : ""}${sec}`;

    if (remainingSeconds <= 30) {
      display.classList.add("warning");
    } else {
      display.classList.remove("warning");
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      display.textContent = "Time's Up";
      display.classList.add("warning");
      document.getElementById("gameActions").style.display = "flex";
      return;
    }

    remainingSeconds--;
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

/* ===========================
   TOGGLE TIMER (PAUSE/RESUME)
=========================== */
function toggleTimer() {
  const pauseBtn = document.getElementById("pauseBtn");

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerPaused = true;
    pauseBtn.textContent = "Resume Timer";
  } else if (timerPaused && remainingSeconds > 0) {
    timerPaused = false;
    pauseBtn.textContent = "Pause Timer";
    startTimer();
  }
}

/* ===========================
   SCREEN SWITCHER
=========================== */
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

/* ===========================
   REVEAL WINNER
=========================== */
function revealWinner() {
  const playerNames = Object.keys(assignments);
  const spies = playerNames.filter(p => assignments[p].role === "Spy");

  const card = document.getElementById("card");
  card.style.display = "block";
  card.style.padding = "28px"; // FIX — force padding open
  card.style.position = "fixed";
  card.style.zIndex = "9999";
  card.style.inset = "50%";
  card.style.transform = "translate(-50%, -50%)";
  card.style.margin = "0";
  card.style.maxWidth = "432px";
  card.style.width = "calc(100% - 48px)";

  // FIX #2 — currentLocation is always a real string, never null
  card.innerHTML = `
    <div class="card-header">
      <h3>Game Over</h3>
      <button class="card-close" onclick="hideRevealCard()">✕</button>
    </div>
    <h2 style="color:#e05544;font-family:var(--font-body);font-weight:700;letter-spacing:1px;text-transform:uppercase;">
      ${spies.length > 1 ? "— SPIES —" : "— SPY —"}
    </h2>
    <p>${spies.join(", ")}</p>
    <hr>
    <small>Location was: <strong>${currentLocation ?? "Unknown"}</strong></small>
  `;
}

function hideRevealCard() {
  const card = document.getElementById("card");
  card.style.display = "none";
  card.style.padding = ""; // FIX — reset padding
  card.style.position = "";
  card.style.zIndex = "";
  card.style.inset = "";
  card.style.transform = "";
  card.style.margin = "";
  document.getElementById("gameActions").style.display = "flex";
}

/* ===========================
   NEW GAME
=========================== */
function goToNewGame() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  timerPaused = false;
  remainingSeconds = 0;

  // FIX #4 — Reset timerMinutes so old value doesn't bleed into new game
  timerMinutes = 0;

  // FIX #6 — Reset gameActions and timer display
  document.getElementById("gameActions").style.display = "none";
  const display = document.getElementById("timerDisplay");
  display.textContent = "0:00";
  display.classList.remove("warning");

  document.getElementById("playerCount").value = currentPlayers.length;
  updateNameInputs();

  const inputs = document.querySelectorAll("#playerNameInputs input");
  inputs.forEach((input, index) => {
    if (index < currentPlayers.length) {
      input.value = currentPlayers[index];
    }
  });

  document.getElementById("spyCount").value = currentSpyCount;

  // FIX #7 — Reset timer select and hide custom input
  const timerSelect = document.getElementById("timerSelect");
  timerSelect.value = "0";
  updateTimerDisplay();

  gameStarted = false;
  revealedPlayers.clear();
  assignments = {};
  currentLocation = null;

  switchScreen("setupScreen");
}
