/* ===========================
   GLOBAL STATE
=========================== */
let assignments = {};
let revealedPlayers = new Set();
let timerMinutes = 5;
let timerInterval = null;

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

  // Hide card and start button on load via JS (CSS handles visual state)
  document.getElementById("card").style.display = "none";
  document.getElementById("startGameBtn").style.display = "none";
});

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
  const players = Array.from(playerInputs).map(input => input.value.trim()).filter(Boolean);

  const spyCount = parseInt(document.getElementById("spyCount").value);
  timerMinutes = parseInt(document.getElementById("timerSelect").value);

  if (players.length < 3) {
    alert("Enter at least 3 player names.");
    return;
  }

  if (spyCount >= players.length) {
    alert("Spies must be fewer than total players.");
    return;
  }

  assignments = generateGame(players, spyCount);
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

  const result = {};

  for (let i = 0; i < playersCopy.length; i++) {
    if (i < spyCount) {
      result[playersCopy[i]] = { location: null, role: "Spy" };
    } else {
      result[playersCopy[i]] = {
        location: chosenLocation,
        role: roles[i - spyCount] || "Observer"
      };
    }
  }

  return result;
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

  const container = document.getElementById("playerButtons");
  container.innerHTML = "";

  const card = document.getElementById("card");
  card.style.display = "none";

  const startBtn = document.getElementById("startGameBtn");
  startBtn.style.display = "none";

  players.forEach(player => {
    const button = document.createElement("button");
    button.textContent = player;
    button.onclick = () => revealCard(player, button);
    container.appendChild(button);
  });
}

/* ===========================
   REVEAL CARD
=========================== */
function revealCard(player, button) {
  if (revealedPlayers.has(player)) return;

  const data = assignments[player];
  const isSpy = data.role === "Spy";
  const card = document.getElementById("card");

  card.style.display = "block";

  if (isSpy) {
    card.innerHTML = `
      <h3>Classification</h3>
      <h2 style="color:#e05544;font-family:var(--font-body);font-weight:700;letter-spacing:1px;text-transform:uppercase;">— Spy —</h2>
      <p>Deduce the location.<br>Don't get caught.</p>
      <hr>
      <small>Memorise this. Tap to hide.</small>
    `;
  } else {
    card.innerHTML = `
      <h3>Location</h3>
      <h2>${data.location}</h2>
      <p>${data.role}</p>
      <hr>
      <small>Memorise this. Tap to hide.</small>
    `;
  }

  card.onclick = () => {
    card.style.display = "none";
    card.onclick = null;
    revealedPlayers.add(player);

    button.disabled = true;
    button.style.opacity = "0.35";

    if (revealedPlayers.size === Object.keys(assignments).length) {
      document.getElementById("startGameBtn").style.display = "flex";
    }
  };
}

/* ===========================
   START GAME
=========================== */
function startGame() {
  switchScreen("gameScreen");
  startTimer(timerMinutes);
}

/* ===========================
   TIMER
=========================== */
function startTimer(minutes) {
  let seconds = minutes * 60;
  const display = document.getElementById("timerDisplay");

  if (timerInterval) clearInterval(timerInterval);

  function tick() {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    display.textContent = `${min}:${sec < 10 ? "0" : ""}${sec}`;

    // Warning state for last 30 seconds
    if (seconds <= 30) {
      display.classList.add("warning");
    } else {
      display.classList.remove("warning");
    }

    if (seconds <= 0) {
      clearInterval(timerInterval);
      display.textContent = "Time's Up";
      display.classList.add("warning");
      return;
    }

    seconds--;
  }

  tick(); // render immediately, don't wait 1s
  timerInterval = setInterval(tick, 1000);
}

/* ===========================
   SCREEN SWITCHER
=========================== */
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}
