import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: villas, error } = await supabase.from('villas').select('name, image, gallery');
  if (error) {
    console.error(error);
    return;
  }
  
  if (villas) {
    for (const v of villas) {
      console.log(`Villa: ${v.name}`);
      console.log(`Main Image: ${v.image}`);
      if (v.gallery) {
        console.log(`Gallery (first 3):`, v.gallery.slice(0, 3));
      }
    }
  }
}

main();
