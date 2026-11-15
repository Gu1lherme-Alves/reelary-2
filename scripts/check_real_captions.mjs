import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > -1) {
    let k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
}

const accounts = ['bruna.medeiros28446', 'lavinia.silva81383', 'yasmin.meire72446', 'manuella.souza184824742', 'mariaa.carla1838436'];

async function main() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);
  
  const { data: igAccounts } = await supabase
    .from('instagram_accounts')
    .select('id, username, access_token')
    .in('username', accounts);
    
  if (!igAccounts || igAccounts.length === 0) {
    console.log('No accounts found');
    return;
  }

  const accIds = igAccounts.map(a => a.id);
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('id, instagram_account_id, caption, status, scheduled_at, published_at, error_message, instagram_post_id')
    .in('instagram_account_id', accIds)
    .gte('published_at', '2026-11-08T00:00:00Z')
    .order('published_at', { ascending: true });

  console.log('Total published posts today:', posts ? posts.length : 0);
  const byAcc = {};
  for (const p of (posts || [])) {
    const acc = igAccounts.find(a => a.id === p.instagram_account_id)?.username;
    if (!byAcc[acc]) byAcc[acc] = [];
    byAcc[acc].push(p);
  }

  for (const [acc, accPosts] of Object.entries(byAcc)) {
    console.log('\n=== Account: ' + acc + ' Count: ' + accPosts.length);
    const token = igAccounts.find(a => a.username === acc)?.access_token;
    for (let i = 0; i < accPosts.length; i++) {
      const p = accPosts[i];
      const prev = accPosts[i-1];
      let diff = 'FIRST';
      if (prev) {
        const diffSec = Math.round((new Date(p.published_at) - new Date(prev.published_at)) / 1000);
        diff = diffSec + 's';
      }
      
      // Let's check Instagram Graph API if this post has caption on Instagram
      let liveCaption = 'UNKNOWN';
      if (p.instagram_post_id && token) {
        try {
          const res = await fetch(`https://graph.facebook.com/v21.0/${p.instagram_post_id}?fields=id,caption,media_type,timestamp,permalink&access_token=${token}`);
          const json = await res.json();
          liveCaption = json.caption ? `YES (${json.caption.slice(0, 20)}...)` : 'NO CAPTION';
        } catch (e) {
          liveCaption = 'ERR: ' + e.message;
        }
      }
      console.log(`[${p.published_at}] diff: ${diff.padEnd(6)} | post_id: ${p.instagram_post_id} | IG has caption: ${liveCaption}`);
    }
  }
}
main();

