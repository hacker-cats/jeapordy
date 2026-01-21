// Theme management

const ThemeManager = {
  // Built-in theme presets
  presets: {
    classic: {
      name: 'Classic Jeopardy',
      boardColor: '#060ce9',
      questionColor: '#060ce9',
      textColor: '#d69f4c',
      accentColor: '#d69f4c',
      backgroundColor: '#0f172a'
    },
    modern: {
      name: 'Modern Dark',
      boardColor: '#1e293b',
      questionColor: '#334155',
      textColor: '#f1f5f9',
      accentColor: '#3b82f6',
      backgroundColor: '#0f172a'
    },
    neon: {
      name: 'Neon Night',
      boardColor: '#0f172a',
      questionColor: '#1e1b4b',
      textColor: '#a78bfa',
      accentColor: '#c026d3',
      backgroundColor: '#000000'
    },
    forest: {
      name: 'Forest Green',
      boardColor: '#14532d',
      questionColor: '#166534',
      textColor: '#bbf7d0',
      accentColor: '#4ade80',
      backgroundColor: '#052e16'
    },
    sunset: {
      name: 'Sunset Orange',
      boardColor: '#7c2d12',
      questionColor: '#9a3412',
      textColor: '#fed7aa',
      accentColor: '#fb923c',
      backgroundColor: '#431407'
    },
    ocean: {
      name: 'Ocean Blue',
      boardColor: '#0c4a6e',
      questionColor: '#075985',
      textColor: '#bae6fd',
      accentColor: '#38bdf8',
      backgroundColor: '#082f49'
    },
    royal: {
      name: 'Royal Purple',
      boardColor: '#4c1d95',
      questionColor: '#5b21b6',
      textColor: '#e9d5ff',
      accentColor: '#a855f7',
      backgroundColor: '#2e1065'
    },
    crimson: {
      name: 'Crimson Red',
      boardColor: '#7f1d1d',
      questionColor: '#991b1b',
      textColor: '#fecaca',
      accentColor: '#f87171',
      backgroundColor: '#450a0a'
    }
  },

  // Apply theme to the page
  applyTheme(themeConfig) {
    if (!themeConfig) {
      // No theme, use defaults
      return;
    }

    let colors;

    // Check if it's a preset
    if (themeConfig.preset && this.presets[themeConfig.preset]) {
      colors = this.presets[themeConfig.preset];
    } else {
      // Custom colors
      colors = themeConfig;
    }

    // Apply CSS variables
    const root = document.documentElement;

    if (colors.boardColor) {
      root.style.setProperty('--jeopardy-blue', colors.boardColor);
    }

    if (colors.questionColor) {
      root.style.setProperty('--jeopardy-blue', colors.questionColor);
    }

    if (colors.textColor) {
      root.style.setProperty('--jeopardy-gold', colors.textColor);
    }

    if (colors.accentColor) {
      root.style.setProperty('--primary-color', colors.accentColor);
    }

    if (colors.backgroundColor) {
      root.style.setProperty('--bg-color', colors.backgroundColor);
    }
  },

  // Get theme from config
  getTheme(config) {
    return config.theme || null;
  },

  // Get list of preset themes
  getPresets() {
    return Object.keys(this.presets).map(key => ({
      id: key,
      ...this.presets[key]
    }));
  },

  // Get preset by name
  getPreset(name) {
    return this.presets[name] || null;
  },

  // Validate custom theme
  validateCustomTheme(theme) {
    const required = ['boardColor', 'questionColor', 'textColor', 'accentColor'];
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;

    for (const field of required) {
      if (!theme[field]) {
        return { valid: false, error: `Missing ${field}` };
      }
      if (!hexPattern.test(theme[field])) {
        return { valid: false, error: `Invalid hex color for ${field}` };
      }
    }

    return { valid: true };
  }
};
