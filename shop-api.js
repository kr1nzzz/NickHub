'use strict';
// Runs in the isolated world of an existing FACEIT tab. No cookie/token extraction.
async function readShopAvailability(nickname) {
  if (location.origin !== 'https://www.faceit.com' || !/^[a-zA-Z0-9_-]{3,30}$/.test(nickname)) return { error: 'Открой www.faceit.com и введи ник из 3–30 латинских букв, цифр, _ или -.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/shop/v2/nickname-availability/' + encodeURIComponent(nickname), {
      method: 'GET', credentials: 'include', cache: 'no-store', redirect: 'error', signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (response.status === 401) return {error:'Сессия FACEIT завершилась. Войди в аккаунт и повтори поиск.',status:401};
    if (response.status === 403) return {error:'FACEIT не разрешил проверку. Открой сайт и проверь вход в аккаунт.',status:403};
    if (!response.ok) return { error: response.status === 429 ? 'Лимит FACEIT. Подожди перед повторной проверкой.' : 'FACEIT вернул HTTP ' + response.status + '. Проверь вход на сайт.', status: response.status, retryAfter: response.headers.get('Retry-After') };
    const data = await response.json();
    if (typeof data?.payload?.available !== 'boolean' || typeof data?.payload?.belongs_to_idle_user !== 'boolean') return { error: 'Формат ответа изменился. Доступность не подтверждена.' };
    return { available: data.payload.available, belongs_to_idle_user: data.payload.belongs_to_idle_user };
  } catch { return { error: 'Не удалось прочитать ответ FACEIT. Проверь открытую вкладку и повтори позже.' }; }
  finally { clearTimeout(timer); }
}
function inspectFaceitPage() {
  if (location.origin !== 'https://www.faceit.com') return 'unknown';
  const visible = el => Boolean(el.getClientRects().length);
  const links = [...document.querySelectorAll('a[href]')].filter(visible);
  const logout = [...document.querySelectorAll('button,a')].filter(visible).some(el => /^(log out|logout|sign out|выйти)$/i.test(el.textContent.trim()));
  const account = links.some(el => /\/(settings|account)(\/|$)/i.test(new URL(el.href, location.href).pathname));
  const login = links.some(el => /\/(login|signin|sign-in)(\/|$)/i.test(new URL(el.href, location.href).pathname)) || [...document.querySelectorAll('button')].filter(visible).some(el => /^(log in|login|sign in|войти|вход)$/i.test(el.textContent.trim()));
  if (login) return 'signed_out';
  if (logout || account) return 'signed_in';
  return 'unknown';
}
class FaceitShopClient {
  constructor() { this.nextRequestAt = 0; this.tabId = null; }
  async preflight() {
    if (!globalThis.chrome?.scripting) throw new Error('Открой NickHub через значок установленного расширения.');
    const tabs = await chrome.tabs.query({ url: 'https://www.faceit.com/*' });
    if (!tabs.length) { this.tabId = null; throw new Error('Открой вкладку FACEIT и войди в аккаунт. Затем вернись сюда и повтори поиск.'); }
    let signedOut = false;
    let unknownTab = null;
    for (const tab of tabs.sort((a,b) => Number(b.active)-Number(a.active))) {
      try {
        const result = await chrome.scripting.executeScript({ target: {tabId:tab.id}, world:'ISOLATED', func:inspectFaceitPage });
        const state = result?.[0]?.result;
        if (state === 'signed_in') { this.tabId = tab.id; return; }
        if (state === 'signed_out') signedOut = true;
        if (state === 'unknown' && unknownTab === null) unknownTab = tab.id;
      } catch {}
    }
    // Hidden account menus do not prove logout. Let the shop response decide access.
    if (unknownTab !== null) { this.tabId = unknownTab; return; }
    this.tabId = null;
    throw new Error(signedOut ? 'Войди в аккаунт на FACEIT, оставь вкладку открытой и повтори поиск.' : 'Не удалось прочитать вкладку FACEIT. Обнови её и проверь разрешение расширения на доступ к сайту.');
  }
  async check(nickname, shouldStop = () => false, onPause = () => {}) {
    if (!globalThis.chrome?.scripting) throw new Error('Установи NickHub через раздел расширений браузера.');
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(nickname)) throw new Error('Недопустимый никнейм.');
    for (let attempt = 0; attempt < 2; attempt++) {
      while (Date.now() < this.nextRequestAt && !shouldStop()) await new Promise(resolve => setTimeout(resolve, 100));
      if (shouldStop()) return null;
      // Reserve a start slot synchronously so concurrent workers cannot burst.
      this.nextRequestAt = Date.now() + 300;
      if (this.tabId === null) {
        const tabs = await chrome.tabs.query({ url: 'https://www.faceit.com/*' });
        const tab = tabs.find(t => t.active) || tabs[0];
        if (!tab) throw new Error('Открой FACEIT в этом браузере и войди в аккаунт.');
        this.tabId = tab.id;
      }
      if (shouldStop()) return null;
      let injected;
      try { injected = await chrome.scripting.executeScript({ target: { tabId: this.tabId }, world: 'ISOLATED', func: readShopAvailability, args: [nickname] }); }
      catch { this.tabId = null; throw new Error('Вкладка FACEIT закрыта или недоступна. Открой её и повтори поиск.'); }
      if (shouldStop()) return null;
      const result = injected?.[0]?.result;
      if (result?.status === 429) {
        const seconds = Number(result.retryAfter);
        const delay = result.retryAfter && Number.isFinite(seconds) ? seconds * 1000 : Date.parse(result.retryAfter) - Date.now();
        this.nextRequestAt = Math.max(this.nextRequestAt, Date.now() + Math.max(60000, Number.isFinite(delay) ? delay : 60000));
        onPause();
        if (attempt === 0) continue;
      }
      if (!result) throw new Error('Вкладка не вернула ответ.');
      if (result.error) throw new Error(result.error);
      if (typeof result.available !== 'boolean' || typeof result.belongs_to_idle_user !== 'boolean') throw new Error('Неподтверждённый формат ответа.');
      return result;
    }
  }
  async scan(names, onResult, shouldStop, onPause) {
    await this.preflight();
    let index = 0, error = null;
    const cancelled = () => Boolean(error) || shouldStop();
    const worker = async () => {
      while (!cancelled() && index < names.length) {
        const name = names[index++];
        try {
          const reply = await this.check(name, cancelled, onPause);
          if (!cancelled() && reply) onResult(name, reply);
        } catch (cause) { error ||= cause; }
      }
    };
    await Promise.all([worker(), worker()]);
    if (error) throw error;
  }
}

function classifyShopReply(reply) {
  if (reply?.available === true && reply?.belongs_to_idle_user === true) return 'idle';
  if (reply?.available === true && reply?.belongs_to_idle_user === false) return 'free';
  if (reply?.available === false && reply?.belongs_to_idle_user === false) return 'unavailable';
  return 'unknown';
}
