// Game Builder logic

let gameData = {
  title: 'My Jeopardy Game',
  categories: [],
  dailyDouble: null, // {col, row}
  finalJeopardy: null // {category, question, answer}
};

let currentEditCell = null;
let numColumns = 5;
let numRows = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeGrid();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('backBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
      window.location.href = 'index.html';
    }
  });

  document.getElementById('gameTitle').addEventListener('input', (e) => {
    gameData.title = e.target.value;
  });

  document.getElementById('addColumnBtn').addEventListener('click', addColumn);
  document.getElementById('removeColumnBtn').addEventListener('click', removeColumn);
  document.getElementById('addRowBtn').addEventListener('click', addRow);
  document.getElementById('removeRowBtn').addEventListener('click', removeRow);

  document.getElementById('exportYamlBtn').addEventListener('click', () => exportGame('yaml'));
  document.getElementById('exportJsonBtn').addEventListener('click', () => exportGame('json'));
  document.getElementById('saveGameBtn').addEventListener('click', saveGame);

  document.getElementById('cancelEditBtn').addEventListener('click', () => closeModal());
  document.getElementById('saveEditBtn').addEventListener('click', saveCellEdit);

  document.getElementById('dailyDoubleCheck').addEventListener('change', handleDailyDoubleChange);

  // Final Jeopardy toggle
  document.getElementById('enableFinalJeopardy').addEventListener('change', (e) => {
    document.getElementById('fjFields').style.display = e.target.checked ? 'block' : 'none';
  });

  // Close modal on backdrop click
  const modal = document.getElementById('cellEditorModal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.querySelector('.close-btn').addEventListener('click', closeModal);
}

// Initialize grid
function initializeGrid() {
  numColumns = 5;
  numRows = 5;

  gameData.categories = [];
  for (let i = 0; i < numColumns; i++) {
    gameData.categories.push({
      name: `Category ${i + 1}`,
      questions: []
    });

    for (let j = 0; j < numRows; j++) {
      gameData.categories[i].questions.push({
        value: (j + 1) * 200,
        question: '',
        answer: '',
        summary: ''
      });
    }
  }

  renderGrid();
}

// Grid manipulation
function addColumn() {
  if (numColumns >= 6) {
    alert('Maximum 6 columns allowed');
    return;
  }

  numColumns++;
  const newCategory = {
    name: `Category ${numColumns}`,
    questions: []
  };

  for (let j = 0; j < numRows; j++) {
    newCategory.questions.push({
      value: (j + 1) * 200,
      question: '',
      answer: '',
      summary: ''
    });
  }

  gameData.categories.push(newCategory);
  renderGrid();
}

function removeColumn() {
  if (numColumns <= 1) {
    alert('Must have at least 1 column');
    return;
  }

  if (confirm('Remove the last column? This cannot be undone.')) {
    numColumns--;
    gameData.categories.pop();

    // Clear daily double if it was in removed column
    if (gameData.dailyDouble && gameData.dailyDouble.col === numColumns) {
      gameData.dailyDouble = null;
    }

    renderGrid();
  }
}

function addRow() {
  if (numRows >= 10) {
    alert('Maximum 10 rows allowed');
    return;
  }

  numRows++;
  gameData.categories.forEach(category => {
    category.questions.push({
      value: numRows * 200,
      question: '',
      answer: '',
      summary: ''
    });
  });

  renderGrid();
}

function removeRow() {
  if (numRows <= 1) {
    alert('Must have at least 1 row');
    return;
  }

  if (confirm('Remove the last row? This cannot be undone.')) {
    numRows--;
    gameData.categories.forEach(category => {
      category.questions.pop();
    });

    // Clear daily double if it was in removed row
    if (gameData.dailyDouble && gameData.dailyDouble.row === numRows) {
      gameData.dailyDouble = null;
    }

    renderGrid();
  }
}

// Render grid
function renderGrid() {
  const grid = document.getElementById('builderGrid');
  grid.innerHTML = '';
  grid.className = `builder-grid cols-${numColumns}`;

  // Render category headers
  gameData.categories.forEach((category, col) => {
    const cell = createCategoryCell(category, col);
    grid.appendChild(cell);
  });

  // Render question cells
  for (let row = 0; row < numRows; row++) {
    gameData.categories.forEach((category, col) => {
      const question = category.questions[row];
      const cell = createQuestionCell(question, col, row);
      grid.appendChild(cell);
    });
  }
}

// Create category cell
function createCategoryCell(category, col) {
  const cell = document.createElement('div');
  cell.className = 'builder-cell category';
  cell.textContent = category.name || `Category ${col + 1}`;
  cell.onclick = () => editCategory(col);
  return cell;
}

// Create question cell
function createQuestionCell(question, col, row) {
  const cell = document.createElement('div');
  cell.className = 'builder-cell';

  const hasContent = question.question || question.answer;
  const isDailyDouble = gameData.dailyDouble &&
    gameData.dailyDouble.col === col &&
    gameData.dailyDouble.row === row;

  if (hasContent) {
    cell.innerHTML = `
      <div class="cell-content">
        ${question.summary ? `<div class="cell-summary">${question.summary}</div>` : ''}
        <div class="cell-value">$${question.value}</div>
        <div class="cell-question">${question.question || '(No question)'}</div>
      </div>
      <div class="cell-footer">
        <span>${isDailyDouble ? '<span class="cell-dd-indicator">DD</span>' : ''}</span>
      </div>
    `;
  } else {
    cell.innerHTML = `
      <div class="cell-empty">Click to add question</div>
    `;
  }

  cell.onclick = () => editQuestion(col, row);
  return cell;
}

// Edit category
function editCategory(col) {
  currentEditCell = { type: 'category', col };

  document.getElementById('editorTitle').textContent = 'Edit Category';
  document.getElementById('categoryEditor').style.display = 'block';
  document.getElementById('questionEditor').style.display = 'none';

  document.getElementById('categoryName').value = gameData.categories[col].name;

  openModal();
}

// Edit question
function editQuestion(col, row) {
  currentEditCell = { type: 'question', col, row };

  const question = gameData.categories[col].questions[row];
  const isDailyDouble = gameData.dailyDouble &&
    gameData.dailyDouble.col === col &&
    gameData.dailyDouble.row === row;

  document.getElementById('editorTitle').textContent = `Edit Question - ${gameData.categories[col].name}`;
  document.getElementById('categoryEditor').style.display = 'none';
  document.getElementById('questionEditor').style.display = 'block';

  document.getElementById('questionSummary').value = question.summary || '';
  document.getElementById('pointValue').value = question.value;
  document.getElementById('questionText').value = question.question;
  document.getElementById('answerText').value = question.answer;
  document.getElementById('dailyDoubleCheck').checked = isDailyDouble;

  openModal();
}

// Handle daily double change
function handleDailyDoubleChange(e) {
  if (!currentEditCell || currentEditCell.type !== 'question') return;

  if (e.target.checked) {
    // Check if there's already a daily double
    if (gameData.dailyDouble) {
      const currentIsSame = gameData.dailyDouble.col === currentEditCell.col &&
        gameData.dailyDouble.row === currentEditCell.row;

      if (!currentIsSame) {
        alert('Only one Daily Double is allowed. The existing Daily Double will be removed.');
      }
    }
  }
}

// Save cell edit
function saveCellEdit() {
  if (!currentEditCell) return;

  if (currentEditCell.type === 'category') {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
      alert('Category name cannot be empty');
      return;
    }
    gameData.categories[currentEditCell.col].name = name;
  } else if (currentEditCell.type === 'question') {
    const question = gameData.categories[currentEditCell.col].questions[currentEditCell.row];

    question.summary = document.getElementById('questionSummary').value.trim();
    question.value = parseInt(document.getElementById('pointValue').value) || 200;
    question.question = document.getElementById('questionText').value.trim();
    question.answer = document.getElementById('answerText').value.trim();

    const isDailyDouble = document.getElementById('dailyDoubleCheck').checked;

    // Handle daily double
    if (isDailyDouble) {
      gameData.dailyDouble = { col: currentEditCell.col, row: currentEditCell.row };
    } else {
      // Clear if this was the daily double
      if (gameData.dailyDouble &&
          gameData.dailyDouble.col === currentEditCell.col &&
          gameData.dailyDouble.row === currentEditCell.row) {
        gameData.dailyDouble = null;
      }
    }
  }

  closeModal();
  renderGrid();
}

// Modal controls
function openModal() {
  document.getElementById('cellEditorModal').classList.add('active');
}

function closeModal() {
  document.getElementById('cellEditorModal').classList.remove('active');
  currentEditCell = null;
}

// Export game
function exportGame(format) {
  // Validate
  if (!gameData.title.trim()) {
    alert('Please enter a game title');
    return;
  }

  // Build config
  const config = {
    title: gameData.title,
    categories: gameData.categories.map(cat => ({
      name: cat.name,
      questions: cat.questions.map((q, index) => {
        const questionObj = {
          value: q.value,
          question: q.question || '',
          answer: q.answer || ''
        };

        // Add daily double if this is it
        if (gameData.dailyDouble) {
          const catIndex = gameData.categories.indexOf(cat);
          if (gameData.dailyDouble.col === catIndex && gameData.dailyDouble.row === index) {
            questionObj.dailyDouble = true;
          }
        }

        return questionObj;
      })
    })),
    settings: {
      allowNegativeScores: true
    }
  };

  // Add Final Jeopardy if enabled
  const fjEnabled = document.getElementById('enableFinalJeopardy').checked;
  if (fjEnabled) {
    const category = document.getElementById('fjCategoryInput').value.trim();
    const question = document.getElementById('fjQuestionInput').value.trim();
    const answer = document.getElementById('fjAnswerInput').value.trim();

    config.finalJeopardy = {
      category: category || 'Final Jeopardy',
      question: question || '',
      answer: answer || ''
    };
  }

  // Export
  if (format === 'yaml') {
    const yaml = jsyaml.dump(config);
    downloadFile(yaml, `${gameData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.yaml`, 'text/yaml');
  } else {
    const json = JSON.stringify(config, null, 2);
    downloadFile(json, `${gameData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`, 'application/json');
  }
}

// Save game directly
function saveGame() {
  // Validate
  if (!gameData.title.trim()) {
    alert('Please enter a game title');
    return;
  }

  // Build config
  const config = {
    title: gameData.title,
    categories: gameData.categories.map((cat, catIndex) => ({
      name: cat.name,
      questions: cat.questions.map((q, qIndex) => {
        const questionObj = {
          value: q.value,
          question: q.question || '',
          answer: q.answer || ''
        };

        // Add daily double if this is it
        if (gameData.dailyDouble &&
            gameData.dailyDouble.col === catIndex &&
            gameData.dailyDouble.row === qIndex) {
          questionObj.dailyDouble = true;
        }

        return questionObj;
      })
    })),
    settings: {
      allowNegativeScores: true
    }
  };

  // Add Final Jeopardy if enabled
  const fjEnabled = document.getElementById('enableFinalJeopardy').checked;
  if (fjEnabled) {
    const category = document.getElementById('fjCategoryInput').value.trim();
    const question = document.getElementById('fjQuestionInput').value.trim();
    const answer = document.getElementById('fjAnswerInput').value.trim();

    config.finalJeopardy = {
      category: category || 'Final Jeopardy',
      question: question || '',
      answer: answer || ''
    };
  }

  // Create and save game
  const game = GameState.createGame(config);
  const saved = Storage.saveGame(game);

  if (saved) {
    alert('Game saved successfully!');
    window.location.href = 'index.html';
  } else {
    alert('Failed to save game. Storage may be full.');
  }
}

// Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
