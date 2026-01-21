// dif iculty: utilidades para formatear y colorear niveles de dificultad
export const DIFFICULTY_LEVELS = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  ULTRAHARD: 'Muy Difícil',
};

export const getDifficultyLabel = (value) => {
  return DIFFICULTY_LEVELS[value] || value;
};

export const getDifficultyColor = (value) => {
  switch (value) {
    case 'EASY':
      return 'success';
    case 'MEDIUM':
      return 'info';
    case 'HARD':
      return 'warning';
    case 'ULTRAHARD':
      return 'error';
    default:
      return 'default';
  }
};
