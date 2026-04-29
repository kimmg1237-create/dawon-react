import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function useAudioBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    supabase.from('audiobooks').select('*').order('created_at').then(({ data }) => {
      if (data) setBooks(data);
      setLoading(false);
    });
  }, []);

  const selectBook = async (book) => {
    setSelectedBook(book);
    setTextLoading(true);
    try {
      if (book.paragraphs_cache) {
        setParagraphs(book.paragraphs_cache);
      } else if (book.text_cache) {
        const parts = book.text_cache.split('\n').filter(p => p.trim());
        setParagraphs(parts);
      } else {
        setParagraphs(['텍스트를 불러올 수 없습니다.']);
      }
    } catch {
      setParagraphs(['텍스트 로딩 실패']);
    }
    setTextLoading(false);
  };

  return { books, loading, selectedBook, selectBook, paragraphs, textLoading };
}
