// YAML/JSON parser and validator for game configuration files

const Parser = {
  // Parse file content (auto-detect YAML or JSON)
  parse(fileContent, filename) {
    try {
      // Try JSON first
      if (filename.endsWith('.json')) {
        return this.parseJSON(fileContent);
      }
      // Try YAML
      else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        return this.parseYAML(fileContent);
      }
      // Auto-detect
      else {
        try {
          return this.parseJSON(fileContent);
        } catch (e) {
          return this.parseYAML(fileContent);
        }
      }
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  },

  // Parse JSON
  parseJSON(content) {
    try {
      const config = JSON.parse(content);
      return this.validate(config);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  },

  // Parse YAML (requires js-yaml library)
  parseYAML(content) {
    if (typeof jsyaml === 'undefined') {
      throw new Error('YAML parser not loaded. Please include js-yaml library.');
    }
    try {
      const config = jsyaml.load(content);
      return this.validate(config);
    } catch (error) {
      throw new Error(`Invalid YAML: ${error.message}`);
    }
  },

  // Validate game configuration (lenient - allows partial games)
  validate(config) {
    const errors = [];
    const warnings = [];

    // Check title - provide default if missing
    if (!config.title || typeof config.title !== 'string') {
      config.title = 'Untitled Game';
      warnings.push('No title provided, using "Untitled Game"');
    }

    // Check categories
    if (!config.categories || !Array.isArray(config.categories)) {
      errors.push('Missing or invalid "categories" array');
    } else {
      if (config.categories.length < 1) {
        errors.push('Must have at least 1 category');
      }
      if (config.categories.length > 6) {
        errors.push('Cannot have more than 6 categories');
      }

      // Validate each category
      config.categories.forEach((category, catIndex) => {
        // Provide default category name if missing
        if (!category.name || typeof category.name !== 'string') {
          category.name = `Category ${catIndex + 1}`;
          warnings.push(`Category ${catIndex + 1}: No name provided, using default`);
        }

        // Check questions array exists
        if (!category.questions || !Array.isArray(category.questions)) {
          category.questions = [];
          warnings.push(`Category ${catIndex + 1}: No questions array, creating empty array`);
        }

        // Validate each question (very lenient)
        category.questions.forEach((question, qIndex) => {
          // Ensure value exists and is a number
          if (typeof question.value !== 'number') {
            question.value = (qIndex + 1) * 200; // Default point value
            warnings.push(`Category ${catIndex + 1}, Question ${qIndex + 1}: No value provided, using ${question.value}`);
          }

          // Allow empty questions and answers
          if (question.question === undefined || question.question === null) {
            question.question = '';
          }
          if (typeof question.question !== 'string') {
            question.question = String(question.question);
          }

          if (question.answer === undefined || question.answer === null) {
            question.answer = '';
          }
          if (typeof question.answer !== 'string') {
            question.answer = String(question.answer);
          }

          // Ensure dailyDouble is boolean if present
          if (question.dailyDouble !== undefined && typeof question.dailyDouble !== 'boolean') {
            question.dailyDouble = Boolean(question.dailyDouble);
          }
        });
      });
    }

    // Validate settings if present (lenient)
    if (config.settings) {
      if (config.settings.pointValues && !Array.isArray(config.settings.pointValues)) {
        delete config.settings.pointValues;
        warnings.push('Settings: "pointValues" was invalid, removed');
      }
      if (config.settings.timerSeconds && typeof config.settings.timerSeconds !== 'number') {
        delete config.settings.timerSeconds;
        warnings.push('Settings: "timerSeconds" was invalid, removed');
      }
    }

    // Only throw errors for critical issues
    if (errors.length > 0) {
      throw new Error('Validation errors:\n' + errors.join('\n'));
    }

    // Log warnings to console
    if (warnings.length > 0) {
      console.warn('Validation warnings:', warnings);
    }

    return config;
  },

  // Read file as text
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // Parse uploaded file
  async parseFile(file) {
    try {
      const content = await this.readFile(file);
      const config = this.parse(content, file.name);
      return { success: true, config: config };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
