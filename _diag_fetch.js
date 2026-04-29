const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(Boolean).map((l)=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const url = env.VITE_SUPABASE_URL + '/rest/v1/home_page?select=*';
const ctrl = new AbortController();
setTimeout(()=>ctrl.abort(), 15000);
fetch(url, { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.VITE_SUPABASE_ANON_KEY }, signal: ctrl.signal })
.then(async r=>{ console.log('status', r.status); console.log(await r.text()); })
.catch(e=>{ console.log('fetch error', e.message); });
