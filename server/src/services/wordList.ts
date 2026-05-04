export const ANSWERS = [
  'apple',
  'brave',
  'cider',
  'crane',
  'dwell',
  'flint',
  'grape',
  'honey',
  'lemon',
  'mango',
  'olive',
  'pearl',
  'plant',
  'proud',
  'river',
  'slate',
  'spice',
  'stone',
  'table',
  'wheat'
];

export function chooseAnswer() {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
