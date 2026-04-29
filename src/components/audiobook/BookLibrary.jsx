export default function BookLibrary({ books, selectedBook, onSelect }) {
  return (
    <div className="book-library">
      <h3>도서 목록</h3>
      {books.length === 0 && <p className="empty">등록된 오디오북이 없습니다.</p>}
      <div className="library-grid">
        {books.map(book => (
          <div key={book.id}
            className={`library-item ${selectedBook?.id === book.id ? 'active' : ''}`}
            onClick={() => onSelect(book)}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(book); } }}>
            {book.cover_url ? <img src={book.cover_url} alt={book.title} /> : <div className="cover-placeholder">📖</div>}
            <span className="lib-title">{book.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
