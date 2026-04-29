import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';

export default function Ebooks() {
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    supabase.from('ebooks').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

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
            {selected.pdf_url && (
              <a className="btn-primary" href={selected.pdf_url} target="_blank" rel="noreferrer">
                PDF 새 탭에서 열기
              </a>
            )}
          </div>

          <div className="viewer-pages">
            {pdfUrl ? (
              <div className="pdf-container">
                <iframe
                  src={pdfUrl}
                  title={selected.title}
                  className="pdf-embed"
                  type="application/pdf"
                  allow="fullscreen"
                  loading="lazy"
                />
                <div className="pdf-fallback" style={{ display: 'none' }}>
                  <p>PDF가 표시되지 않으면 <a href={pdfUrl} target="_blank" rel="noreferrer">새 탭에서 열기</a>를 클릭하세요.</p>
                  <embed src={pdfUrl} type="application/pdf" width="100%" height="600px" />
                </div>
              </div>
            ) : (
              <div className="page-loading" style={{ padding: '100px', textAlign: 'center' }}>
                PDF 파일 URL이 없습니다. 관리자에서 PDF URL을 확인해주세요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
