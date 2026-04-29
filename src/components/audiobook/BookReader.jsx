import { useEffect, useRef } from 'react';

const PER_PAGE = 18;

export default function BookReader({ paragraphs, page, setPage, currentIndex, onParagraphClick, singleColumn = false, fontScale = 1.2, showTopNav = false }) {
  const readerRef = useRef(null);
  const totalPages = Math.ceil(paragraphs.length / PER_PAGE);
  const start = page * PER_PAGE;
  const pageParagraphs = paragraphs.slice(start, start + PER_PAGE);
  const half = Math.ceil(pageParagraphs.length / 2);
  const left = singleColumn ? pageParagraphs : pageParagraphs.slice(0, half);
  const right = singleColumn ? [] : pageParagraphs.slice(half);

  const ReaderNav = ({ top = false }) => (
    <div className={`reader-nav ${top ? 'top' : ''}`}>
      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>◀ 이전</button>
      <span>{page + 1} / {totalPages || 1}</span>
      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음 ▶</button>
    </div>
  );

  useEffect(() => {
    if (currentIndex >= 0) {
      const targetPage = Math.floor(currentIndex / PER_PAGE);
      if (targetPage !== page) setPage(targetPage);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex >= 0 && readerRef.current) {
      const el = readerRef.current.querySelector(`[data-idx="${currentIndex}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  if (paragraphs.length === 0) {
    return <div className="book-reader empty-reader"><p>도서를 선택해주세요.</p></div>;
  }

  return (
    <div className="book-reader" ref={readerRef}>
      {showTopNav && <ReaderNav top />}
      <div className={`reader-spread ${singleColumn ? 'single' : ''}`}>
        <div className="reader-page left-page">
          {left.map((text, i) => {
            const idx = start + i;
            return (
              <p key={idx} data-idx={idx}
                className={`paragraph ${idx === currentIndex ? 'highlight' : ''}`}
                style={{ fontSize: `${fontScale}rem` }}
                onClick={() => onParagraphClick(idx)}>
                {text}
              </p>
            );
          })}
        </div>
        {!singleColumn && <div className="reader-page right-page">
          {right.map((text, i) => {
            const idx = start + half + i;
            return (
              <p key={idx} data-idx={idx}
                className={`paragraph ${idx === currentIndex ? 'highlight' : ''}`}
                style={{ fontSize: `${fontScale}rem` }}
                onClick={() => onParagraphClick(idx)}>
                {text}
              </p>
            );
          })}
        </div>}
      </div>
      <ReaderNav />
    </div>
  );
}
