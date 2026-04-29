import { useEffect, useState, useCallback, useRef } from 'react';
// import { Document, Page, pdfjs } from 'react-pdf'; // 임시 비활성화
import { supabase } from '../supabase';

// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`; // 임시 비활성화

const ZOOM_STEPS = [0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 2.5];
const ZOOM_DEFAULT_IDX = 6;

export default function Ebooks() {
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIdx, setZoomIdx] = useState(ZOOM_DEFAULT_IDX);
  const [dualMode, setDualMode] = useState(true);
  const [jumpInput, setJumpInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  useEffect(() => {
    supabase.from('ebooks').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') setCurrentPage(p => Math.min(p + (dualMode ? 2 : 1), numPages));
    if (e.key === 'ArrowLeft') setCurrentPage(p => Math.max(p - (dualMode ? 2 : 1), 1));
    if (e.key === '+' || e.key === '=') setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1));
    if (e.key === '-') setZoomIdx(i => Math.max(i - 1, 0));
    if (e.key === 'j' || e.key === 'J') {
      const pg = prompt('이동할 페이지 번호:');
      if (pg) setCurrentPage(Math.max(1, Math.min(+pg, numPages)));
    }
  }, [numPages, dualMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (dualMode && currentPage % 2 === 0) {
      setCurrentPage(p => Math.max(1, p - 1));
    }
  }, [dualMode, currentPage]);

  const pageStep = dualMode ? 2 : 1;

  const goPrev = () => setCurrentPage(p => Math.max(1, p - pageStep));
  const goNext = () => setCurrentPage(p => Math.min(numPages, p + pageStep));
  const goFirst = () => setCurrentPage(1);
  const goLast = () => {
    if (!numPages) return;
    if (dualMode) {
      setCurrentPage(numPages % 2 === 0 ? Math.max(1, numPages - 1) : numPages);
    } else {
      setCurrentPage(numPages);
    }
  };

  const pageLabel = `${currentPage}${dualMode && currentPage + 1 <= numPages ? `-${currentPage + 1}` : ''} / ${numPages || 0}`;

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement === viewerRef.current) {
      await document.exitFullscreen();
    } else {
      await viewerRef.current.requestFullscreen();
    }
  };

  const ReaderNav = ({ top = false }) => (
    <div className={`viewer-nav ${top ? 'top' : ''}`}>
      <button onClick={goFirst} disabled={currentPage <= 1}>⏮ 처음</button>
      <button onClick={goPrev} disabled={currentPage <= 1}>◀ 이전</button>
      <span className="viewer-page-label">{pageLabel}</span>
      <button onClick={goNext} disabled={currentPage >= numPages}>다음 ▶</button>
      <button onClick={goLast} disabled={currentPage >= numPages}>마지막 ⏭</button>
    </div>
  );

  const scale = ZOOM_STEPS[zoomIdx];

  return (
    <div className="page-ebooks">
      <h2>📖 전자책</h2>

      {/* 도서 목록 */}
      {!selected && (
        <div className="ebook-list">
          {books.length === 0 && <p className="empty">등록된 전자책이 없습니다.</p>}
          {books.map(b => (
            <div key={b.id} className="ebook-card" onClick={() => { setSelected(b); setCurrentPage(1); setJumpInput(''); setZoomIdx(ZOOM_DEFAULT_IDX); }}>
              {b.cover_url && <img src={b.cover_url} alt={b.title} />}
              <h3>{b.title}</h3>
            </div>
          ))}
        </div>
      )}

      {/* PDF 뷰어 */}
      {selected && (
        <div className={`ebook-viewer ${isFullscreen ? 'fullscreen' : ''}`} ref={viewerRef}>
          <div className="viewer-toolbar">
            <button onClick={() => { setSelected(null); setNumPages(0); }}>← 목록으로</button>
            <span className="viewer-title">{selected.title}</span>
            <div className="view-mode-group" role="group" aria-label="보기 모드 선택">
              <button className={!dualMode ? 'active' : ''} onClick={() => setDualMode(false)}>1쪽 보기</button>
              <button className={dualMode ? 'active' : ''} onClick={() => setDualMode(true)}>2쪽 보기</button>
            </div>
            <button onClick={toggleFullscreen}>{isFullscreen ? '전체화면 종료' : '전체화면'}</button>
            <button onClick={() => setZoomIdx(i => Math.max(i - 1, 0))}>-</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1))}>+</button>
            <button onClick={() => setZoomIdx(ZOOM_STEPS.indexOf(1.0))}>100%</button>
            <input type="number" min={1} max={numPages} value={jumpInput} placeholder="페이지"
              onChange={e => setJumpInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && jumpInput) { setCurrentPage(Math.max(1, Math.min(+jumpInput, numPages))); setJumpInput(''); } }}
              style={{ width: 60 }} />
          </div>

          <ReaderNav top />

          <div className="viewer-pages">
            {/* 임시: PDF 뷰어 기능 비활성화 (배포용) */}
            {/* TODO: react-pdf 브라우저 호환성 문제 해결 */}
            <div className="page-loading" style={{ padding: '100px', textAlign: 'center' }}>
              PDF 뷰어 기능이 일시적으로 비활성화되었습니다.<br />
              추후 업데이트에서 다시 제공될 예정입니다.
            </div>
            {/*
            <Document
              key={selected.id}
              file={selected.pdf_url}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
                setCurrentPage(1);
              }}
              loading={<div className="page-loading">PDF 로딩 중...</div>}
              error={<div className="page-loading">PDF를 불러오지 못했습니다. URL을 확인해주세요.</div>}
              noData={<div className="page-loading">등록된 PDF URL이 없습니다.</div>}
            >
              <div className={`page-spread ${dualMode ? 'dual' : 'single'}`}>
                <Page
                  key={`left-${selected.id}-${currentPage}-${scale}`}
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                {dualMode && currentPage + 1 <= numPages && (
                  <Page
                    key={`right-${selected.id}-${currentPage + 1}-${scale}`}
                    pageNumber={currentPage + 1}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                )}
              </div>
            </Document>
            */}
          </div>

          <ReaderNav />
        </div>
      )}
    </div>
  );
}
