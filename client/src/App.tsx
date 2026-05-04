import { useCallback, useEffect, useState } from 'react';
import type { GameState, PlayerState } from '@wordle/shared';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { Keyboard } from './components/Keyboard';
import { StatsPanel } from './components/StatsPanel';
import { createPlayer, revealAnswer, resumePlayer, savedPlayerCode, savePlayerCode, startGame, submitGuess } from './api';

export function App() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [resumeCode, setResumeCode] = useState('');
  const [message, setMessage] = useState('Loading game...');

  const bootstrap = useCallback(async () => {
    try {
      const code = savedPlayerCode();
      const nextPlayer = code ? await resumePlayer(code) : await createPlayer();
      savePlayerCode(nextPlayer.code);
      const nextGame = nextPlayer.activeGame ?? await startGame(nextPlayer.code);
      setPlayer(nextPlayer);
      setGame(nextGame);
      setMessage('Guess any five letters.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the game.');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const refreshPlayer = useCallback(async (code: string) => {
    const nextPlayer = await resumePlayer(code);
    setPlayer(nextPlayer);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!player || !game || game.status !== 'active') return;
    try {
      const updated = await submitGuess(game.id, player.code, currentGuess);
      setGame(updated);
      setCurrentGuess('');
      if (updated.status === 'won') {
        setMessage('Solved. Nicely done.');
        await refreshPlayer(player.code);
      } else if (updated.status === 'lost') {
        setMessage('Game over. Reveal the answer or start again later.');
        await refreshPlayer(player.code);
      } else {
        setMessage('Keep going.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Guess failed.');
    }
  }, [currentGuess, game, player, refreshPlayer]);

  const handleKey = useCallback((key: string) => {
    if (key === 'Enter') void handleSubmit();
    else if (key === 'Backspace') setCurrentGuess((value) => value.slice(0, -1));
    else if (/^[a-z]$/i.test(key)) setCurrentGuess((value) => (value.length < 5 ? value + key.toLowerCase() : value));
  }, [handleSubmit]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleKey(event.key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  async function handleResume() {
    try {
      const nextPlayer = await resumePlayer(resumeCode.trim().toUpperCase());
      savePlayerCode(nextPlayer.code);
      const nextGame = nextPlayer.activeGame ?? await startGame(nextPlayer.code);
      setPlayer(nextPlayer);
      setGame(nextGame);
      setCurrentGuess('');
      setMessage('Player resumed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not resume player.');
    }
  }

  async function handleReveal() {
    if (!player || !game) return;
    const result = await revealAnswer(game.id, player.code);
    setMessage(`Answer: ${result.answer.toUpperCase()}`);
  }

  return (
    <main className="app-shell">
      <Header playerCode={player?.code ?? null} resumeCode={resumeCode} onResumeCodeChange={setResumeCode} onResume={handleResume} />
      <section className="game-layout">
        <div className="game-area">
          <Board game={game} currentGuess={currentGuess} />
          <p className="message">{message}</p>
          <Keyboard game={game} onKey={handleKey} />
          <button className="secondary-action" type="button" onClick={handleReveal}>Reveal answer</button>
        </div>
        <StatsPanel player={player} />
      </section>
    </main>
  );
}
