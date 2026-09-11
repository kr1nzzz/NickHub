'use strict';
const $ = id => document.getElementById(id);
let favorites = [];
// Old demo favorites are deliberately excluded from verified results.
let results = [], view = 'browse', timer, revision = 0;
const chars = { all: 'abcdefghijklmnopqrstuvwxyz0123456789', letters: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789' };
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(timer); timer = setTimeout(() => $('toast').hidden = true, 2300); }
function save() { try { localStorage.setItem('nickhub-verified-favorites', JSON.stringify(favorites)); } catch { toast('Не удалось сохранить избранное в браузере'); } }
function generate(options) {
  const { length, contains, prefix, suffix, alphabet } = options;
  const found = new Set(); const pool = chars[alphabet];
  const positions = contains ? Array.from({ length: length - contains.length + 1 }, (_, i) => i) : [0];
  for (const position of positions) {
    const slots = Array(length).fill(null); let valid = true;
    for (const [text, start] of [[prefix, 0], [suffix, length - suffix.length], [contains, position]]) {
      for (let i = 0; i < text.length; i++) { const at = start + i; if (slots[at] !== null && slots[at] !== text[i]) valid = false; slots[at] = text[i]; }
    }
    if (!valid) continue;
    const holes = slots.map((x, i) => x === null ? i : -1).filter(i => i >= 0);
    const combinations = Math.min(180, Math.pow(pool.length, holes.length));
    for (let n = 0; n < combinations; n++) { const candidate = [...slots]; let value = n; for (const hole of holes) { candidate[hole] = pool[value % pool.length]; value = Math.floor(value / pool.length); } found.add(candidate.join('')); }
  }
  return [...found].slice(0, 120);
}
function render() {
  $('saved-count').textContent = favorites.length;
  const list = [...(view === 'saved' ? favorites : results)].sort((a, b) => ($('sort').value === 'status' ? a.status.localeCompare(b.status) : 0) || a.name.localeCompare(b.name, 'en'));
  $('count').textContent = list.length;
  $('cards').replaceChildren(); $('empty').hidden = list.length > 0;
  $('empty-text').textContent = view === 'saved' ? 'Нажми на звёздочку у понравившегося ника.' : 'Измени условия и нажми «Найти никнеймы».';
  $('limit-note').textContent = list.length === 120 && view === 'browse' ? 'Первые 120 результатов' : 'ТОЛЬКО ПОДТВЕРЖДЁННЫЕ';
  for (const item of list) {
    const card = document.createElement('article'); card.className = 'card';
    const top = document.createElement('div'); top.className = 'card-top';
    const badge = document.createElement('span'); badge.className = 'status' + (item.status === 'idle' ? ' idle' : '');
    const dot = document.createElement('i'); dot.className = 'dot ' + (item.status === 'free' ? 'green' : 'orange'); badge.append(dot, document.createTextNode(item.status === 'free' ? 'Свободен' : 'Idle Claim'));
    const star = document.createElement('button'); const selected = favorites.some(x => x.name === item.name); star.className = 'star' + (selected ? ' selected' : ''); star.textContent = selected ? '★' : '☆'; star.setAttribute('aria-label', (selected ? 'Убрать из избранного ' : 'Сохранить ') + item.name); star.setAttribute('aria-pressed', String(selected));
    star.onclick = () => { favorites = selected ? favorites.filter(x => x.name !== item.name) : [...favorites, item]; save(); render(); };
    top.append(badge, star);
    const name = document.createElement('button'); name.className = 'nickname'; name.textContent = item.name; name.title = 'Скопировать ' + item.name;
    const bottom = document.createElement('div'); bottom.className = 'card-bottom'; const size = document.createElement('span'); size.textContent = new Date(item.checkedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); size.title = 'Время проверки. Доступность может измениться.';
    const copy = document.createElement('button'); copy.className = 'copy'; copy.textContent = 'Копировать ↗';
    const copyName = async () => { try { await navigator.clipboard.writeText(item.name); toast('Ник ' + item.name + ' скопирован'); } catch { toast('Копирование недоступно в этом браузере'); } }; name.onclick = copyName; copy.onclick = copyName;
    bottom.append(size, copy); card.append(top, name, bottom); $('cards').append(card);
  }
}
function setView(next) { view = next; $('browse').classList.toggle('active', next === 'browse'); $('saved').classList.toggle('active', next === 'saved'); $('crumb').textContent = next === 'saved' ? 'Избранное' : 'Поиск никнеймов'; $('results-title').textContent = next === 'saved' ? 'Твои сохранённые ники' : 'Подходящие никнеймы'; render(); }
async function search(event) {
  if (event) event.preventDefault();
  if (scanning) { stopped = true; $('search').textContent = 'Останавливаем…'; return; }
  const options = { length: Number($('length').value), contains: $('contains').value.trim().toLowerCase(), prefix: $('prefix').value.trim().toLowerCase(), suffix: $('suffix').value.trim().toLowerCase(), alphabet: $('alphabet').value, free: $('free').checked, idle: $('idle').checked };
  $('error').textContent = '';
  for (const text of [options.contains, options.prefix, options.suffix]) { if (!/^[a-z0-9]*$/.test(text)) { $('error').textContent = 'Поддерживаются латинские буквы a–z и цифры 0–9.'; return; } if (text.length > options.length) { $('error').textContent = 'Условие длиннее выбранного никнейма.'; return; } }
  if (!options.free && !options.idle) { $('error').textContent = 'Выбери хотя бы один статус.'; return; }
  const candidates = generate(options);
  results = []; setView('browse');
  if (!candidates.length) { $('summary').textContent = 'Нет вариантов под эти условия'; return; }
  scanning = true; stopped = false;
  $('connect').disabled = true; $('reset').disabled = true;
  $('search').textContent = 'Остановить поиск';
  const filterInputs = [...$('filters').querySelectorAll('input, select')];
  filterInputs.forEach(input => input.disabled = true);
  let checked = 0, unknown = 0, failed = false;
  try {
    await shop.scan(candidates, (name, reply) => {
      checked++;
      const status = classifyShopReply(reply);
      if ((status === 'free' || status === 'idle') && options[status]) {
        results.push({ name, status, checkedAt: Date.now() });
        render();
      } else if (status === 'unknown') unknown++;
      $('summary').textContent = 'Проверено ' + checked + ' / ' + candidates.length + ' · найдено: ' + results.length;
      if (!results.length) $('empty-text').textContent = 'Проверка идёт. Подходящих доступных ников пока нет.';
    }, () => stopped, () => { $('summary').textContent = 'FACEIT ограничил частоту. Пауза минимум 60 секунд, затем повтор. Поиск можно остановить.'; });
  } catch (error) { failed = true; $('error').textContent = error.message; }
  finally {
    scanning = false; $('connect').disabled = false; $('reset').disabled = false;
    filterInputs.forEach(input => input.disabled = false);
    $('search').textContent = 'Найти никнеймы ↗';
    $('summary').textContent = (failed ? 'Прервано ошибкой' : stopped ? 'Остановлено' : 'Готово') + ' · проверено ' + checked + ' / ' + candidates.length + (candidates.length === 120 ? ' · ограниченная выборка' : '') + ' · не определено: ' + unknown;
    if (!results.length) $('empty-text').textContent = failed || stopped ? 'Поиск не завершён. Можно запустить его снова.' : 'Подходящих доступных ников среди проверенных вариантов нет.';
  }

}
$('filters').addEventListener('submit', search);
$('length').oninput = () => { const n = Number($('length').value); $('length-label').textContent = n + (n < 5 ? ' символа' : ' символов'); };
$('reset').onclick = () => { $('filters').reset(); $('length').oninput(); $('error').textContent = ''; results = []; render(); $('summary').textContent = 'Фильтры сброшены. Нажми «Найти никнеймы».'; };
$('browse').onclick = () => setView('browse'); $('saved').onclick = () => setView('saved'); $('sort').onchange = render;
render();


let scanning = false, stopped = false;
const shop = new FaceitShopClient();
$('shop-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (scanning) return;
  const nickname = $('test-nickname').value.trim();
  $('search').disabled = true;
  $('connect').disabled = true;
  $('api-status').textContent = 'Запрашиваем магазин FACEIT…';
  try {
    await shop.preflight();
    const reply = await shop.check(nickname);
    const labels = {
      free: 'Никнейм доступен',
      unavailable: 'Никнейм недоступен',
      idle: 'Никнейм доступен для Idle Claim',
      unknown: 'Не удалось определить доступность. Попробуй позже.'
    };
    $('api-status').textContent = labels[classifyShopReply(reply)];
  } catch(error) { $('api-status').textContent = error.message; }
  finally { $('connect').disabled = false; $('search').disabled = false; }
});
