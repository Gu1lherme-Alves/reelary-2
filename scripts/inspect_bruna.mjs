// Fetch media from Instagram Graph API for bruna.medeiros28446
const token = 'IGAAkH1HGI0J5BZAFlvakN5OThWR0hFMXllOEtEV3ZAaVF90UkUtc0NRci1EV3BCZAm50cUhWZAWtuSGVERnhjTDZAiTlIwTXk5RlhKRVg5Q2ktb3F0eUpZAeVI5a01NQTJSVTl1QmZAPOUVRaFJDdDVFSGdQVjN5azFCZAEs2d19mMEVXWQZDZD';

async function check() {
  const url = `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,timestamp,permalink&limit=25&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    console.error('Error:', data.error);
    return;
  }
  console.log(`Fetched ${data.data.length} media items:`);
  for (let i = 0; i < data.data.length; i++) {
    const item = data.data[i];
    const prev = data.data[i + 1]; // chronological earlier
    let diff = 'N/A';
    if (prev) {
      const sec = Math.round((new Date(item.timestamp) - new Date(prev.timestamp)) / 1000);
      diff = sec + 's';
    }
    const hasCaption = !!item.caption;
    console.log(`[${item.timestamp}] diff_from_prev: ${diff.padEnd(8)} | has_caption: ${hasCaption ? 'SIM (' + item.caption.slice(0, 15) + ')' : 'NAO (SEM LEGENDA)'} | permalink: ${item.permalink}`);
  }
}
check();

