const VALID_PROFILES = ['intensive', 'balanced', 'relaxed'];

function validateExamConfig(config) {
  const errors = [];

  if (!config.code) errors.push('code required');
  if (!config.name) errors.push('name required');
  if (!config.format) errors.push('format required');
  if (!config.domains) errors.push('domains required');

  if (config.domains && Array.isArray(config.domains)) {
    const total = config.domains.reduce((sum, d) => sum + (d.weight || 0), 0);
    if (total !== 100) errors.push('Domain weights must sum to 100');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

function validateUserSettings(settings) {
  const errors = [];

  if (settings.profile && !VALID_PROFILES.includes(settings.profile)) {
    errors.push(`Profile must be one of: ${VALID_PROFILES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

module.exports = { validateExamConfig, validateUserSettings };
