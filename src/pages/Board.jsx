import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import PrivateBoard from '../components/PrivateBoard';

export default function Board() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('free');
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [tab, setTab] = useState('public');

  const PER_PAGE = 10;

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*, post_replies(*)').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  useEffect(() => { fetchPosts(); }, []);

  const filtered = posts.filter(p => {
    if (filter === 'notice' && p.type !== 'notice') return false;
    if (filter === 'free' && p.type !== 'free') return false;
    if (search && !p.title.includes(search) && !p.content.includes(search)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleWrite = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      type: isAdmin ? postType : 'free',
      title, content,
      author_uid: user.id,
      author_name: user.user_metadata?.full_name || user.email,
    });
    if (!error) { setShowWrite(false); setTitle(''); setContent(''); fetchPosts(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('posts').delete().eq('id', id);
    fetchPosts();
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    await supabase.from('post_replies').insert({
      post_id: postId, content: replyText,
      author_uid: user.id,
      author_name: user.user_metadata?.full_name || user.email,
    });
    setReplyText('');
    fetchPosts();
  };

  return (
    <div className="page-board">
      <div className="board-tabs">
        <button className={tab === 'public' ? 'active' : ''} onClick={() => setTab('public')}>게시판</button>
        {user && <button className={tab === 'private' ? 'active' : ''} onClick={() => setTab('private')}>1:1 문의</button>}
      </div>

      {tab === 'private' ? <PrivateBoard /> : (
        <>
          <h2>📋 게시판</h2>
          <div className="board-toolbar">
            <div className="board-filters">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(0); }}>전체</button>
              <button className={filter === 'notice' ? 'active' : ''} onClick={() => { setFilter('notice'); setPage(0); }}>공지</button>
              <button className={filter === 'free' ? 'active' : ''} onClick={() => { setFilter('free'); setPage(0); }}>자유</button>
            </div>
            <input placeholder="검색..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            {user && <button className="btn-primary" onClick={() => setShowWrite(true)}>✏️ 글쓰기</button>}
          </div>

          {showWrite && (
            <form className="write-form" onSubmit={handleWrite}>
              {isAdmin && (
                <select value={postType} onChange={e => setPostType(e.target.value)}>
                  <option value="free">자유</option>
                  <option value="notice">공지</option>
                </select>
              )}
              <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea placeholder="내용" rows={5} value={content} onChange={e => setContent(e.target.value)} required />
              <div>
                <button type="submit" className="btn-primary">등록</button>
                <button type="button" onClick={() => setShowWrite(false)}>취소</button>
              </div>
            </form>
          )}

          <div className="post-list">
            {paged.map(post => (
              <details key={post.id} open={expandedId === post.id}
                onToggle={e => setExpandedId(e.target.open ? post.id : null)}>
                <summary>
                  {post.type === 'notice' && <span className="badge-notice">공지</span>}
                  <span className="post-title">{post.title}</span>
                  <span className="post-meta">{post.author_name} · {new Date(post.created_at).toLocaleDateString()}</span>
                </summary>
                <div className="post-body">
                  <p>{post.content}</p>
                  {(user?.id === post.author_uid || isAdmin) && (
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(post.id)}>삭제</button>
                  )}
                  {/* 답글 */}
                  {post.post_replies?.map(r => (
                    <div key={r.id} className="reply">
                      <strong>{r.author_name}</strong>: {r.content}
                      <span className="reply-date">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {isAdmin && (
                    <div className="reply-form">
                      <input placeholder="답글 작성..." value={expandedId === post.id ? replyText : ''}
                        onChange={e => setReplyText(e.target.value)} />
                      <button onClick={() => handleReply(post.id)}>답글</button>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>◀</button>
              <span>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>▶</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
