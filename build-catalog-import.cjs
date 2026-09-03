const xlsx = require('C:\\Users\\Валерия\\Desktop\\pg3d-xlsx-temp\\node_modules\\xlsx');
const fs = require('fs');
const path = require('path');

const XLSX_PATH = path.join(__dirname, 'public', 'PG3D_Items_by_Category_Name_Tag_Id.xlsx');
const ICONS_DIR = path.join(__dirname, 'public', 'icons-items');
const OUT_PATH = path.join(__dirname, 'public', 'catalog-import.json');

const wb = xlsx.readFile(XLSX_PATH);
const sheetNames = wb.SheetNames.filter(n => n !== 'ModulePoint');
console.log('Sheets to import:', sheetNames.join(', '));

// Build icon lookup: key (lowercase, suffix stripped) -> actual filename
const files = fs.readdirSync(ICONS_DIR);
const suffixRe = /_icon1?_big\.(png|webp|jpg|jpeg|gif)$/i;
const byKey = new Map();
for (const fn of files) {
  const m = fn.match(suffixRe);
  if (m) {
    const key = fn.slice(0, m.index).toLowerCase();
    if (!byKey.has(key)) byKey.set(key, fn);
  }
}
console.log('Icon files:', files.length, 'with matchable suffix:', byKey.size);

const items = [];
const seenTags = new Set();
let dupCount = 0;
const stats = {};

for (const sheetName of sheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  let matched = 0, total = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;
    let [name, tag, id] = row;
    name = String(name ?? '').trim();
    tag = String(tag ?? '').trim();
    id = String(id ?? '').trim();
    if (!tag) continue;
    if (seenTags.has(tag)) { dupCount++; continue; }
    seenTags.add(tag);
    total++;

    let icon = '';
    const keyTag = tag.toLowerCase();
    const keyName = name.replace(/\s+/g, '').toLowerCase();
    if (byKey.has(keyTag)) { icon = byKey.get(keyTag); matched++; }
    else if (byKey.has(keyName)) { icon = byKey.get(keyName); matched++; }

    items.push([id, tag, name, sheetName, icon]);
  }
  stats[sheetName] = `${matched}/${total}`;
}

console.log('Total items:', items.length, 'duplicate tags skipped:', dupCount);
console.log('Per-category match stats:', JSON.stringify(stats, null, 2));

fs.writeFileSync(OUT_PATH, JSON.stringify(items), 'utf-8');
console.log('Wrote', OUT_PATH, '(' + fs.statSync(OUT_PATH).size + ' bytes)');
