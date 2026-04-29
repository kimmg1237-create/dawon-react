import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function Ebooks() {
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [spreadMode, setSpreadMode] = useState(true); // 책 형태로 보기
  const viewerRef = useRef(null);

  useEffect(() => {
    supabase.from('ebooks').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset) => {
    const newPage = spreadMode ? pageNumber + (offset * 2) : pageNumber + offset;
    if (spreadMode) {
      if (offset > 0 && pageNumber + 2 <= numPages) {
        setPageNumber(newPage);
      } else if (offset < 0 && pageNumber - 2 >= 1) {
        setPageNumber(newPage);
      }
    } else {
      if (offset > 0 && pageNumber < numPages) {
        setPageNumber(newPage);
      } else if (offset < 0 && pageNumber > 1) {
        setPageNumber(newPage);
      }
    }
  };

  const goToPage = (page) => {
    setPageNumber(page);
  };

  const toggleSpreadMode = () => {
    setSpreadMode(!spreadMode);
    setPageNumber(1);
  };

  const pdfUrl = selected?.pdf_url ? selected.pdf_url.replace(/^http:\/\//i, 'https://') : '';

  return (
    <div className="page-ebooks">
      <h2>📖 전자책</h2>

      {!selected && (
        <div className="ebook-list">
          {books.length === 0 && <p className="empty">등록된 전자책이 없습니다.</p>}
          {books.map(b => (
            <div key={b.id} className="ebook-card" onClick={() => setSelected(b)}>
              {b.cover_url && <img src={b.cover_url} alt={b.title} />}
              <h3>{b.title}</h3>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="ebook-viewer" ref={viewerRef}>
          <div className="viewer-toolbar">
            <button onClick={() => setSelected(null)}>← 목록으로</button>
            <span className="viewer-title">{selected.title}</span>
            <button onClick={toggleSpreadMode}>
              {spreadMode ? '📄 단면' : '📖 양면'}
            </button>
            {selected.pdf_url && (
              <a className="btn-primary" href={selected.pdf_url} target="_blank" rel="noreferrer">
                PDF 새 탭에서 열기
              </a>
            )}
          </div>

          <div className="viewer-nav top">
            <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
              ‹ 이전
            </button>
            <span className="viewer-page-label">
              {spreadMode
                ? `${pageNumber}-${Math.min(pageNumber + 1, numPages)} / ${numPages}`
                : `${pageNumber} / ${numPages}`
              }
            </span>
            <button onClick={() => changePage(1)} disabled={spreadMode ? pageNumber + 2 > numPages : pageNumber >= numPages}>
              다음 ›
            </button>
          </div>

          <div className="viewer-pages">
            {pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="page-loading">PDF 로딩 중...</div>}
                error={<div className="page-loading">PDF를 불러올 수 없습니다.</div>}
              >
                <div className={`page-spread ${spreadMode ? 'double' : 'single'}`}>
                  {spreadMode ? (
                    <>
                      <Page
                        pageNumber={pageNumber}
                        width={400}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      {pageNumber + 1 <= numPages && (
                        <Page
                          pageNumber={pageNumber + 1}
                          width={400}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      )}
                    </>
                  ) : (
                    <Page
                      pageNumber={pageNumber}
                      width={600}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  )}
                </div>
              </Document>
            ) : (
              <div className="page-loading" style={{ padding: '100px', textAlign: 'center' }}>
                PDF 파일 URL이 없습니다. 관리자에서 PDF URL을 확인해주세요.
              </div>
            )}
          </div>

          <div className="viewer-nav">
            <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
              ‹ 이전
            </button>
            <span className="viewer-page-label">
              {spreadMode
                ? `${pageNumber}-${Math.min(pageNumber + 1, numPages)} / ${numPages}`
                : `${pageNumber} / ${numPages}`
              }
            </span>
            <button onClick={() => changePage(1)} disabled={spreadMode ? pageNumber + 2 > numPages : pageNumber >= numPages}>
              다음 ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
