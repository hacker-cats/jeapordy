// Undo/Redo history management

const History = {
  MAX_HISTORY_SIZE: 100,

  // Add a new action to history
  addAction(game, action, data = {}) {
    // Clone current state before the action
    const stateBefore = GameState.cloneState(game);

    // If we're not at the end of history, remove all future history
    if (game.historyIndex < game.history.length - 1) {
      game.history = game.history.slice(0, game.historyIndex + 1);
    }

    // Create history entry
    const entry = {
      action: action,
      timestamp: new Date().toISOString(),
      data: data,
      stateBefore: stateBefore
    };

    game.history.push(entry);
    game.historyIndex = game.history.length - 1;

    // Limit history size
    if (game.history.length > this.MAX_HISTORY_SIZE) {
      game.history.shift();
      game.historyIndex--;
    }

    return game;
  },

  // Undo last action
  undo(game) {
    if (!this.canUndo(game)) {
      return game;
    }

    const entry = game.history[game.historyIndex];
    if (entry && entry.stateBefore) {
      game.state = JSON.parse(JSON.stringify(entry.stateBefore));
      game.historyIndex--;

      // Update status based on answered questions
      const progress = GameState.getProgress(game);
      if (progress.answered === 0) {
        game.status = 'new';
      } else if (progress.answered < progress.total) {
        game.status = 'in-progress';
      } else {
        game.status = 'completed';
      }
    }

    return game;
  },

  // Redo next action
  redo(game) {
    if (!this.canRedo(game)) {
      return game;
    }

    game.historyIndex++;
    const entry = game.history[game.historyIndex];

    // Re-apply the action
    if (entry) {
      this.reapplyAction(game, entry);
    }

    return game;
  },

  // Re-apply an action from history
  reapplyAction(game, entry) {
    switch (entry.action) {
      case 'answer-correct':
      case 'answer-incorrect':
        GameState.markQuestionAnswered(game, entry.data.categoryIndex, entry.data.questionIndex);
        GameState.updateScore(game, entry.data.teamId, entry.data.pointChange);
        break;

      case 'daily-double':
        GameState.markQuestionAnswered(game, entry.data.categoryIndex, entry.data.questionIndex);
        GameState.updateScore(game, entry.data.teamId, entry.data.pointChange);
        break;

      case 'question-reset':
        const index = game.state.answeredQuestions.indexOf(entry.data.questionId);
        if (index > -1) {
          game.state.answeredQuestions.splice(index, 1);
        }
        break;

      case 'team-add':
        GameState.addTeam(game, entry.data.teamName);
        break;

      case 'team-remove':
        GameState.removeTeam(game, entry.data.teamId);
        break;

      case 'team-update':
        GameState.updateTeam(game, entry.data.teamId, entry.data.updates);
        break;

      case 'score-adjust':
        GameState.updateScore(game, entry.data.teamId, entry.data.pointChange);
        break;
    }

    return game;
  },

  // Check if undo is possible
  canUndo(game) {
    return game.historyIndex >= 0;
  },

  // Check if redo is possible
  canRedo(game) {
    return game.historyIndex < game.history.length - 1;
  },

  // Get history summary for display
  getHistorySummary(game) {
    return game.history.map((entry, index) => {
      let description = '';

      switch (entry.action) {
        case 'answer-correct':
          description = `${entry.data.teamName} answered correctly (+${entry.data.pointChange})`;
          break;
        case 'answer-incorrect':
          description = `${entry.data.teamName} answered incorrectly (${entry.data.pointChange})`;
          break;
        case 'daily-double':
          const dd = entry.data.correct ? 'won' : 'lost';
          description = `${entry.data.teamName} ${dd} Daily Double (${entry.data.pointChange > 0 ? '+' : ''}${entry.data.pointChange})`;
          break;
        case 'question-reset':
          description = `Reset question ${entry.data.questionId}`;
          break;
        case 'team-add':
          description = `Added team: ${entry.data.teamName}`;
          break;
        case 'team-remove':
          description = `Removed team: ${entry.data.teamName}`;
          break;
        case 'team-update':
          description = `Updated team: ${entry.data.teamName}`;
          break;
        case 'score-adjust':
          description = `Adjusted ${entry.data.teamName} score (${entry.data.pointChange > 0 ? '+' : ''}${entry.data.pointChange})`;
          break;
        default:
          description = entry.action;
      }

      return {
        index: index,
        action: entry.action,
        description: description,
        timestamp: entry.timestamp,
        isCurrent: index === game.historyIndex
      };
    });
  },

  // Clear all history
  clearHistory(game) {
    game.history = [];
    game.historyIndex = -1;
    return game;
  }
};
