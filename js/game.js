// Game board logic

let currentGame = null;
let currentQuestion = null;
let selectedTeam = null;
let currentWager = 0;

// DOM elements
const gameTitle = document.getElementById('gameTitle');
const teamsDisplay = document.getElementById('teamsDisplay');
const gameBoard = document.getElementById('gameBoard');
const backBtn = document.getElementById('backBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const menuBtn = document.getElementById('menuBtn');

// Modals
const questionModal = document.getElementById('questionModal');
const menuModal = document.getElementById('menuModal');
const editTeamModal = document.getElementById('editTeamModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (!gameId) {
    alert('No game ID provided');
    window.location.href = 'index.html';
    return;
  }

  loadGame(gameId);
  setupEventListeners();
});

// Load game
function loadGame(gameId) {
  currentGame = Storage.getGame(gameId);

  if (!currentGame) {
    alert('Game not found');
    window.location.href = 'index.html';
    return;
  }

  renderGame();
}

// Render game
function renderGame() {
  gameTitle.textContent = currentGame.title;
  renderTeams();
  renderBoard();
  updateUndoRedoButtons();
}

// Render teams
function renderTeams() {
  teamsDisplay.innerHTML = '';

  currentGame.state.teams.forEach(team => {
    const teamEl = document.createElement('div');
    teamEl.className = 'team-score';
    teamEl.style.borderLeftColor = team.color;
    teamEl.innerHTML = `
      <div class="team-name">${team.name}</div>
      <div class="team-points">$${team.score}</div>
    `;
    teamsDisplay.appendChild(teamEl);
  });
}

// Render board
function renderBoard() {
  gameBoard.innerHTML = '';

  const categories = currentGame.config.categories;
  if (!categories || categories.length === 0) return;

  const cols = categories.length;
  const boardGrid = document.createElement('div');
  boardGrid.className = `board-grid cols-${cols}`;

  // Render category headers
  categories.forEach(category => {
    const header = document.createElement('div');
    header.className = 'category-header';
    header.textContent = category.name;
    boardGrid.appendChild(header);
  });

  // Render question tiles
  const maxQuestions = Math.max(...categories.map(cat => cat.questions ? cat.questions.length : 0));

  for (let qIndex = 0; qIndex < maxQuestions; qIndex++) {
    categories.forEach((category, cIndex) => {
      if (category.questions && category.questions[qIndex]) {
        const question = category.questions[qIndex];
        const tile = document.createElement('div');
        tile.className = 'question-tile';

        const isAnswered = GameState.isQuestionAnswered(currentGame, cIndex, qIndex);

        tile.textContent = `$${question.value}`;

        if (isAnswered) {
          tile.classList.add('answered');
        }

        tile.addEventListener('click', () => openQuestion(cIndex, qIndex, isAnswered));

        boardGrid.appendChild(tile);
      } else {
        const empty = document.createElement('div');
        boardGrid.appendChild(empty);
      }
    });
  }

  gameBoard.appendChild(boardGrid);
}

// Open question modal
function openQuestion(categoryIndex, questionIndex, isAnswered = false) {
  currentQuestion = GameState.getQuestion(currentGame, categoryIndex, questionIndex);
  if (!currentQuestion) return;

  // If question is already answered, show reset option
  if (isAnswered) {
    const resetConfirm = confirm('This question has already been answered. Do you want to reset it and play it again?');
    if (!resetConfirm) return;

    // Reset the question by removing it from answered list
    const questionId = GameState.getQuestionId(categoryIndex, questionIndex);
    const index = currentGame.state.answeredQuestions.indexOf(questionId);
    if (index > -1) {
      // Add to history
      History.addAction(currentGame, 'question-reset', {
        categoryIndex: categoryIndex,
        questionIndex: questionIndex,
        questionId: questionId
      });

      currentGame.state.answeredQuestions.splice(index, 1);
      Storage.updateGame(currentGame.id, currentGame);
      renderGame();
      return;
    }
  }

  selectedTeam = null;
  currentWager = 0;

  document.getElementById('categoryTitle').textContent = currentQuestion.categoryName;
  document.getElementById('questionValue').textContent = `$${currentQuestion.value}`;
  document.getElementById('questionText').textContent = currentQuestion.question;
  document.getElementById('answerText').textContent = currentQuestion.answer;

  // Reset sections
  document.getElementById('dailyDoubleScreen').style.display = 'none';
  document.getElementById('questionScreen').style.display = 'none';
  document.getElementById('buzzerSection').style.display = 'none';
  document.getElementById('answerSection').style.display = 'none';
  document.getElementById('answerText').style.display = 'none';
  document.getElementById('judgmentButtons').style.display = 'none';

  // Check if Daily Double
  if (currentQuestion.dailyDouble) {
    showDailyDouble();
  } else {
    showQuestion();
  }

  openModal(questionModal);
}

// Daily Double flow
function showDailyDouble() {
  document.getElementById('dailyDoubleScreen').style.display = 'block';

  // For Daily Double, first team or prompt for team selection
  const team = currentGame.state.teams[0];
  selectedTeam = team;

  document.getElementById('dailyDoubleTeam').textContent = `${team.name}, make your wager!`;

  const minWager = GameState.getMinWager();
  const maxWager = GameState.getMaxWager(currentGame, team.id);

  document.getElementById('wagerInput').value = '';
  document.getElementById('wagerInput').min = minWager;
  document.getElementById('wagerInput').max = maxWager;
  document.getElementById('wagerHint').textContent = `Minimum: $${minWager}, Maximum: $${maxWager}`;

  const submitWagerBtn = document.getElementById('submitWagerBtn');
  submitWagerBtn.onclick = () => {
    const wager = parseInt(document.getElementById('wagerInput').value);

    if (isNaN(wager) || wager < minWager || wager > maxWager) {
      alert(`Please enter a valid wager between $${minWager} and $${maxWager}`);
      return;
    }

    currentWager = wager;
    document.getElementById('dailyDoubleScreen').style.display = 'none';
    showQuestion(true);
  };
}

// Show question
function showQuestion(isDailyDouble = false) {
  document.getElementById('questionScreen').style.display = 'block';

  if (isDailyDouble) {
    document.getElementById('questionValue').textContent = `Daily Double - Wager: $${currentWager}`;
    document.getElementById('answerSection').style.display = 'block';
  } else {
    renderBuzzerButtons();
    document.getElementById('buzzerSection').style.display = 'block';
  }

  setupAnswerSection();
}

// Render buzzer buttons
function renderBuzzerButtons() {
  const container = document.getElementById('buzzerButtons');
  container.innerHTML = '';

  currentGame.state.teams.forEach(team => {
    const btn = document.createElement('button');
    btn.className = 'buzzer-btn';
    btn.textContent = team.name;
    btn.style.backgroundColor = team.color;
    btn.style.borderColor = team.color;
    btn.onclick = () => selectTeam(team);
    container.appendChild(btn);
  });
}

// Select team
function selectTeam(team) {
  selectedTeam = team;
  document.getElementById('buzzerSection').style.display = 'none';
  document.getElementById('answerSection').style.display = 'block';
}

// Setup answer section
function setupAnswerSection() {
  const revealBtn = document.getElementById('revealBtn');
  const answerText = document.getElementById('answerText');
  const judgmentButtons = document.getElementById('judgmentButtons');

  const showAnswers = currentGame.state.settings.showAnswers;

  if (showAnswers) {
    answerText.style.display = 'block';
    revealBtn.style.display = 'none';
    judgmentButtons.style.display = 'flex';
  } else {
    answerText.style.display = 'none';
    revealBtn.style.display = 'inline-block';
    judgmentButtons.style.display = 'none';

    revealBtn.onclick = () => {
      answerText.style.display = 'block';
      revealBtn.style.display = 'none';
      judgmentButtons.style.display = 'flex';
    };
  }

  document.getElementById('correctBtn').onclick = () => handleAnswer(true);
  document.getElementById('incorrectBtn').onclick = () => handleAnswer(false);
}

// Handle answer
function handleAnswer(isCorrect) {
  if (!selectedTeam) {
    alert('No team selected');
    return;
  }

  const isDailyDouble = currentQuestion.dailyDouble;
  const points = isDailyDouble ? currentWager : currentQuestion.value;
  const pointChange = isCorrect ? points : -points;

  // Add to history before making changes
  const historyData = {
    teamId: selectedTeam.id,
    teamName: selectedTeam.name,
    categoryIndex: currentQuestion.categoryIndex,
    questionIndex: currentQuestion.questionIndex,
    pointChange: pointChange,
    correct: isCorrect
  };

  if (isDailyDouble) {
    History.addAction(currentGame, 'daily-double', historyData);
  } else {
    History.addAction(currentGame, isCorrect ? 'answer-correct' : 'answer-incorrect', historyData);
  }

  // Update game state
  GameState.markQuestionAnswered(currentGame, currentQuestion.categoryIndex, currentQuestion.questionIndex);
  GameState.updateScore(currentGame, selectedTeam.id, pointChange);

  // Save to storage
  Storage.updateGame(currentGame.id, currentGame);

  // Close modal and refresh
  closeModal(questionModal);
  renderGame();
}

// Undo/Redo
function undo() {
  History.undo(currentGame);
  Storage.updateGame(currentGame.id, currentGame);
  renderGame();
}

function redo() {
  History.redo(currentGame);
  Storage.updateGame(currentGame.id, currentGame);
  renderGame();
}

function updateUndoRedoButtons() {
  undoBtn.disabled = !History.canUndo(currentGame);
  redoBtn.disabled = !History.canRedo(currentGame);
}

// Menu modal
function openMenu() {
  renderTeamsManager();
  renderSettings();
  renderHistory();
  openModal(menuModal);
}

function renderTeamsManager() {
  const container = document.getElementById('teamsManager');
  container.innerHTML = '';

  currentGame.state.teams.forEach(team => {
    const item = document.createElement('div');
    item.className = 'team-item';
    item.style.borderLeftColor = team.color;
    item.innerHTML = `
      <div class="team-item-info">
        <strong>${team.name}</strong>
        <span>$${team.score}</span>
      </div>
      <div class="team-item-actions">
        <button class="btn btn-small btn-secondary" onclick="editTeam('${team.id}')">Edit</button>
        ${currentGame.state.teams.length > 1 ? `<button class="btn btn-small btn-danger" onclick="removeTeam('${team.id}')">Remove</button>` : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

function renderSettings() {
  document.getElementById('timerToggle').checked = currentGame.state.settings.timerEnabled;
  document.getElementById('soundToggle').checked = currentGame.state.settings.soundEnabled;
  document.getElementById('showAnswersToggle').checked = currentGame.state.settings.showAnswers;
  document.getElementById('negativeScoresToggle').checked = currentGame.state.settings.allowNegativeScores;

  document.getElementById('timerToggle').onchange = (e) => {
    currentGame.state.settings.timerEnabled = e.target.checked;
    Storage.updateGame(currentGame.id, currentGame);
  };

  document.getElementById('soundToggle').onchange = (e) => {
    currentGame.state.settings.soundEnabled = e.target.checked;
    Storage.updateGame(currentGame.id, currentGame);
  };

  document.getElementById('showAnswersToggle').onchange = (e) => {
    currentGame.state.settings.showAnswers = e.target.checked;
    Storage.updateGame(currentGame.id, currentGame);
  };

  document.getElementById('negativeScoresToggle').onchange = (e) => {
    currentGame.state.settings.allowNegativeScores = e.target.checked;
    Storage.updateGame(currentGame.id, currentGame);
  };
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const history = History.getHistorySummary(currentGame);

  if (history.length === 0) {
    container.innerHTML = '<div class="history-empty">No actions yet</div>';
    return;
  }

  container.innerHTML = '';
  history.reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item' + (entry.isCurrent ? ' current' : '');
    item.textContent = entry.description;
    container.appendChild(item);
  });
}

// Team management
window.addTeam = function() {
  if (currentGame.state.teams.length >= 6) {
    alert('Maximum 6 teams allowed');
    return;
  }

  History.addAction(currentGame, 'team-add', {
    teamName: `Team ${currentGame.state.teams.length + 1}`
  });

  GameState.addTeam(currentGame);
  Storage.updateGame(currentGame.id, currentGame);
  renderGame();
  renderTeamsManager();
};

window.removeTeam = function(teamId) {
  if (currentGame.state.teams.length <= 1) {
    alert('Must have at least 1 team');
    return;
  }

  const team = GameState.getTeam(currentGame, teamId);

  History.addAction(currentGame, 'team-remove', {
    teamId: teamId,
    teamName: team.name
  });

  GameState.removeTeam(currentGame, teamId);
  Storage.updateGame(currentGame.id, currentGame);
  renderGame();
  renderTeamsManager();
};

let editingTeamId = null;

window.editTeam = function(teamId) {
  editingTeamId = teamId;
  const team = GameState.getTeam(currentGame, teamId);

  document.getElementById('teamNameInput').value = team.name;
  document.getElementById('teamColorInput').value = team.color;

  openModal(editTeamModal);
};

function saveTeamEdit() {
  if (!editingTeamId) return;

  const team = GameState.getTeam(currentGame, editingTeamId);
  const oldName = team.name;

  const newName = document.getElementById('teamNameInput').value;
  const newColor = document.getElementById('teamColorInput').value;

  History.addAction(currentGame, 'team-update', {
    teamId: editingTeamId,
    teamName: oldName,
    updates: { name: newName, color: newColor }
  });

  GameState.updateTeam(currentGame, editingTeamId, {
    name: newName,
    color: newColor
  });

  Storage.updateGame(currentGame.id, currentGame);
  closeModal(editTeamModal);
  renderGame();
  renderTeamsManager();
  editingTeamId = null;
}

// Modal controls
function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

// Setup event listeners
function setupEventListeners() {
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  menuBtn.addEventListener('click', openMenu);

  document.getElementById('addTeamBtn').addEventListener('click', () => window.addTeam());
  document.getElementById('closeMenuBtn').addEventListener('click', () => closeModal(menuModal));
  document.getElementById('cancelEditTeamBtn').addEventListener('click', () => closeModal(editTeamModal));
  document.getElementById('saveTeamBtn').addEventListener('click', saveTeamEdit);

  // Close modals on backdrop click
  questionModal.addEventListener('click', (e) => {
    if (e.target === questionModal) closeModal(questionModal);
  });
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeModal(menuModal);
  });
  editTeamModal.addEventListener('click', (e) => {
    if (e.target === editTeamModal) closeModal(editTeamModal);
  });

  // Close buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(questionModal);
      closeModal(menuModal);
      closeModal(editTeamModal);
    });
  });
}
