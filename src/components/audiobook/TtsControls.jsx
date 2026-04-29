export default function TtsControls({ tts, paragraphs }) {
  const { speaking, paused, currentIndex, rate, setRate, pitch, setPitch, voices, selectedVoice, setSelectedVoice, play, pause, resume, stop } = tts;

  const status = speaking ? (paused ? '일시정지' : '재생중') : '정지';

  return (
    <div className="tts-controls">
      <div className="tts-buttons">
        <button onClick={() => play(paragraphs, Math.max(currentIndex, 0))} disabled={speaking && !paused} title="재생">▶</button>
        <button onClick={pause} disabled={!speaking || paused} title="일시정지">⏸</button>
        <button onClick={resume} disabled={!paused} title="재개">⏯</button>
        <button onClick={stop} disabled={!speaking} title="정지">⏹</button>
      </div>

      <div className="tts-sliders">
        <label>속도: {rate.toFixed(1)}x
          <input type="range" min="0.6" max="1.6" step="0.1" value={rate} onChange={e => setRate(+e.target.value)} />
        </label>
        <label>피치: {pitch.toFixed(1)}
          <input type="range" min="0.7" max="1.3" step="0.1" value={pitch} onChange={e => setPitch(+e.target.value)} />
        </label>
      </div>

      {voices.length > 0 && (
        <div className="tts-voice">
          <label>음성:
            <select value={selectedVoice?.name || ''} onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="tts-status">
        상태: {status}
        {currentIndex >= 0 && speaking && (
          <span className="tts-current"> — "{(paragraphs[currentIndex] || '').slice(0, 40)}…"</span>
        )}
      </div>
    </div>
  );
}
