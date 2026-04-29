import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export default function SelfCommunication() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState('');

  const PER_PAGE = 10;

  const fetchPosts = async () => {
    const { data } = await supabase.from('self_communication_posts')
      .select('*, self_communication_comments(*)')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  useEffect(() => { fetchPosts(); }, []);

  const filtered = posts.filter(p =>
    !search || p.title.includes(search) || p.content.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleWrite = async (e) => {
    e.preventDefault();
    await supabase.from('self_communication_posts').insert({
      title, content,
      author_uid: user.id,
      author_name: user.user_metadata?.full_name || user.email,
    });
    setShowWrite(false); setTitle(''); setContent('');
    fetchPosts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('self_communication_posts').delete().eq('id', id);
    fetchPosts();
  };

  const handleComment = async (postId) => {
    if (!commentText.trim() || !user) return;
    await supabase.from('self_communication_comments').insert({
      post_id: postId, content: commentText,
      author_uid: user.id,
      author_name: user.user_metadata?.full_name || user.email,
      is_admin: isAdmin,
    });
    setCommentText('');
    fetchPosts();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    await supabase.from('self_communication_comments').delete().eq('id', commentId);
    fetchPosts();
  };

  return (
    <div className="page-self-comm">
      <h2>💬 자신과의 소통</h2>
      <div className="board-toolbar">
        <input placeholder="검색..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        {isAdmin && <button className="btn-primary" onClick={() => setShowWrite(true)}>✍ 글쓰기</button>}
      </div>

      {showWrite && (
        <form className="write-form" onSubmit={handleWrite}>
          <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea placeholder="내용" rows={8} value={content} onChange={e => setContent(e.target.value)} required />
          <div>
            <button type="submit" className="btn-primary">등록</button>
            <button type="button" onClick={() => setShowWrite(false)}>취소</button>
          </div>
        </form>
      )}

      <div className="post-list">
        {paged.map(post => (
          <div key={post.id} className="essay-card">
            <div className="essay-header" onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}>
              <h3>{post.title}</h3>
              <span className="post-meta">{post.author_name} · {new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            {expandedId === post.id && (
              <div className="essay-body">
                <p>{post.content}</p>
                {isAdmin && <button className="btn-sm btn-danger" onClick={() => handleDelete(post.id)}>삭제</button>}

                {/* 댓글 */}
                <div className="comments">
                  {(post.self_communication_comments || [])
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(c => (
                    <div key={c.id} className={`comment ${c.is_admin ? 'admin-comment' : ''}`}>
                      <strong>{c.author_name}</strong>{c.is_admin && <span className="admin-badge">관리자</span>}
                      <p>{c.content}</p>
                      <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
                      {(user?.id === c.author_uid || isAdmin) && (
                        <button className="btn-xs" onClick={() => handleDeleteComment(c.id)}>삭제</button>
                      )}
                    </div>
                  ))}
                </div>

                {user && (
                  <div className="comment-form">
                    <input placeholder="댓글 작성..." value={expandedId === post.id ? commentText : ''}
                      onChange={e => setCommentText(e.target.value)} />
                    <button onClick={() => handleComment(post.id)}>댓글</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>◀</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>▶</button>
        </div>
      )}
    </div>
  );
}
