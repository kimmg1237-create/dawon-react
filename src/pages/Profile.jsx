import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Profile() {
  const [p, setP] = useState(null);
  const contentAreas = Array.isArray(p?.content_areas) ? p.content_areas : [];

  useEffect(() => {
    supabase.from('profile_page').select('*').single().then(({ data }) => {
      if (data) setP(data);
    });
  }, []);

  if (!p) return <div className="page-loading">로딩 중...</div>;

  return (
    <div className="page-profile">
      <div className="profile-layout">
        {/* 사이드바 */}
        <aside className="profile-sidebar">
          <div className="profile-photo">
            {p.photo ? <img src={p.photo} alt={p.name} /> : <div className="photo-placeholder">📷</div>}
          </div>
          <h2>{p.name}</h2>
          <p className="role">{p.role}</p>
          <p className="short-intro">{p.short_intro}</p>
          <div className="keywords">
            {(p.keywords || []).map((k, i) => <span key={i} className="tag">{k}</span>)}
          </div>
          <div className="media-links">
            {p.media_youtube && <a href={p.media_youtube} target="_blank" rel="noopener noreferrer">▶ YouTube</a>}
            {p.media_blog && <a href={p.media_blog} target="_blank" rel="noopener noreferrer">📝 블로그</a>}
            {p.media_instagram && <a href={p.media_instagram} target="_blank" rel="noopener noreferrer">📸 인스타그램</a>}
          </div>
        </aside>

        {/* 메인 영역 */}
        <main className="profile-main">
          {p.long_intro && (
            <section>
              <h3>소개</h3>
              <p className="long-intro">{p.long_intro}</p>
            </section>
          )}

          {contentAreas.length > 0 && (
            <section>
              <h3>대표 콘텐츠</h3>
              <div className="content-areas">
                {contentAreas.map((c, i) => (
                  <div key={i} className="content-card">
                    <h4>{c?.title || '제목 없음'}</h4>
                    <p>{c?.description || ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {p.history && p.history.length > 0 && (
            <section>
              <h3>활동 이력</h3>
              <ul>{p.history.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </section>
          )}

          {p.published_books && p.published_books.length > 0 && (
            <section>
              <h3>출판 도서</h3>
              <ul>{p.published_books.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </section>
          )}

          {p.awards && p.awards.length > 0 && (
            <section>
              <h3>수상 경력</h3>
              <ul>{p.awards.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
