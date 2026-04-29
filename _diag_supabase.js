const fs = require('fs');

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const s = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const tests = [
    'home_page',
    'home_banners',
    'home_books',
    'profile_page',
    'ebooks',
    'store_products',
    'posts',
    'private_board',
    'self_communication_posts'
  ];

  for (const t of tests) {
    const { error, data } = await s.from(t).select('*').limit(1);
    if (error) {
      console.log(t, 'ERR', error.code || '', error.message);
    } else {
      console.log(t, 'OK', (data || []).length);
    }
  }
})();
