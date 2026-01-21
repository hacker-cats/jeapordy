// Game state management

const GameState = {
  // Generate a unique ID
  generateId() {
    return 'game-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },

  // Create a new game instance from config
  createGame(config) {
    const gameId = this.generateId();
    const now = new Date().toISOString();

    // Initialize default teams if none exist
    const defaultTeams = [
      {
        id: 'team-1',
        name: 'Team 1',
        color: '#3b82f6',
        score: 0
      }
    ];

    // Parse settings from config or use defaults
    const settings = {
      timerEnabled: false,
      timerSeconds: 30,
      soundEnabled: false,
      showAnswers: false,
      allowNegativeScores: true,
      doubleJeopardy: config.settings?.doubleJeopardy || false,
      ...(config.settings || {})
    };

    return {
      id: gameId,
      title: config.title || 'Untitled Game',
      createdAt: now,
      lastPlayed: now,
      status: 'new',
      config: config,
      state: {
        currentQuestion: null,
        answeredQuestions: [],
        teams: defaultTeams,
        settings: settings,
        finalJeopardy: {
          wagers: {},  // teamId: wagerAmount
          answers: {}, // teamId: correct/incorrect
          completed: false
        }
      },
      history: [],
      historyIndex: -1
    };
  },

  // Get question ID from category and question indices
  getQuestionId(categoryIndex, questionIndex) {
    return `cat${categoryIndex}-q${questionIndex}`;
  },

  // Check if a question has been answered
  isQuestionAnswered(game, categoryIndex, questionIndex) {
    const questionId = this.getQuestionId(categoryIndex, questionIndex);
    return game.state.answeredQuestions.includes(questionId);
  },

  // Get a question from the config
  getQuestion(game, categoryIndex, questionIndex) {
    if (!game.config.categories || !game.config.categories[categoryIndex]) {
      return null;
    }
    const category = game.config.categories[categoryIndex];
    if (!category.questions || !category.questions[questionIndex]) {
      return null;
    }
    return {
      ...category.questions[questionIndex],
      categoryName: category.name,
      categoryIndex: categoryIndex,
      questionIndex: questionIndex,
      id: this.getQuestionId(categoryIndex, questionIndex)
    };
  },

  // Mark a question as answered
  markQuestionAnswered(game, categoryIndex, questionIndex) {
    const questionId = this.getQuestionId(categoryIndex, questionIndex);
    if (!game.state.answeredQuestions.includes(questionId)) {
      game.state.answeredQuestions.push(questionId);
    }
    game.lastPlayed = new Date().toISOString();

    // Update status
    const totalQuestions = this.getTotalQuestions(game);
    if (game.state.answeredQuestions.length >= totalQuestions) {
      game.status = 'completed';
    } else if (game.status === 'new') {
      game.status = 'in-progress';
    }

    return game;
  },

  // Get total number of questions in game
  getTotalQuestions(game) {
    if (!game.config.categories) return 0;
    return game.config.categories.reduce((total, category) => {
      return total + (category.questions ? category.questions.length : 0);
    }, 0);
  },

  // Get game progress
  getProgress(game) {
    const total = this.getTotalQuestions(game);
    const answered = game.state.answeredQuestions.length;
    return {
      answered: answered,
      total: total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  },

  // Team management
  addTeam(game, teamName = null) {
    const teamNumber = game.state.teams.length + 1;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[game.state.teams.length % colors.length];

    const newTeam = {
      id: 'team-' + Date.now(),
      name: teamName || `Team ${teamNumber}`,
      color: color,
      score: 0
    };

    game.state.teams.push(newTeam);
    return newTeam;
  },

  removeTeam(game, teamId) {
    game.state.teams = game.state.teams.filter(team => team.id !== teamId);
    return game;
  },

  updateTeam(game, teamId, updates) {
    const team = game.state.teams.find(t => t.id === teamId);
    if (team) {
      Object.assign(team, updates);
    }
    return game;
  },

  getTeam(game, teamId) {
    return game.state.teams.find(t => t.id === teamId);
  },

  // Scoring
  updateScore(game, teamId, points) {
    const team = this.getTeam(game, teamId);
    if (team) {
      team.score += points;
      if (!game.state.settings.allowNegativeScores && team.score < 0) {
        team.score = 0;
      }
    }
    game.lastPlayed = new Date().toISOString();
    return game;
  },

  // Daily Double wager validation
  getMaxWager(game, teamId) {
    const team = this.getTeam(game, teamId);
    if (!team) return 0;

    // Get highest question value
    let maxValue = 0;
    if (game.config.categories) {
      game.config.categories.forEach(category => {
        if (category.questions) {
          category.questions.forEach(question => {
            if (question.value > maxValue) {
              maxValue = question.value;
            }
          });
        }
      });
    }

    return Math.max(team.score, maxValue);
  },

  getMinWager() {
    return 5;
  },

  // Final Jeopardy functions
  hasFinalJeopardy(game) {
    return game.config.finalJeopardy &&
           game.config.finalJeopardy.question &&
           game.config.finalJeopardy.answer;
  },

  isFinalJeopardyReady(game) {
    // Check if all main board questions are answered
    const progress = this.getProgress(game);
    return progress.answered >= progress.total && this.hasFinalJeopardy(game);
  },

  setFinalJeopardyWager(game, teamId, wager) {
    if (!game.state.finalJeopardy) {
      game.state.finalJeopardy = { wagers: {}, answers: {}, completed: false };
    }
    game.state.finalJeopardy.wagers[teamId] = wager;
    return game;
  },

  setFinalJeopardyAnswer(game, teamId, isCorrect) {
    if (!game.state.finalJeopardy) {
      game.state.finalJeopardy = { wagers: {}, answers: {}, completed: false };
    }
    game.state.finalJeopardy.answers[teamId] = isCorrect;

    // Update score
    const wager = game.state.finalJeopardy.wagers[teamId] || 0;
    const pointChange = isCorrect ? wager : -wager;
    this.updateScore(game, teamId, pointChange);

    return game;
  },

  completeFinalJeopardy(game) {
    if (!game.state.finalJeopardy) {
      game.state.finalJeopardy = { wagers: {}, answers: {}, completed: false };
    }
    game.state.finalJeopardy.completed = true;
    game.status = 'completed';
    return game;
  },

  getFinalJeopardyMaxWager(game, teamId) {
    const team = this.getTeam(game, teamId);
    return team ? Math.max(0, team.score) : 0;
  },

  // Deep clone for history
  cloneState(game) {
    return JSON.parse(JSON.stringify(game.state));
  }
};
