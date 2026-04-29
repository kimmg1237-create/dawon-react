import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEbooks() {
  try {
    console.log('Checking ebooks in database...');

    const { data: ebooks, error } = await supabase
      .from('ebooks')
      .select('*')
      .order('sort_order');

    if (error) {
      console.log('Database error:', error.message);
      return;
    }

    console.log('Found ebooks:', ebooks?.length || 0);
    ebooks?.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title}`);
      console.log(`   Cover: ${book.cover_url || 'No cover'}`);
      console.log(`   PDF: ${book.pdf_url || 'No PDF'}`);
      console.log('');
    });

  } catch (error) {
    console.log('Script error:', error.message);
  }
}

checkEbooks();