import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Home() {
  const [heroTitle, setHeroTitle] = useState('다원출판사');
  const [heroIntro, setHeroIntro] = useState('');
  const [banners, setBanners] = useState([]);
  const [books, setBooks] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bookPage, setBookPage] = useState(0);

  useEffect(() => {
    supabase.from('home_page').select('*').single().then(({ data }) => {
      if (data) { setHeroTitle(data.hero_title); setHeroIntro(data.hero_intro); }
    });
    supabase.from('home_banners').select('*').order('sort_order').then(({ data }) => {
      if (data) setBanners(data);
    });
    supabase.from('home_books').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  // 배너 자동 회전
  useEffect(() => {
    if (banners.length <= 1) return;
    const iv = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(iv);
  }, [banners.length]);

  useEffect(() => {
    if (books.length <= 1) return;
    const iv = setInterval(() => setBookPage(p => (p + 1) % books.length), 6000);
    return () => clearInterval(iv);
  }, [books.length]);

  const totalPages = books.length;
  const featuredBook = books[bookPage] ?? null;

  return (
    <div className="page-home">
      {/* 추천 도서 */}
      <section className="section featured-books">
        <h2>내가 올린 책</h2>
        <p className="featured-subtitle">업로드한 책들이 자동으로 넘어가며, 옆에서 간단한 설명을 확인할 수 있어요.</p>
        {books.length === 0 && <p className="empty">등록된 도서가 없습니다.</p>}
        {featuredBook && (
          <div className={`featured-card ${bookPage % 2 === 1 ? 'reverse' : ''}`}>
            <div className="featured-media">
              {featuredBook.image_url ? (
                <img src={featuredBook.image_url} alt={featuredBook.title} />
              ) : (
                <div className="featured-placeholder">표지 준비중</div>
              )}
            </div>
            <div className="featured-content">
              <h3>{featuredBook.title}</h3>
              <p>{featuredBook.description || '책 설명이 아직 없습니다. 간단한 소개를 추가해 보세요.'}</p>
              <div className="featured-meta">
                <span>현재 도서 {bookPage + 1} / {totalPages}</span>
                <span>{books.length}권의 업로드 도서</span>
              </div>
              <Link to="/store" className="btn-primary featured-cta">구매처 보기</Link>
            </div>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={bookPage === 0} onClick={() => setBookPage(p => p - 1)}>◀</button>
            <span>{bookPage + 1} / {totalPages}</span>
            <button disabled={bookPage >= totalPages - 1} onClick={() => setBookPage(p => p + 1)}>▶</button>
          </div>
        )}
        {books.length > 1 && (
          <div className="featured-titles">
            {books.map((b, i) => (
              <button
                key={b.id}
                className={`featured-chip ${i === bookPage ? 'active' : ''}`}
                onClick={() => setBookPage(i)}
              >
                {b.title}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
