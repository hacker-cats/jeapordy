// localStorage wrapper for game data management

const Storage = {
  STORAGE_KEY: 'jeopardy_games',

  // Get all games from localStorage
  getAllGames() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  // Get a specific game by ID
  getGame(gameId) {
    const games = this.getAllGames();
    return games.find(game => game.id === gameId);
  },

  // Save a new game
  saveGame(game) {
    try {
      const games = this.getAllGames();
      games.push(game);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games));
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  },

  // Update an existing game
  updateGame(gameId, updatedGame) {
    try {
      const games = this.getAllGames();
      const index = games.findIndex(game => game.id === gameId);
      if (index !== -1) {
        games[index] = { ...games[index], ...updatedGame };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  },

  // Delete a game
  deleteGame(gameId) {
    try {
      const games = this.getAllGames();
      const filtered = games.filter(game => game.id !== gameId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  },

  // Check if localStorage is available and has space
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get storage usage information
  getStorageInfo() {
    const data = localStorage.getItem(this.STORAGE_KEY) || '';
    const sizeInBytes = new Blob([data]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    return {
      bytes: sizeInBytes,
      kb: sizeInKB,
      gameCount: this.getAllGames().length
    };
  },

  // Clear all game data
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};
