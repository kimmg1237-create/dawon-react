import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(Boolean).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const s = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const checks = [];
const hb = await s.from('home_books').select('id,title,image_url').limit(20);
if (hb.data) hb.data.forEach(r => r.image_url && checks.push({src:'home_books', title:r.title, url:r.image_url}));
const eb = await s.from('ebooks').select('id,title,cover_url,pdf_url').limit(20);
if (eb.data) eb.data.forEach(r => { if(r.cover_url) checks.push({src:'ebooks_cover', title:r.title, url:r.cover_url}); if(r.pdf_url) checks.push({src:'ebooks_pdf', title:r.title, url:r.pdf_url}); });
const st = await s.from('store_products').select('id,title,image_url').limit(20);
if (st.data) st.data.forEach(r => r.image_url && checks.push({src:'store', title:r.title, url:r.image_url}));

console.log('URL count', checks.length);
for (const c of checks) {
  try {
    const ctrl = new AbortController();
    setTimeout(()=>ctrl.abort(), 15000);
    const res = await fetch(c.url, { method:'GET', signal: ctrl.signal });
    console.log(c.src, c.title, res.status, c.url.slice(0,120));
  } catch (e) {
    console.log(c.src, c.title, 'FETCH_ERR', e.message, c.url.slice(0,120));
  }
}
