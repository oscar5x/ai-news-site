import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const FEEDS_PATH = new URL('../data/feeds.json', import.meta.url);
const OUT_PATH = new URL('../data/data.json', import.meta.url);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
});

function hash(str){ return createHash('sha256').update(str).digest('hex').slice(0,16); }
function toISO(d){ const dt = new Date(d); return isNaN(+dt) ? null : dt.toISOString(); }
function toEpoch(d){ const dt = new Date(d); return isNaN(+dt) ? 0 : Math.floor(dt.getTime()/1000); }

function normalizeItem(raw, source, category){
  const title = raw.title || raw["title#text"] || raw["title"]?.["#text"] || "";
  const link = raw.link?.["@_href"] || raw.link?.[0]?.["@_href"] || raw.link?.[0] || raw.link || raw.guid || "";
  const summary = raw.description || raw.summary || raw["content:encoded"] || "";
  const date = raw.pubDate || raw.updated || raw.published || raw["dc:date"] || Date.now();
  const iso = toISO(date) || toISO(Date.now());
  const ts = toEpoch(iso);
  return {
    id: hash(String(title)+String(link)),
    title: String(title).trim(),
    link: typeof link === 'object' ? (link['#text'] || "") : String(link),
    source, category,
    published_at: iso,
    published_ts: ts,
    summary: String(summary).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0, 500)
  };
}

async function main(){
  const feeds = JSON.parse(await fs.readFile(FEEDS_PATH, 'utf8'));
  const all = [];
  for (const f of feeds){
    try{
      const res = await fetch(f.url, { headers: { "user-agent": "news-bot/1.0 (+github-actions)" } });
      const text = await res.text();
      const xml = parser.parse(text);
      const items = xml?.rss?.channel?.item || xml?.feed?.entry || [];
      for (const it of items){
        const norm = normalizeItem(it, f.source, f.category);
        if (norm.title && norm.link) all.push(norm);
      }
    }catch(e){ console.error("Failed:", f.url, e?.message); }
  }
  const map = new Map();
  for (const it of all){ const key = it.link || it.id; if (!map.has(key)) map.set(key, it); }
  const items = [...map.values()].sort((a,b)=> b.published_ts - a.published_ts);
  const out = { generated_at: new Date().toISOString(), items };
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${items.length} items to data/data.json`);
}
main().catch(err => { console.error(err); process.exit(1); });
