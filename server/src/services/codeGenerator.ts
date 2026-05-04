const WORDS = ['LIME', 'MINT', 'PLUM', 'PEAR', 'KIWI', 'SAGE', 'BOLT', 'NOVA'];

export function generatePlayerCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${number}`;
}
