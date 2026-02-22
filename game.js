const ui = {
  name: document.getElementById("name"),
  rank: document.getElementById("rank"),
  level: document.getElementById("level"),
  hp: document.getElementById("hp"),
  energy: document.getElementById("energy"),
  gold: document.getElementById("gold"),
  log: document.getElementById("log"),
  exploreBtn: document.getElementById("exploreBtn"),
  fightBtn: document.getElementById("fightBtn"),
  skillBtn: document.getElementById("skillBtn"),
  restBtn: document.getElementById("restBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

const monsters = [
  { name: "Lobo Umbrío", hp: 24, damage: 8, reward: 14 },
  { name: "Bestia de Rango D", hp: 34, damage: 10, reward: 20 },
  { name: "Parásito de Niebla", hp: 28, damage: 9, reward: 16 },
  { name: "Kaiju Menor", hp: 42, damage: 12, reward: 28 },
];

let state;

function createState() {
  return {
    player: {
      name: "Cazador Novato",
      rank: "E",
      level: 1,
      hp: 100,
      energy: 50,
      gold: 0,
      exp: 0,
    },
    enemy: null,
  };
}

function pushLog(message, isDamage = false) {
  const li = document.createElement("li");
  li.textContent = message;
  if (isDamage) {
    li.classList.add("hit");
  }
  ui.log.prepend(li);
}

function randomMonster() {
  const base = monsters[Math.floor(Math.random() * monsters.length)];
  const levelScale = Math.max(1, state.player.level * 0.2 + 1);
  return {
    name: base.name,
    hp: Math.floor(base.hp * levelScale),
    damage: Math.floor(base.damage * levelScale),
    reward: Math.floor(base.reward * levelScale),
  };
}

function syncHud() {
  const { player, enemy } = state;
  ui.name.textContent = player.name;
  ui.rank.textContent = player.rank;
  ui.level.textContent = player.level;
  ui.hp.textContent = Math.max(player.hp, 0);
  ui.energy.textContent = player.energy;
  ui.gold.textContent = player.gold;

  ui.fightBtn.disabled = !enemy;
  ui.skillBtn.disabled = !enemy || player.energy < 15;
  ui.exploreBtn.disabled = Boolean(enemy);
}

function gainExp(amount) {
  state.player.exp += amount;
  const nextLevel = state.player.level * 35;
  if (state.player.exp >= nextLevel) {
    state.player.exp -= nextLevel;
    state.player.level += 1;
    state.player.hp += 18;
    state.player.energy += 8;
    pushLog(`Subiste a nivel ${state.player.level}. Tu poder crece. ✨`);

    if (state.player.level >= 4 && state.player.rank === "E") state.player.rank = "D";
    if (state.player.level >= 7 && state.player.rank === "D") state.player.rank = "C";
    if (state.player.level >= 10 && state.player.rank === "C") state.player.rank = "B";
  }
}

function enemyTurn() {
  if (!state.enemy) return;
  const dmg = Math.floor(Math.random() * 5) + state.enemy.damage;
  state.player.hp -= dmg;
  pushLog(`${state.enemy.name} te golpea por ${dmg} de daño.`, true);

  if (state.player.hp <= 0) {
    state.player.hp = 0;
    pushLog("Has caído en la mazmorra... Reinicia para volver a intentarlo.");
    state.enemy = null;
    ui.exploreBtn.disabled = true;
    ui.restBtn.disabled = true;
  }
}

function attack() {
  if (!state.enemy) return;
  const dmg = Math.floor(Math.random() * 8) + 9 + state.player.level;
  state.enemy.hp -= dmg;
  pushLog(`Atacas con tu espada y haces ${dmg} de daño.`);

  if (state.enemy.hp <= 0) {
    pushLog(`Derrotaste a ${state.enemy.name}. +${state.enemy.reward} monedas.`);
    state.player.gold += state.enemy.reward;
    gainExp(state.enemy.reward);
    state.enemy = null;
  } else {
    enemyTurn();
  }
  syncHud();
}

function useSkill() {
  if (!state.enemy || state.player.energy < 15) return;
  state.player.energy -= 15;
  const dmg = Math.floor(Math.random() * 10) + 18 + state.player.level * 2;
  state.enemy.hp -= dmg;
  pushLog(`Lanzas "Corte Dimensional" y causas ${dmg} de daño crítico.`);

  if (state.enemy.hp <= 0) {
    pushLog(`Aniquilaste a ${state.enemy.name}. +${state.enemy.reward} monedas.`);
    state.player.gold += state.enemy.reward;
    gainExp(state.enemy.reward + 4);
    state.enemy = null;
  } else {
    enemyTurn();
  }
  syncHud();
}

function explore() {
  const cost = 6;
  if (state.player.energy < cost) {
    pushLog("No tienes energía suficiente para abrir un portal.");
    return;
  }

  state.player.energy -= cost;
  state.enemy = randomMonster();
  pushLog(`Un portal se abre: aparece ${state.enemy.name} (HP ${state.enemy.hp}).`);
  syncHud();
}

function rest() {
  state.player.hp = Math.min(100 + state.player.level * 10, state.player.hp + 20);
  state.player.energy = Math.min(50 + state.player.level * 5, state.player.energy + 14);
  pushLog("Descansas en la base de cazadores. Recuperas vida y energía.");
  syncHud();
}

function resetGame() {
  state = createState();
  ui.log.innerHTML = "";
  pushLog("Comienza una nueva incursión.");
  ui.exploreBtn.disabled = false;
  ui.restBtn.disabled = false;
  syncHud();
}

ui.exploreBtn.addEventListener("click", explore);
ui.fightBtn.addEventListener("click", attack);
ui.skillBtn.addEventListener("click", useSkill);
ui.restBtn.addEventListener("click", rest);
ui.resetBtn.addEventListener("click", resetGame);

resetGame();
