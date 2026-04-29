import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkBucket() {
  try {
    console.log('Checking public-assets bucket...');

    // List files in ebook-pdfs folder
    const { data: pdfFiles, error: pdfError } = await supabase.storage
      .from('public-assets')
      .list('ebook-pdfs');

    if (pdfError) {
      console.log('Error listing PDF files:', pdfError.message);
    } else {
      console.log('PDF files found:', pdfFiles?.length || 0);
      if (pdfFiles?.length > 0) {
        pdfFiles.forEach(file => console.log(' -', file.name));
      }
    }

    // List files in ebook-covers folder
    const { data: coverFiles, error: coverError } = await supabase.storage
      .from('public-assets')
      .list('ebook-covers');

    if (coverError) {
      console.log('Error listing cover files:', coverError.message);
    } else {
      console.log('Cover files found:', coverFiles?.length || 0);
      if (coverFiles?.length > 0) {
        coverFiles.forEach(file => console.log(' -', file.name));
      }
    }

  } catch (error) {
    console.log('Script error:', error.message);
  }
}

checkBucket();