/* ===========================
   LOCATIONS DATA
   (Move to separate file if desired)
=========================== */
const LOCATIONS = {
  "Beach": ["Lifeguard", "Surfer", "Tourist", "Ice Cream Vendor", "Photographer", "Fisherman"],
  "Casino": ["Dealer", "Security", "Gambler", "Bartender", "Waitress", "Manager"],
  "Space Station": ["Engineer", "Pilot", "Scientist", "Tourist", "Doctor", "Commander"],
  "Movie Studio": ["Actor", "Director", "Producer", "Camera Operator", "Makeup Artist", "Stunt Double"]
};

/* ===========================
   GLOBAL STATE
=========================== */
let assignments = {};
let revealedPlayers = new Set();
let timerMinutes = 5;
let timerInterval = null;

/* ===========================
   INITIALIZE PLAYER DROPDOWN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const playerCountSelect = document.getElementById("playerCount");

  for (let i = 3; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    playerCountSelect.appendChild(option);
  }

  playerCountSelect.addEventListener("change", updateNameInputs);
  updateNameInputs();
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
    input.placeholder = "Player " + i;
    input.value = "Player " + i;
    container.appendChild(input);
  }
}

/* ===========================
   START SETUP
=========================== */
function startSetup() {
  const playerInputs = document.querySelectorAll("#playerNameInputs input");
  const players = Array.from(playerInputs).map(input => input.value.trim());

  const spyCount = parseInt(document.getElementById("spyCount").value);
  timerMinutes = parseInt(document.getElementById("timerSelect").value);

  if (spyCount >= players.length) {
    alert("Spies must be fewer than players.");
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
  const chosenLocation =
    locationNames[Math.floor(Math.random() * locationNames.length)];

  const roles = [...LOCATIONS[chosenLocation]];

  if (roles.length < players.length - spyCount) {
    alert("Not enough roles for this location.");
    return;
  }

  shuffle(players);
  shuffle(roles);

  const result = {};

  for (let i = 0; i < players.length; i++) {
    if (i < spyCount) {
      result[players[i]] = {
        location: "???",
        role: "Spy"
      };
    } else {
      result[players[i]] = {
        location: chosenLocation,
        role: roles[i - spyCount]
      };
    }
  }

  return result;
}

/* ===========================
   SHUFFLE FUNCTION
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

  players.forEach(player => {
    const button = document.createElement("button");
    button.textContent = player;
    button.onclick = () => revealCard(player, button);
    container.appendChild(button);
  });
}

/* ===========================
   REVEAL CARD (ONE-TIME VIEW)
=========================== */
function revealCard(player, button) {
  if (revealedPlayers.has(player)) return;

  const card = document.getElementById("card");
  card.style.display = "block";
  card.innerHTML = `
    <h2>${player}</h2>
    <p>Location: ${assignments[player].location}</p>
    <p>Role: ${assignments[player].role}</p>
    <p style="margin-top:20px;font-size:16px;">Tap to Hide</p>
  `;

  card.onclick = () => {
    card.style.display = "none";
    revealedPlayers.add(player);

    button.disabled = true;
    button.style.opacity = 0.5;

    if (revealedPlayers.size === Object.keys(assignments).length) {
      document.getElementById("startGameBtn").style.display = "block";
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
   TIMER FUNCTION
=========================== */
function startTimer(minutes) {
  let seconds = minutes * 60;
  const display = document.getElementById("timerDisplay");

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    display.textContent =
      `${min}:${sec < 10 ? "0" : ""}${sec}`;

    if (seconds <= 0) {
      clearInterval(timerInterval);
      display.textContent = "Time's Up!";
    }

    seconds--;
  }, 1000);
}

/* ===========================
   SCREEN SWITCHER
=========================== */
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen =>
    screen.classList.remove("active")
  );

  document.getElementById(screenId).classList.add("active");
}
