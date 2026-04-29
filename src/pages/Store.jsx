import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const DEFAULT_PRODUCTS = [
  { id: 'default-1', title: '자신과의 소통', description: '자기 성찰과 힐링의 에세이', price: 15000, image_url: '', kyobo_url: '', yes24_url: '' },
  { id: 'default-2', title: '힐링게임', description: '마음을 치유하는 놀이', price: 13000, image_url: '', kyobo_url: '', yes24_url: '' },
];

export default function Store() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase.from('store_products').select('*').order('sort_order').then(({ data }) => {
      setProducts(data && data.length > 0 ? data : DEFAULT_PRODUCTS);
    });
  }, []);

  return (
    <div className="page-store">
      <h2>🛒 스토어</h2>
      <div className="store-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            {p.image_url ? <img src={p.image_url} alt={p.title} /> : <div className="product-placeholder">📕</div>}
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <p className="price">₩{(p.price || 0).toLocaleString()}</p>
            <div className="store-links">
              {p.kyobo_url && <a href={p.kyobo_url} target="_blank" rel="noopener noreferrer" className="btn-sm">교보문고</a>}
              {p.yes24_url && <a href={p.yes24_url} target="_blank" rel="noopener noreferrer" className="btn-sm">YES24</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
