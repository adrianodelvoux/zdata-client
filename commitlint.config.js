export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case'],
    ],
    'header-max-length': [2, 'always', 500], // Aumenta o limite de 100 para 150 caracteres
    'body-max-line-length': [2, 'always', 200], // Limite para linhas do corpo da mensagem
  },
};
