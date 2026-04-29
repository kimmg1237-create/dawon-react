import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export default function PrivateBoard() {
  const { user, isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [showWrite, setShowWrite] = useState(false);
  const [category, setCategory] = useState('일반');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState('');

  const fetchInquiries = async () => {
    const { data } = await supabase.from('private_board').select('*').order('created_at', { ascending: false });
    if (data) setInquiries(data);
  };

  useEffect(() => { if (user) fetchInquiries(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('private_board').insert({
      category, title, content,
      author_uid: user.id,
      author_name: user.user_metadata?.full_name || user.email,
    });
    setShowWrite(false); setTitle(''); setContent('');
    fetchInquiries();
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    await supabase.from('private_board').update({ admin_reply: replyText, status: 'answered' }).eq('id', id);
    setReplyText('');
    fetchInquiries();
  };

  return (
    <div className="private-board">
      <h2>🔒 1:1 문의</h2>
      <button className="btn-primary" onClick={() => setShowWrite(true)}>✏️ 문의 작성</button>

      {showWrite && (
        <div className="modal-overlay" onClick={() => setShowWrite(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>문의 작성</h3>
            <form onSubmit={handleSubmit}>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>일반</option>
                <option>도서</option>
                <option>주문</option>
              </select>
              <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea placeholder="내용" rows={5} value={content} onChange={e => setContent(e.target.value)} required />
              <button type="submit" className="btn-primary">등록</button>
            </form>
          </div>
        </div>
      )}

      <div className="inquiry-list">
        {inquiries.map(inq => (
          <div key={inq.id} className="inquiry-card">
            <div className="inquiry-header">
              <span className={`status-badge ${inq.status}`}>{inq.status === 'answered' ? '답변완료' : '대기중'}</span>
              <span className="inquiry-category">[{inq.category}]</span>
              <strong>{inq.title}</strong>
              <span className="post-meta">{new Date(inq.created_at).toLocaleDateString()}</span>
            </div>
            <p>{inq.content}</p>
            {inq.admin_reply && (
              <div className="admin-reply">
                <strong>관리자 답변:</strong>
                <p>{inq.admin_reply}</p>
              </div>
            )}
            {isAdmin && inq.status !== 'answered' && (
              <div className="reply-form">
                <input placeholder="답변 작성..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                <button onClick={() => handleReply(inq.id)}>답변</button>
              </div>
            )}
          </div>
        ))}
        {inquiries.length === 0 && <p className="empty">문의 내역이 없습니다.</p>}
      </div>
    </div>
  );
}
