import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { extractTextFromHwpFile } from '../utils/hwpText';
import { buildStoragePath, resolveMimeType } from '../utils/mimeType';

const TABS = ['홈 관리', '프로필 관리', '스토어 관리', '전자책 관리', '오디오북 관리', '도구'];

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="page-admin">
      <h2>⚙️ 관리자</h2>
      <div className="admin-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={tab === i ? 'active' : ''} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div className="admin-panel">
        {tab === 0 && <HomeAdmin />}
        {tab === 1 && <ProfileAdmin />}
        {tab === 2 && <StoreAdmin />}
        {tab === 3 && <EbooksAdmin />}
        {tab === 4 && <AudioBooksAdmin />}
        {tab === 5 && <ToolsAdmin user={user} />}
      </div>
    </div>
  );
}

/* ─── 홈 관리 ─── */
function HomeAdmin() {
  const [heroTitle, setHeroTitle] = useState('');
  const [heroIntro, setHeroIntro] = useState('');
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('home_page').select('*').single().then(({ data }) => {
      if (data) { setHeroTitle(data.hero_title); setHeroIntro(data.hero_intro); }
    });
    supabase.from('home_books').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  const saveHero = async () => {
    await supabase.from('home_page').update({ hero_title: heroTitle, hero_intro: heroIntro }).eq('id', 1);
    setMsg('히어로 저장 완료');
  };

  const addBook = async () => {
    const { data } = await supabase.from('home_books').insert({ title: '새 도서', sort_order: books.length }).select();
    if (data) setBooks([...books, ...data]);
  };

  const updateBook = async (id, field, value) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBook = async (book) => {
    await supabase.from('home_books').update({ title: book.title, description: book.description, image_url: book.image_url }).eq('id', book.id);
    setMsg('도서 저장 완료');
  };

  const deleteBook = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('home_books').delete().eq('id', id);
    setBooks(books.filter(b => b.id !== id));
  };

  const uploadImage = async (file, bookId) => {
    const path = buildStoragePath('home', file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) { setMsg('업로드 실패'); return; }
    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    updateBook(bookId, 'image_url', data.publicUrl);
  };

  return (
    <div>
      <h3>히어로 섹션</h3>
      <input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="타이틀" />
      <textarea value={heroIntro} onChange={e => setHeroIntro(e.target.value)} placeholder="소개 문구" rows={3} />
      <button className="btn-primary" onClick={saveHero}>저장</button>

      <h3>추천 도서</h3>
      {books.map(b => (
        <div key={b.id} className="admin-item">
          <input value={b.title} onChange={e => updateBook(b.id, 'title', e.target.value)} placeholder="제목" />
          <input value={b.description || ''} onChange={e => updateBook(b.id, 'description', e.target.value)} placeholder="설명" />
          <input value={b.image_url || ''} onChange={e => updateBook(b.id, 'image_url', e.target.value)} placeholder="이미지 URL" />
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], b.id)} />
          <button onClick={() => saveBook(b)}>저장</button>
          <button className="btn-danger" onClick={() => deleteBook(b.id)}>삭제</button>
        </div>
      ))}
      <button onClick={addBook}>+ 도서 추가</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

/* ─── 프로필 관리 ─── */
function ProfileAdmin() {
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('profile_page').select('*').single().then(({ data }) => {
      if (data) setP(data);
    });
  }, []);

  const update = (field, value) => setP({ ...p, [field]: value });

  const parseLines = (text) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const formatContentAreas = (areas) =>
    (Array.isArray(areas) ? areas : [])
      .map((item) => `${item?.title || ''}|${item?.description || ''}`)
      .join('\n');

  const parseContentAreas = (text) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const sep = line.indexOf('|');
        if (sep === -1) {
          return { title: line, description: '' };
        }
        return {
          title: line.slice(0, sep).trim(),
          description: line.slice(sep + 1).trim(),
        };
      })
      .filter((item) => item.title);

  const save = async () => {
    const { id, ...rest } = p;
    const payload = {
      ...rest,
      keywords: Array.isArray(rest.keywords) ? rest.keywords : [],
      history: Array.isArray(rest.history) ? rest.history : [],
      published_books: Array.isArray(rest.published_books) ? rest.published_books : [],
      awards: Array.isArray(rest.awards) ? rest.awards : [],
      content_areas: Array.isArray(rest.content_areas) ? rest.content_areas : [],
    };

    const { error } = await supabase.from('profile_page').update(payload).eq('id', 1);
    if (error) {
      setMsg('프로필 저장 실패: ' + error.message);
      return;
    }
    setMsg('프로필 저장 완료');
  };

  const uploadPhoto = async (file) => {
    const path = buildStoragePath('profile', file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) {
      setMsg('프로필 사진 업로드 실패: ' + error.message);
      return;
    }
    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    update('photo', data.publicUrl);
    setMsg('프로필 사진 업로드 완료 (전체 저장을 누르세요)');
  };

  if (!p) return <div>로딩 중...</div>;

  return (
    <div>
      <h3>기본 정보</h3>
      <input value={p.name} onChange={e => update('name', e.target.value)} placeholder="이름" />
      <input value={p.role} onChange={e => update('role', e.target.value)} placeholder="역할" />
      <textarea value={p.short_intro} onChange={e => update('short_intro', e.target.value)} placeholder="짧은 소개" rows={2} />
      <textarea value={p.long_intro} onChange={e => update('long_intro', e.target.value)} placeholder="긴 소개" rows={5} />

      <h3>프로필 사진</h3>
      {p.photo && <img src={p.photo} alt="프로필" style={{ width: 100, height: 100, borderRadius: '50%' }} />}
      <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />

      <h3>키워드 (쉼표 구분)</h3>
      <input value={(p.keywords || []).join(', ')} onChange={e => update('keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />

      <h3>대표 콘텐츠 (한 줄에 1개, 형식: 제목|설명)</h3>
      <textarea
        rows={4}
        value={formatContentAreas(p.content_areas)}
        onChange={e => update('content_areas', parseContentAreas(e.target.value))}
        placeholder="자신과의 소통|일상 속 마음 회복 에세이\n힐링게임|멈춰도 괜찮은 자기돌봄 루틴"
      />

      <h3>미디어 링크</h3>
      <input value={p.media_youtube} onChange={e => update('media_youtube', e.target.value)} placeholder="YouTube URL" />
      <input value={p.media_blog} onChange={e => update('media_blog', e.target.value)} placeholder="블로그 URL" />
      <input value={p.media_instagram} onChange={e => update('media_instagram', e.target.value)} placeholder="인스타그램 URL" />

      <h3>이력 (줄바꿈 구분)</h3>
      <textarea value={(p.history || []).join('\n')} onChange={e => update('history', parseLines(e.target.value))} rows={4} />

      <h3>출판 도서 (줄바꿈 구분)</h3>
      <textarea value={(p.published_books || []).join('\n')} onChange={e => update('published_books', parseLines(e.target.value))} rows={4} />

      <h3>수상 경력 (줄바꿈 구분)</h3>
      <textarea value={(p.awards || []).join('\n')} onChange={e => update('awards', parseLines(e.target.value))} rows={4} />

      <button className="btn-primary" onClick={save}>전체 저장</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

/* ─── 스토어 관리 ─── */
function StoreAdmin() {
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('store_products').select('*').order('sort_order').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const addProduct = async () => {
    const { data } = await supabase.from('store_products').insert({ title: '새 상품', sort_order: products.length }).select();
    if (data) setProducts([...products, ...data]);
  };

  const updateProduct = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProduct = async (prod) => {
    const { id, ...rest } = prod;
    await supabase.from('store_products').update(rest).eq('id', id);
    setMsg('상품 저장 완료');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('store_products').delete().eq('id', id);
    setProducts(products.filter(p => p.id !== id));
  };

  const uploadImage = async (file, prodId) => {
    const path = buildStoragePath('store', file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) return;
    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    updateProduct(prodId, 'image_url', data.publicUrl);
  };

  return (
    <div>
      <h3>상품 관리</h3>
      {products.map(p => (
        <div key={p.id} className="admin-item">
          <input value={p.title} onChange={e => updateProduct(p.id, 'title', e.target.value)} placeholder="제목" />
          <input value={p.description || ''} onChange={e => updateProduct(p.id, 'description', e.target.value)} placeholder="설명" />
          <input type="number" value={p.price || 0} onChange={e => updateProduct(p.id, 'price', +e.target.value)} placeholder="가격" />
          <input value={p.image_url || ''} onChange={e => updateProduct(p.id, 'image_url', e.target.value)} placeholder="이미지 URL" />
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], p.id)} />
          <input value={p.kyobo_url || ''} onChange={e => updateProduct(p.id, 'kyobo_url', e.target.value)} placeholder="교보문고 URL" />
          <input value={p.yes24_url || ''} onChange={e => updateProduct(p.id, 'yes24_url', e.target.value)} placeholder="YES24 URL" />
          <button onClick={() => saveProduct(p)}>저장</button>
          <button className="btn-danger" onClick={() => deleteProduct(p.id)}>삭제</button>
        </div>
      ))}
      <button onClick={addProduct}>+ 상품 추가</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

/* ─── 전자책 관리 ─── */
function EbooksAdmin() {
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('ebooks').select('*').order('sort_order').then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  const addBook = async () => {
    const { data } = await supabase.from('ebooks').insert({ title: '새 전자책', sort_order: books.length }).select();
    if (data) setBooks([...books, ...data]);
  };

  const updateBook = (id, field, value) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBook = async (book) => {
    const { id, ...rest } = book;
    await supabase.from('ebooks').update(rest).eq('id', id);
    setMsg('전자책 저장 완료');
  };

  const deleteBook = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('ebooks').delete().eq('id', id);
    setBooks(books.filter(b => b.id !== id));
  };

  const uploadFile = async (file, bookId, field) => {
    const folder = field === 'pdf_url' ? 'ebook-pdfs' : 'ebook-covers';
    const path = buildStoragePath(folder, file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) { setMsg('업로드 실패'); return; }
    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    updateBook(bookId, field, data.publicUrl);
  };

  return (
    <div>
      <h3>전자책 관리</h3>
      {books.map(b => (
        <div key={b.id} className="admin-item">
          <input value={b.title} onChange={e => updateBook(b.id, 'title', e.target.value)} placeholder="제목" />
          <input value={b.cover_url || ''} onChange={e => updateBook(b.id, 'cover_url', e.target.value)} placeholder="커버 URL" />
          <label>커버 업로드: <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadFile(e.target.files[0], b.id, 'cover_url')} /></label>
          <input value={b.pdf_url || ''} onChange={e => updateBook(b.id, 'pdf_url', e.target.value)} placeholder="PDF URL" />
          <label>PDF 업로드: <input type="file" accept=".pdf" onChange={e => e.target.files[0] && uploadFile(e.target.files[0], b.id, 'pdf_url')} /></label>
          <button onClick={() => saveBook(b)}>저장</button>
          <button className="btn-danger" onClick={() => deleteBook(b.id)}>삭제</button>
        </div>
      ))}
      <button onClick={addBook}>+ 전자책 추가</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

/* ─── 오디오북 관리 ─── */
function AudioBooksAdmin() {
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('audiobooks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  const addBook = async () => {
    const { data, error } = await supabase
      .from('audiobooks')
      .insert({ title: '새 오디오북', text_cache: '', paragraphs_cache: [] })
      .select();

    if (error) {
      setMsg('오디오북 추가 실패: ' + error.message);
      return;
    }
    if (data) setBooks([...data, ...books]);
    setMsg('오디오북 추가 완료');
  };

  const updateBook = (id, field, value) => {
    setBooks(books.map(b => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const saveBook = async (book) => {
    const paragraphs = (book.text_cache || '')
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      title: book.title,
      hwp_filename: book.hwp_filename || '',
      cover_url: book.cover_url || '',
      text_cache: book.text_cache || '',
      paragraphs_cache: paragraphs,
    };

    const { error } = await supabase.from('audiobooks').update(payload).eq('id', book.id);
    if (error) {
      setMsg('오디오북 저장 실패: ' + error.message);
      return;
    }
    setMsg('오디오북 저장 완료');
  };

  const deleteBook = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('audiobooks').delete().eq('id', id);
    if (error) {
      setMsg('오디오북 삭제 실패: ' + error.message);
      return;
    }
    setBooks(books.filter(b => b.id !== id));
    setMsg('오디오북 삭제 완료');
  };

  const uploadCover = async (file, bookId) => {
    const path = buildStoragePath('audiobook-covers', file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) {
      setMsg('커버 업로드 실패: ' + error.message);
      return;
    }
    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    updateBook(bookId, 'cover_url', data.publicUrl);
    setMsg('커버 업로드 완료 (저장 버튼을 눌러 반영)');
  };

  const uploadHangulFile = async (file, bookId) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'hwp' && ext !== 'txt') {
      setMsg('한글 파일은 .hwp 또는 .txt 형식만 업로드 가능합니다.');
      return;
    }

    const path = buildStoragePath('audiobook-hwp', file);
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: resolveMimeType(file) });
    if (error) {
      setMsg('한글 파일 업로드 실패: ' + error.message);
      return;
    }

    updateBook(bookId, 'hwp_filename', file.name);

    // txt 파일은 본문 자동 반영
    if (ext === 'txt') {
      try {
        const text = await file.text();
        updateBook(bookId, 'text_cache', text);
        setMsg('TXT 업로드 완료: 본문 자동 반영됨 (저장 버튼을 눌러 DB 반영)');
        return;
      } catch {
        setMsg('TXT 업로드는 되었지만 본문 읽기에 실패했습니다.');
        return;
      }
    }

    try {
      const parsed = await extractTextFromHwpFile(file);
      if (parsed.trim()) {
        updateBook(bookId, 'text_cache', parsed);
        setMsg('HWP 업로드 완료: 본문 자동 추출됨 (저장 버튼을 눌러 DB 반영)');
      } else {
        setMsg('HWP 업로드 완료: 본문 추출 결과가 비어 있습니다. 직접 입력 후 저장해주세요.');
      }
    } catch (e) {
      setMsg('HWP 업로드 완료: 자동 추출 실패 (' + (e?.message || '파싱 오류') + ')');
    }
  };

  return (
    <div>
      <h3>오디오북 관리</h3>
      {books.map(b => (
        <div key={b.id} className="admin-item">
          <input value={b.title || ''} onChange={e => updateBook(b.id, 'title', e.target.value)} placeholder="제목" />
          <input value={b.hwp_filename || ''} onChange={e => updateBook(b.id, 'hwp_filename', e.target.value)} placeholder="HWP 파일명 (선택)" />
          <label>한글 파일 업로드(.hwp/.txt): <input type="file" accept=".hwp,.txt,text/plain" onChange={e => e.target.files[0] && uploadHangulFile(e.target.files[0], b.id)} /></label>
          <input value={b.cover_url || ''} onChange={e => updateBook(b.id, 'cover_url', e.target.value)} placeholder="커버 URL" />
          <label>커버 업로드: <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadCover(e.target.files[0], b.id)} /></label>
          <textarea
            rows={8}
            value={b.text_cache || ''}
            onChange={e => updateBook(b.id, 'text_cache', e.target.value)}
            placeholder="오디오북 텍스트 (줄바꿈으로 문단 구분)"
          />
          <button onClick={() => saveBook(b)}>저장</button>
          <button className="btn-danger" onClick={() => deleteBook(b.id)}>삭제</button>
        </div>
      ))}
      <button onClick={addBook}>+ 오디오북 추가</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

/* ─── 도구 ─── */
function ToolsAdmin({ user }) {
  const [msg, setMsg] = useState('');

  const batchRename = async () => {
    if (!window.confirm('모든 관리자 게시글의 작성자명을 "다원작가"로 변경합니다.')) return;
    const tables = ['posts', 'post_replies', 'self_communication_posts', 'self_communication_comments'];
    for (const t of tables) {
      await supabase.from(t).update({ author_name: '다원작가' }).eq('author_uid', user.id);
    }
    setMsg('닉네임 일괄 변경 완료');
  };

  return (
    <div>
      <h3>유틸리티 도구</h3>
      <button className="btn-primary" onClick={batchRename}>닉네임 일괄 변경 → "다원작가"</button>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}
