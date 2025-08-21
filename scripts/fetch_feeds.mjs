import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const FEEDS_PATH = new URL('../data/feeds.json', import.meta.url);
const OUT_PATH   = new URL('../data/data.json',  import.meta.url);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
});

/* ---------- helpers ---------- */
function hash(str){ return createHash('sha256').update(str).digest('hex').slice(0,16); }

function toText(v){
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return toText(v[0]);
  if (typeof v === 'object'){
    // 常见字段：#text / text / cdata / _ / $t / value
    return (
      v['#text'] || v.text || v.cdata || v._ || v['$t'] || v.value ||
      // 某些源 title: { type:'html', _:'<b>xxx</b>' }
      (typeof v.type === 'string' && typeof v._ === 'string' ? v._ : '') ||
      // 再退一步，挑第一个可序列化的值
      toText(Object.values(v)[0])
    ) || '';
  }
  return String(v);
}

function toLink(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return toLink(v[0]);
  if (typeof v === 'object'){
    return v['@_href'] || v.href || v.url || v.link || v['#text'] || '';
  }
  return String(v);
}

function stripHtml(s=''){
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function toISO(d){
  const dt = new Date(d);
  return isNaN(+dt) ? null : dt.toISOString();
}
function toEpoch(d){
  const dt = new Date(d);
  return isNaN(+dt) ? 0 : Math.floor(dt.getTime()/1000);
}

/* ---------- normalize ---------- */
function normalizeItem(raw, source, category){
  cons
