import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const s = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const run = async (name, fn) => {
  try {
    const { error, data } = await fn();
    if (error) console.log(name, 'ERR', error.code || '', error.message);
    else console.log(name, 'OK', Array.isArray(data) ? data.length : (data ? 1 : 0));
  } catch (e) {
    console.log(name, 'EX', e.message);
  }
};

await run('home_page', () => s.from('home_page').select('*').limit(1));
await run('home_books', () => s.from('home_books').select('*').limit(1));
await run('profile_page', () => s.from('profile_page').select('*').limit(1));
await run('ebooks', () => s.from('ebooks').select('*').limit(1));
await run('board_nested', () => s.from('posts').select('*, post_replies(*)').limit(1));
await run('self_nested', () => s.from('self_communication_posts').select('*, self_communication_comments(*)').limit(1));
await run('private_board', () => s.from('private_board').select('*').limit(1));
await run('audiobooks', () => s.from('audiobooks').select('*').limit(1));
