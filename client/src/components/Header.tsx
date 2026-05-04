import { Copy } from 'lucide-react';

interface HeaderProps {
  playerCode: string | null;
  resumeCode: string;
  onResumeCodeChange: (code: string) => void;
  onResume: () => void;
}

export function Header({ playerCode, resumeCode, onResumeCodeChange, onResume }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>Definitely Not Wordle</h1>
      </div>
      <div className="code-panel">
        <span>Player Code</span>
        <strong>{playerCode ?? 'Loading'}</strong>
        <button
          type="button"
          aria-label="Copy player code"
          title="Copy player code"
          onClick={() => playerCode && navigator.clipboard.writeText(playerCode)}
        >
          <Copy size={16} />
        </button>
        <p>Use this code to return to your games on another device.</p>
        <div className="resume-row">
          <input value={resumeCode} onChange={(event) => onResumeCodeChange(event.target.value)} placeholder="Enter code" />
          <button type="button" onClick={onResume}>Resume</button>
        </div>
      </div>
    </header>
  );
}
