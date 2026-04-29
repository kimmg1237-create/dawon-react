import { useEffect, useRef, useState } from 'react';
import useAudioBooks from '../hooks/useAudioBooks';
import useTts from '../hooks/useTts';
import BookLibrary from '../components/audiobook/BookLibrary';
import BookReader from '../components/audiobook/BookReader';
import TtsControls from '../components/audiobook/TtsControls';
import BookUploader from '../components/audiobook/BookUploader';
import { useAuth } from '../context/AuthContext';

export default function AudioBooks() {
  const { books, loading, selectedBook, selectBook, paragraphs, textLoading } = useAudioBooks();
  const tts = useTts();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [singleColumn, setSingleColumn] = useState(false);
  const [fontScale, setFontScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerShellRef = useRef(null);

  const handleParagraphClick = (idx) => {
    tts.play(paragraphs, idx);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === readerShellRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!paragraphs.length) return;
      if (e.key === 'ArrowRight') {
        setPage((p) => p + 1);
      }
      if (e.key === 'ArrowLeft') {
        setPage((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paragraphs.length]);

  const toggleFullscreen = async () => {
    if (!readerShellRef.current) return;
    if (document.fullscreenElement === readerShellRef.current) {
      await document.exitFullscreen();
    } else {
      await readerShellRef.current.requestFullscreen();
    }
  };

  if (loading) return <div className="page-loading">로딩 중...</div>;

  return (
    <div className={`page-audiobooks ${isFullscreen ? 'is-reader-fullscreen' : ''}`}>
      <h2>🎧 오디오북</h2>
      <div className="audiobooks-layout">
        {!isFullscreen && <BookLibrary books={books} selectedBook={selectedBook} onSelect={(b) => { selectBook(b); setPage(0); tts.stop(); }} />}
        <div className={`audiobooks-main ${isFullscreen ? 'fullscreen' : ''}`} ref={readerShellRef}>
          {textLoading ? <div className="page-loading">텍스트 로딩 중...</div> : (
            <>
              <TtsControls tts={tts} paragraphs={paragraphs} />
              <div className="reader-accessibility">
                <div className="reader-mode-group" role="group" aria-label="오디오북 보기 모드">
                  <button className={!singleColumn ? 'active' : ''} onClick={() => setSingleColumn(false)}>2쪽 보기</button>
                  <button className={singleColumn ? 'active' : ''} onClick={() => setSingleColumn(true)}>1쪽 보기</button>
                </div>
                <div className="reader-font-group" role="group" aria-label="글자 크기 선택">
                  <button onClick={() => setFontScale(1.0)}>보통</button>
                  <button onClick={() => setFontScale(1.2)}>큰글</button>
                  <button onClick={() => setFontScale(1.4)}>아주 큰글</button>
                </div>
                <div className="reader-fullscreen-group" role="group" aria-label="전체화면">
                  <button className="btn-primary" onClick={toggleFullscreen}>{isFullscreen ? '전체화면 종료' : '전체화면'}</button>
                </div>
              </div>
              <BookReader
                paragraphs={paragraphs}
                page={page}
                setPage={setPage}
                currentIndex={tts.currentIndex}
                onParagraphClick={handleParagraphClick}
                singleColumn={singleColumn}
                fontScale={fontScale}
                showTopNav
              />
            </>
          )}
        </div>
      </div>
      {isAdmin && <BookUploader onUploaded={() => window.location.reload()} />}
    </div>
  );
}
