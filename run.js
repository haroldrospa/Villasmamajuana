const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: villas, error } = await supabase.from('villas').select('name, image, gallery');
  if (error) console.error(error);
  else console.log(JSON.stringify(villas, null, 2));
}
main();
