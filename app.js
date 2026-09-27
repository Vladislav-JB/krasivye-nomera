(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const L = 'АВЕКМНОРСТУХ';
  const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };
  const NF = new Intl.NumberFormat('ru-RU');
  const rub = n => NF.format(n) + ' ₽';
  const toCyr = s => s.toUpperCase().split('').map(c => LAT[c] || c).join('');

  /* ---- демо-данные (детерминированные) ---- */
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const REG = { msk: ['77', '97', '99', '177', '197', '199', '777', '797', '799', '977'], mo: ['50', '90', '150', '190', '750'], spb: ['78', '98', '178', '198', '47'], oth: ['16', '23', '54', '61', '66', '116', '123', '161'] };
  const areaOf = r => Object.keys(REG).find(k => REG[k].includes(r)) || 'oth';
  const SELLERS = ['Blatznak', 'Номер-Про', 'Алексей М.', 'AutoSign', 'Дмитрий К.', 'Сергей В.', 'Премиум-знак', 'Игорь Т.', 'Руслан А.', 'Марина С.', 'Госномер77', 'Олег П.'];
  const PRO = new Set(['Blatznak', 'Номер-Про', 'AutoSign', 'Премиум-знак', 'Госномер77']);
  function beauty(n) {
    const d = n.slice(1, 4), l = n[0] + n[4] + n[5];
    let s = 0;
    if (d[0] === d[1] && d[1] === d[2]) s += 5; else if (d[0] === '0' && d[1] === '0') s += 5; else if (/^[1-9]00$/.test(d)) s += 4; else if (d[0] === d[2]) s += 2; else if (d[0] === '0') s += 1;
    if (l[0] === l[1] && l[1] === l[2]) s += 4; else if (l[1] === l[2]) s += 1;
    return s;
  }
  function makeDigits() {
    const r = rnd(), a = String(1 + Math.floor(rnd() * 9));
    if (r < .22) return a + a + a;
    if (r < .38) return '00' + a;
    if (r < .52) return a + '00';
    if (r < .68) { const b = String(Math.floor(rnd() * 10)); return a + b + a; }
    if (r < .78) return '0' + a + a;
    return String(Math.floor(rnd() * 900) + 100);
  }
  function makeLetters() { const a = pick(L); const r = rnd(); if (r < .35) return [a, a, a]; if (r < .6) { const b = pick(L); return [a, b, b]; } return [a, pick(L), pick(L)]; }
  const now = Date.now(), DAY = 864e5;
  let ads = [];
  const seen = new Set();
  while (ads.length < 180) {
    const ls = makeLetters(), dg = makeDigits(), num = ls[0] + dg + ls[1] + ls[2];
    const area = rnd() < .55 ? 'msk' : rnd() < .5 ? 'mo' : rnd() < .6 ? 'spb' : 'oth';
    const reg = pick(REG[area]);
    if (seen.has(num + reg)) continue; seen.add(num + reg);
    const b = beauty(num);
    const price = Math.round((40000 + b * b * 42000 + rnd() * 90000 * (1 + b)) / 10000) * 10000 * (['77', '97', '99', '777'].includes(reg) ? 1.4 : 1) | 0;
    ads.push({ id: ads.length + 1, num, reg, area, price: Math.round(price / 10000) * 10000, seller: pick(SELLERS), date: now - Math.floor(rnd() * 30) * DAY - Math.floor(rnd() * DAY), views: 20 + Math.floor(rnd() * 900) });
  }
  const top = [...ads].sort((a, b) => beauty(b.num) - beauty(a.num) || b.price - a.price).slice(0, 10);

  /* ---- номер-картинка ---- */
  function plate(a, mask, big) {
    const ch = a.num.split('').map((c, i) => { const m = mask && mask[i]; const t = m ? `<mark>${c}</mark>` : c; return i >= 1 && i <= 3 ? `<b>${t}</b>` : `<small>${t}</small>`; });
    return `<span class="pl${big ? ' pl--lg' : ''}" aria-label="Номер ${a.num} ${a.reg} RUS"><span class="pl__m">${ch.join('')}</span><span class="pl__r">${a.reg}<span class="rus">RUS <i></i></span></span></span>`;
  }
  const dstr = t => new Date(t).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ---- фильтры ---- */
  const cells = $$('.plate-in__main input');
  const st = { mask: ['', '', '', '', '', ''], reg: '', min: 0, max: 0, area: '', chip: '', sort: 'new', shown: 20 };
  const chipFn = {
    same3: a => /^.(\d)\1\1/.test(a.num),
    letters: a => a.num[0] === a.num[4] && a.num[4] === a.num[5],
    round: a => /^.[1-9]00/.test(a.num),
    first: a => /^.00[1-9]/.test(a.num),
    mirror: a => a.num[1] === a.num[3] && a.num[1] !== a.num[2],
    full: a => /^.(\d)\1\1/.test(a.num) && a.num[0] === a.num[4] && a.num[4] === a.num[5]
  };
  function match(a) {
    for (let i = 0; i < 6; i++) if (st.mask[i] && a.num[i] !== st.mask[i]) return false;
    if (st.reg && !a.reg.startsWith(st.reg)) return false;
    if (st.min && a.price < st.min) return false;
    if (st.max && a.price > st.max) return false;
    if (st.area && a.area !== st.area) return false;
    if (st.chip && !chipFn[st.chip](a)) return false;
    return true;
  }
  function render() {
    let list = ads.filter(match);
    list.sort(st.sort === 'cheap' ? (a, b) => a.price - b.price : st.sort === 'exp' ? (a, b) => b.price - a.price : (a, b) => b.date - a.date);
    $('#found').textContent = '· ' + NF.format(list.length);
    $('#empty').hidden = list.length > 0;
    $('#more').hidden = list.length <= st.shown;
    const mask = st.mask.map(Boolean);
    $('#rows').innerHTML = list.slice(0, st.shown).map(a => `<tr data-id="${a.id}" tabindex="0">
      <td class="date">${dstr(a.date)}</td><td class="plate">${plate(a, mask)}</td><td class="price">${rub(a.price)}</td>
      <td class="sel"><span class="seller"><i>${a.seller[0]}</i>${a.seller}${PRO.has(a.seller) ? ' <span class="pro">PRO</span>' : ''}</span></td>
      <td class="act"><span class="btn btn--sm">Подробнее</span></td></tr>`).join('');
  }
  cells.forEach((inp, i) => {
    const digit = i >= 1 && i <= 3;
    inp.addEventListener('input', () => {
      let v = toCyr(inp.value.slice(-1));
      if (v === '*') v = '';
      if (v && (digit ? !/\d/.test(v) : !L.includes(v))) { v = ''; toast(digit ? 'Здесь только цифра' : 'Здесь только буква: ' + L.split('').join(' ')); }
      inp.value = v; st.mask[i] = v; st.shown = 20; render();
      if (v && cells[i + 1]) cells[i + 1].focus(); else if (v && i === 5) $('#f-reg').focus();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && cells[i - 1]) cells[i - 1].focus(); });
  });
  const num = s => +String(s).replace(/\D/g, '') || 0;
  $('#f-reg').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); st.reg = e.target.value; st.shown = 20; render(); });
  $('#f-min').addEventListener('input', e => { st.min = num(e.target.value); render(); });
  $('#f-max').addEventListener('input', e => { st.max = num(e.target.value); render(); });
  $('#f-area').addEventListener('change', e => { st.area = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { st.sort = e.target.value; render(); });
  $$('#chips .chip').forEach(c => c.addEventListener('click', () => {
    st.chip = st.chip === c.dataset.c ? '' : c.dataset.c;
    $$('#chips .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.c === st.chip)); st.shown = 20; render();
  }));
  $('#f-reset').addEventListener('click', () => {
    cells.forEach(c => c.value = ''); ['#f-reg', '#f-min', '#f-max'].forEach(s => $(s).value = ''); $('#f-area').value = '';
    Object.assign(st, { mask: ['', '', '', '', '', ''], reg: '', min: 0, max: 0, area: '', chip: '', shown: 20 });
    $$('#chips .chip').forEach(x => x.setAttribute('aria-pressed', false)); render();
  });
  $('#more').addEventListener('click', () => { st.shown += 20; render(); });
  $$('[data-reg]').forEach(a => a.addEventListener('click', () => { $('#f-reset').click(); $('#f-reg').value = a.dataset.reg; st.reg = a.dataset.reg; render(); }));

  /* ---- карточка ---- */
  function openModal(id) { const m = $(id); m.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModals() { $$('.modal').forEach(m => m.hidden = true); document.body.style.overflow = ''; }
  $$('.modal').forEach(m => { m.addEventListener('click', e => { if (e.target === m) closeModals(); }); $('.modal__x', m).addEventListener('click', closeModals); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
  function showCard(id) {
    const a = ads.find(x => x.id === +id); if (!a) return;
    $('#card').innerHTML = `<div class="card-plate">${plate(a, null, true)}</div>
      <dl class="kv"><dt>Цена</dt><dd>${rub(a.price)}</dd><dt>Регион</dt><dd>${a.reg} · ${{ msk: 'Москва', mo: 'Московская обл.', spb: 'Санкт-Петербург и ЛО', oth: 'другой регион' }[a.area]}</dd>
      <dt>Продавец</dt><dd>${a.seller}${PRO.has(a.seller) ? ' <span class="pro">PRO</span>' : ''}</dd><dt>Размещено</dt><dd>${dstr(a.date)} · ${a.views} просмотров</dd></dl>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--acc" data-demo="Демо: телефон продавца показывается после входа.">Показать телефон</button><button class="btn" data-demo="Демо: чат с продавцом внутри сайта.">Написать продавцу</button></div>
      <p class="muted" style="font-size:.8rem;margin-top:14px">Переоформление – только через регистрационные действия в ГИБДД. <a href="#pereoformlenie">Как это работает</a></p>`;
    bindDemo($('#card')); openModal('#m-card');
  }
  $('#rows').addEventListener('click', e => { const tr = e.target.closest('tr'); if (tr) showCard(tr.dataset.id); });
  $('#rows').addEventListener('keydown', e => { if (e.key === 'Enter') { const tr = e.target.closest('tr'); if (tr) showCard(tr.dataset.id); } });
  $('#top').innerHTML = top.map(a => `<li data-id="${a.id}">${plate(a)}<span class="p">${rub(a.price)}</span></li>`).join('');
  $('#top').addEventListener('click', e => { const li = e.target.closest('li'); if (li) showCard(li.dataset.id); });

  /* ---- генератор ---- */
  function gen() {
    let d = $('#gen-in').value.replace(/\D/g, '');
    if (!d) { toast('Впишите от 1 до 3 цифр'); return; }
    d = d.padStart(3, '0').slice(-3);
    const combos = [];
    for (const c of L) combos.push(c + d + c + c);
    const out = combos.slice(0, 12).map(n => {
      const a = ads.find(x => x.num === n);
      return a ? `<span data-id="${a.id}" title="Продаётся за ${rub(a.price)}" style="cursor:pointer">${plate(a)}</span>` : `<span class="free" title="Сейчас не продаётся">${plate({ num: n, reg: '77' })}</span>`;
    });
    const n = combos.filter(x => ads.some(a => a.num === x)).length;
    $('#gen-out').innerHTML = `<p style="width:100%;margin:0 0 4px">В продаже: <b>${n}</b> из ${combos.length}. Яркие – продаются, нажмите.</p>` + out.join('');
  }
  $('#gen-go').addEventListener('click', gen);
  $('#gen-in').addEventListener('keydown', e => { if (e.key === 'Enter') gen(); });
  $('#gen-out').addEventListener('click', e => { const s = e.target.closest('[data-id]'); if (s) showCard(s.dataset.id); });

  /* ---- добавить номер ---- */
  $$('[data-add]').forEach(b => b.addEventListener('click', () => openModal('#m-add')));
  $('#add-form').addEventListener('submit', e => {
    e.preventDefault();
    const n = toCyr($('#a-num').value.trim());
    if (!new RegExp(`^[${L}]\\d{3}[${L}]{2}$`).test(n)) { toast('Номер в формате А777АА: буквы ' + L); return; }
    const reg = $('#a-reg').value.replace(/\D/g, '');
    ads.unshift({ id: ads.length + 1000, num: n, reg, area: areaOf(reg), price: num($('#a-price').value), seller: $('#a-name').value.trim() || 'Вы', date: Date.now(), views: 0 });
    closeModals(); e.target.reset(); $('#f-reset').click(); toast('Объявление добавлено – оно первое в списке'); updStats();
  });

  /* ---- меню, подсказки ---- */
  $('.burger').addEventListener('click', () => { const o = $('.hdr').classList.toggle('open'); $('.burger').setAttribute('aria-expanded', o); });
  $$('.nav a').forEach(a => a.addEventListener('click', () => $('.hdr').classList.remove('open')));
  let tt;
  function toast(m) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 3000); }
  function bindDemo(root) { $$('[data-demo]', root).forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast(a.dataset.demo || 'В демо этот раздел не делался – на боевом сайте здесь будет отдельная страница.'); })); }
  bindDemo(document);
  function updStats() { $('#st-total').textContent = NF.format(ads.length); $('#st-reg').textContent = new Set(ads.map(a => a.reg)).size; }
  updStats();
  const q = new URLSearchParams(location.search).get('q');
  if (q) { toCyr(q).slice(0, 6).split('').forEach((c, i) => { if (cells[i]) { cells[i].value = c; st.mask[i] = c; } }); }
  render();
})();
