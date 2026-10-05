/* Панель вида — выбор на самой витрине (look-panel/PANEL.md). Отдельный
   контейнер: простой скрипт, свои стили, ни React, ни кода сайта. Сайт
   подключает её одной строкой, пока LOOK_PICKER=on, и от неё ничего не
   берёт; всё её — в look-panel/, вход — /look-panel/.

   Что она делает с сайтом — только передаёт значения:
   · щелчок по варианту сразу красит страницу своим блоком
     `<style id="look-preview">` поверх опубликованного и пишет черновик вида
     на сервер (POST /look-panel/draft) — в черновом режиме сайт рисует
     черновик, другие гости видят опубликованное;
   · выбор, черновик, предпросмотр и публикация — общее состояние страницы
     (studio.mjs): его же берёт страница дизайн-системы, и подраздел,
     переехавший туда (`page` в choice.mjs, первым — палитра, И567), здесь
     стоит ссылкой, а не вторым выбором;
   · шапка и карточка товара — другая разметка: черновик и перезагрузка;
   · «Publish» — проверка сочетания (check:choice) и публикация без сборки.
   Вариант, который с текущими не носится, погашен: пары посчитаны правилом
   сайта при сборке каталога (для своей палитры — сервером, тем же правилом).

   Высота панели — от экрана, не от содержимого: верх (заголовок, разделы,
   подразделы) и низ (действия) стоят на месте, прокручивается середина.
   «Expand» разворачивает её: каждый вариант крупным образцом на том, на чём
   встанет, — кнопка настоящей кнопкой сайта на полу и на тёмной полосе,
   палитра карточкой товара; ширина помнится за зрителем. */
(function () {
  var script = document.currentScript
  var base = new URL('.', script && script.src ? script.src : location.origin + '/look-panel/')
  var OPEN = 'look-panel-open'
  var TAB = 'look-panel-tab'
  var SUB = 'look-panel-sub-'
  var root = document.documentElement
  var SVG = 'http://www.w3.org/2000/svg'

  function el(tag, attrs, kids) {
    var n = document.createElement(tag)
    for (var k in attrs || {}) {
      var v = attrs[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'text') n.textContent = v
      else if (k === 'style') n.setAttribute('style', v)
      else n.setAttribute(k, v === true ? '' : v)
    }
    ;(kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c) })
    return n
  }
  /** Знак — рисунок линией, одной толщины: закрыть, галочка. */
  function icon(d, size) {
    var s = document.createElementNS(SVG, 'svg')
    s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('width', size || 14); s.setAttribute('height', size || 14); s.setAttribute('aria-hidden', 'true')
    var path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-width', '1.75'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round')
    s.appendChild(path)
    return s
  }
  var TICK = 'M3.5 8.5l3 3 6-7'
  var CROSS = 'M4 4l8 8M12 4l-8 8'
  /* Развернуть — уголки наружу, свернуть — внутрь. */
  var GROW = 'M9.5 2.5h4v4M13.5 2.5l-4.5 4.5M6.5 13.5h-4v-4M2.5 13.5l4.5-4.5'
  var SHRINK = 'M13 7h-4V3M9 7l4.5-4.5M3 9h4v4M7 9l-4.5 4.5'
  /* Полоса «Look»: настройка — два движка на двух линиях; открыть — уголок вверх. */
  var SLIDERS = 'M2.5 5h11M2.5 11h11M6 3.25v3.5M10 9.25v3.5'
  var UP = 'M4 10l4-4 4 4'
  /* Перенести панель к другому краю — стрелка в ту сторону. */
  var TO_START = 'M7 4L3 8l4 4M3 8h10'
  var TO_END = 'M9 4l4 4-4 4M13 8H3'
  function remember(key, value) {
    try { value === null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, value) } catch (e) { /* без памяти */ }
  }
  function recall(key) {
    try { return sessionStorage.getItem(key) } catch (e) { return null }
  }
  /* Ширина панели помнится за зрителем, а не за вкладкой: развернул однажды —
     в следующий раз панель откроется развёрнутой (localStorage этого браузера). */
  /* Сторона панели — тоже за зрителем: панель переезжает к другому краю,
     чтобы открыть то, что она закрывала (слово заказчика 29.09.2026: «панель
     сделай, чтоб могла перемещаться от одной стороны к другой»; И574). */
  var SIDE = 'look-panel-side'
  function keepSide(start) {
    try { start ? localStorage.setItem(SIDE, 'start') : localStorage.removeItem(SIDE) } catch (e) { /* без памяти */ }
  }
  function keptSide() {
    try { return localStorage.getItem(SIDE) === 'start' } catch (e) { return false }
  }
  var WIDE = 'look-panel-wide'
  function keepWide(on) {
    try { on ? localStorage.setItem(WIDE, '1') : localStorage.removeItem(WIDE) } catch (e) { /* без памяти */ }
  }
  function keptWide() {
    try { return localStorage.getItem(WIDE) === '1' } catch (e) { return false }
  }
  function build(s, later, choice, said, swatch) {
    var catalog = s.catalog
    var names = s.names
    /* Стили панели страница ставит сама, до первой отрисовки (Shell.tsx):
       в них резерв нижней полосы `--dock`, и пришедший со скриптом он
       сдвигал бы готовую страницу — галерея товара сжималась на рост
       полосы после показа (25.09.2026). Здесь — только если страница их не
       поставила. */
    var sheet = new URL('look.css', base).href
    var have = [].some.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return l.href === sheet })
    if (!have) document.head.appendChild(el('link', { rel: 'stylesheet', href: sheet }))
    /* Шрифты-кандидаты — только в предпросмотре панели: образцы шрифтов
       набраны своим шрифтом. Опубликованный вид несёт свой шрифт с адреса
       сайта, к Google страница покупателя не ходит. */
    catalog.groups.face.forEach(function (f) { if (f.google) document.head.appendChild(el('link', { rel: 'stylesheet', href: f.google })) })

    var status = el('output', { class: 'lp-status', 'aria-live': 'polite' })
    /* Строка итога публикации — одной фразой; отчёт проверки — под
       раскрытием с потолком и прокруткой, и крестик убирает всё: отчёт
       целиком занимал низ панели и не закрывался (заказчик 28.09.2026: «это
       полотно текста закрыть не могу, чтоб дальше работать»). */
    var say = function (text, detail) {
      status.replaceChildren()
      if (!text) return
      var shut = el('button', { type: 'button', class: 'lp-status-x', 'aria-label': 'Dismiss', text: '×' })
      shut.addEventListener('click', function () { say('') })
      status.append(el('span', { class: 'lp-status-line' }, [el('span', { text: text }), shut]))
      if (detail) status.append(el('details', { class: 'lp-status-more' }, [el('summary', { text: 'Details' }), el('pre', { text: detail })]))
    }
    var groups = []
    /* Полоса «Look» говорит «Draft», пока страница показывает не
       опубликованное (`s.drafting`). Сама полоса строится ниже. */
    var bandSync = function () {}
    var publishing = false
    function refresh() {
      groups.forEach(function (g) { g.refresh() })
      bandSync()
      var bad = s.clashes()
      publish.disabled = publishing || Boolean(bad.length)
      publish.title = bad.length ? bad[0].why : ''
    }

    function sample(field, o) {
      if (field === 'palette' && o.dots) {
        var dots = o.dots.light.map(function (c, i) { return el('i', { class: 'lp-dot', style: 'background:light-dark(' + c + ',' + o.dots.dark[i] + ')' }) })
        return el('span', { class: 'lp-dots', 'aria-hidden': 'true' }, dots)
      }
      if (field.indexOf('btn-') === 0 && o.vars['--ctrl-btn-tip'] !== undefined) {
        /* Форма главной кнопки — та же формула, что в btn.module.css, на
           образце высотой 18: остриё, выемка и хвост шевронов тоном. */
        var h = 18
        var num = function (k) { return Number(o.vars[k] || 0) * h }
        var tip = num('--ctrl-btn-tip'), point = num('--ctrl-btn-tip-at'), notch = num('--ctrl-btn-notch')
        var clip = 'polygon(0 0, calc(100% - ' + tip + 'px) 0, calc(100% - ' + point + 'px) 50%, calc(100% - ' + tip + 'px) 100%, 0 100%, ' + notch + 'px 50%)'
        var kids = [el('span', { class: 'lp-shaped', style: 'clip-path:' + clip })]
        if (o.vars['--ctrl-btn-echo'] === 'block') {
          var gs = [num('--ctrl-btn-trail-1'), num('--ctrl-btn-trail-2')].filter(function (g, i, all) { return all.indexOf(g) === i })
          gs.forEach(function (g, i) {
            var x = function (k) { return 'calc(100% - ' + (point + k * h - g).toFixed(1) + 'px)' }
            /* Тоны хвоста — роли палитры сайта (И295), а не смесь на месте. */
            kids.unshift(el('i', { class: 'lp-echo', style: 'clip-path:polygon(' + x(0.33) + ' 0, ' + x(0.03) + ' 0, ' + x(-0.3) + ' 50%, ' + x(0.03) + ' 100%, ' + x(0.33) + ' 100%, ' + x(0) + ' 50%);background:var(' + (i ? '--pop-trail-far' : '--pop-trail-near') + ')' }))
          })
        }
        return el('span', { class: 'lp-shape-sample', 'aria-hidden': 'true' }, kids)
      }
      if (field.indexOf('btn-') === 0) {
        /* Образец оси кнопки — роли варианта на маленькой кнопке, поверх пола
           страницы: вуаль видна такой, какой встанет на сайте. */
        var v = o.vars
        var fill = v['--ctrl-btn-fill-pop'] || v['--ctrl-btn-fill'] || 'transparent'
        var style = 'background:linear-gradient(' + fill + ',' + fill + '),var(--page, #fff);color:' + (v['--ctrl-btn-ink-pop'] || v['--ctrl-btn-ink'] || 'var(--ink)') +
          ';border-color:' + (v['--ctrl-btn-edge-pop'] || v['--ctrl-btn-edge'] || 'transparent') + ';font-weight:600'
        return el('span', { class: 'lp-btn', style: style, 'aria-hidden': 'true', text: 'Aa' })
      }
      /* Вид поля (И390): заливка и кромка варианта поверх пола страницы;
         у тона — одна черта снизу. */
      if (field === 'field') {
        var fv = o.vars
        var ff = fv['--ctrl-field-fill'] || 'transparent'
        return el('span', { class: 'lp-field', 'data-side': fv['--ctrl-field-side'], style: 'background:linear-gradient(' + ff + ',' + ff + '),var(--page, #fff);border-color:' + (fv['--ctrl-field-edge'] || 'currentColor'), 'aria-hidden': 'true' })
      }
      /* Место подписи (И394): полоска поля и черта подписи над ним или на кромке. */
      if (field === 'field-label') return el('span', { class: 'lp-label', 'data-at': o.vars['--ctrl-field-label'], 'aria-hidden': 'true' }, [el('b'), el('i', { class: 'lp-field' })])
      /* Пара «поле и кнопка» (И421): две коробки с зазором или одна. */
      if (field === 'pair-look') return el('span', { class: 'lp-pair', 'data-at': o.vars['--pair-look'], 'aria-hidden': 'true' }, [el('i'), el('b')])
      /* Сообщение формы (И420): строка или заметка с точкой знака. */
      if (field === 'say-look') return el('span', { class: 'lp-say', 'data-at': o.vars['--say-look'], 'aria-hidden': 'true' }, [el('i'), el('b')])
      /* Шапка cbdin (И430): знак корзины, сумма у корзины. */
      if (field === 'cart-sign') return el('span', { class: 'lp-go', 'aria-hidden': 'true', text: o.vars['--cart-sign'] === 'bag' ? '👜' : '🛒' })
      if (field === 'door-case') return el('span', { class: 'lp-go', 'aria-hidden': 'true', text: o.vars['--door-case'] === 'uppercase' ? 'AA' : 'Aa' })
      if (field === 'cart-meta') return el('span', { class: 'lp-go', 'aria-hidden': 'true', text: o.vars['--cart-meta'] === 'sum' ? '2 · €45' : '2' })
      /* Ссылка под рукой (И397): стрелка краской варианта. */
      if (field === 'go-hover') return el('span', { class: 'lp-go', style: o.vars['--go-hover'] === 'currentcolor' ? '' : 'color:' + o.vars['--go-hover'], 'aria-hidden': 'true', text: '→' })
      /* Галочка (И392): отмеченный квадрат краской варианта. */
      if (field === 'tick') return el('i', { class: 'lp-tick', style: 'background:' + o.vars['--ctrl-tick-fill'], 'aria-hidden': 'true' })
      /* «· pill» — та же ступень углов с кнопкой полным кругом (`--r-btn`): знак — дугой. */
      if (field === 'corners') { var r = o.vars['--r-btn'] === 'var(--r-pop)' ? '999px' : Math.round(parseFloat(o.vars['--r-card']) / 3) + 'px'; return el('i', { class: 'lp-shape', style: 'border-radius:' + r + ' ' + r + ' 0 0', 'aria-hidden': 'true' }) }
      /* Карта товара: доля ряда — полоса с долей галереи; пропорция — кадр;
         миниатюры — кадр с рядом под ним, полосой сбоку или точками. */
      if (field === 'pdp-gallery') return el('span', { class: 'lp-row-split', 'aria-hidden': 'true' }, [el('i', { style: 'inline-size:' + o.vars['--pdp-gallery'] })])
      /* Выбор варианта (И396): три сегмента — отдельно, встык или в подложке. */
      if (field === 'seg-look') return el('span', { class: 'lp-seg', 'data-at': o.vars['--seg-look'], 'aria-hidden': 'true' }, [el('b'), el('i'), el('i')])
      if (field === 'pdp-thumbs') {
        var at = o.vars['--pdp-thumbs']
        return el('span', { class: 'lp-thumbs', 'data-at': at, 'aria-hidden': 'true' }, [el('i', { class: 'lp-pic' })].concat([0, 1, 2].map(function () { return el('b') })))
      }
      /* Край снимка: в полях страницы — кадр со скруглением внутри рамки;
         во всю ширину — кадр от края до края рамки, лист наезжает снизу. */
      if (field === 'pdp-edge') return el('span', { class: 'lp-edge', 'data-at': o.vars['--pdp-edge'], 'aria-hidden': 'true' }, [el('i', { class: 'lp-pic' }), el('b')])
      if (field === 'shadow') return el('i', { class: 'lp-shape lp-lit', style: 'box-shadow:' + o.vars['--sh-raised'], 'aria-hidden': 'true' })
      /* Плашка категории (Home): снимок и то, на чём стоит имя — кнопка,
         лента, белая плашка или пол под снимком. */
      if (field === 'home') return el('span', { class: 'lp-door', 'data-at': o.id, 'aria-hidden': 'true' }, [el('i', { class: 'lp-pic' }), el('b')])
      return null
    }

    /* ── Развёрнутая панель: большие образцы ─────────────────────────────
       Слово заказчика 24.09.2026: «панель меню делай расширяемой, например
       чтоб все кнопки показать». Развёрнутая, панель показывает каждый
       вариант крупно и на том, на чём он встанет: кнопку — настоящей кнопкой
       сайта на полу страницы и на тёмной полосе, палитру — карточкой
       товара, одежду карточки — карточкой. Краски — роли сайта; образцы
       строятся, когда панель развернули впервые. */
    /* Кнопка сайта — её собственный класс, снятый со страницы: образец
       рисует тот же модуль (styles/btn.module.css), что и сайт. На странице
       без кнопки — рисунок панели той же формулой. */
    var siteButton = (function () {
      var found = document.querySelector('[data-voice="loud"]') || document.querySelector('[data-voice]')
      var cls = found && typeof found.className === 'string' ? found.className.split(/\s+/).filter(function (c) { return c && c.indexOf('lp-') !== 0 }).join(' ') : ''
      return cls
    })()
    var AXIS_VOICE = { quiet: 'quiet' }
    function realButton(field, o, voice) {
      if (siteButton) return el('span', { class: siteButton, 'data-voice': voice, 'data-size': 'lg', text: 'Add to cart' })
      var drawn = sample(field, o)
      return el('span', { class: 'lp-zoom' }, drawn ? [drawn] : [])
    }
    function stageOf(o, kids) {
      /* Два пола: страница и тёмная полоса. Полоса — пол палубы сайта
         (`data-ground="deck"`): роли по полу на ней переназначает сам сайт
         (base.css), образец ничего не пересчитывает. Роли варианта стоят на
         самой сцене, ВНЕ полосы, — как на сайте они стоят на корне: ссылка
         `var(--pop)` в них раскрывается там, где объявлена, и полоса видит
         ту же заливку, что герой на странице. */
      var style = Object.keys(o.vars).map(function (k) { return k + ':' + o.vars[k] }).join(';')
      return el('span', { class: 'lp-stage', style: style, 'aria-hidden': 'true' }, [
        el('span', { class: 'lp-ground' }, kids()),
        el('span', { class: 'lp-ground lp-ground-deck', 'data-ground': 'deck' }, kids()),
      ])
    }
    function big(field, o) {
      if (field.indexOf('btn-') === 0) {
        var voice = AXIS_VOICE[field.slice(4)] || 'loud'
        return stageOf(o, function () { return [realButton(field, o, voice)] })
      }
      /* Палитра — кусок магазина её красками (ui/swatch.mjs, И575). */
      if (field === 'palette' && o.seed) return el('span', { class: 'lp-big-well lp-big-palette', 'aria-hidden': 'true' }, [swatch(choice.tileOf(o.seed, catalog.steps))])
      if (field === 'card') {
        return el('span', { class: 'lp-shop lp-shop-site', 'aria-hidden': 'true' }, [
          el('span', { class: 'lp-pcard', 'data-card': o.id }, [
            el('i', { class: 'lp-card-pic' }),
            el('b', { class: 'lp-card-name', text: 'Full-spectrum oil 10%' }),
            el('small', { text: '30 ml · €45.90' }),
          ]),
        ])
      }
      if (field === 'corners') {
        /* Первая плитка — кнопка: её угол (`--r-btn`) — угол контрола или полный круг («· pill»). */
        var radius = function (k) { var v = o.vars[k]; return v === 'var(--r-pop)' ? '999px' : v === 'var(--r-ctrl)' ? o.vars['--r-ctrl'] : v }
        return el('span', { class: 'lp-big-well lp-radii', 'aria-hidden': 'true' }, ['--r-btn', '--r-card', '--r-sheet'].map(function (k) { return el('i', { style: 'border-radius:' + radius(k) }) }))
      }
      if (field === 'shadow') return el('span', { class: 'lp-big-well lp-shop-site', 'aria-hidden': 'true' }, [el('i', { class: 'lp-lift', style: 'box-shadow:' + o.vars['--sh-raised'] })])
      var small = sample(field, o)
      return el('span', { class: 'lp-big-well', 'aria-hidden': 'true' }, [small ? el('span', { class: 'lp-zoom' }, [small]) : el('b', { class: 'lp-big-name', text: o.name })])
    }
    var pendingBig = []
    function buildBig() {
      pendingBig.splice(0).forEach(function (fn) { fn() })
    }
    /* Крупной плиткой в развёрнутой панели — только выбор, видный лишь в
       размере (look.css, «Система развёрнутой панели», И576). */
    var TILED = ['palette', 'corners', 'shadow', 'card']
    function group(field, label, extra) {
      var id = 'lp-why-' + field
      var line = el('p', { class: 'lp-why', id: id })
      /* Ритм — лестницей от плотного к воздушному (`rung` каталога). */
      var list = catalog.groups[field].slice()
      var tiled = TILED.indexOf(field) >= 0 || field.indexOf('btn-') === 0
      /* Числа — по росту (слово заказчика 29.09.2026 на «36, 34, 39» у
         заголовков: «почему не по росту значения идут»; И576): каталог
         ставит умолчание первым, а глаз ищет лесенку. Имя с числом в
         начале — «34 px», «1440», «16 px». */
      var lead = function (o) { var m = /^\s*(\d+(?:[.,]\d+)?)/.exec(o.name); return m ? Number(m[1].replace(',', '.')) : NaN }
      if (list.every(function (o) { return typeof o.rung === 'number' })) list.sort(function (a, b) { return a.rung - b.rung })
      else if (list.every(function (o) { return isFinite(lead(o)) })) list.sort(function (a, b) { return lead(a) - lead(b) })
      var chips = list.map(function (o) {
        var attrs = { type: 'button', class: 'lp-chip', 'data-id': o.id, title: o.line || null }
        if (field === 'face') attrs.style = 'font-family:' + o.stack /* образец — своим шрифтом; у пары — шрифтом заголовков */
        var mini = sample(field, o)
        var cap = el('span', { class: 'lp-cap' }, [el('span', { class: 'lp-cap-name' }, [icon(TICK, 12), el('span', { text: o.name })]), o.line ? el('span', { class: 'lp-line', text: o.line }) : null])
        var chip = el('button', attrs, [mini ? el('span', { class: 'lp-mini' }, [mini]) : null, el('span', { class: 'lp-opt', 'data-text': o.name, text: o.name }), cap])
        chip.label = o.name
        /* Крупный образец — при первом развороте панели. */
        if (tiled) pendingBig.push(function () { chip.insertBefore(el('span', { class: 'lp-big' }, [big(field, o)]), cap) })
        var reason = ''
        chip.addEventListener('click', function () {
          if (reason) { line.textContent = o.name + ': ' + reason; return }
          s.pick(field, o.id)
        })
        var tell = function () { if (reason) line.textContent = o.name + ': ' + reason }
        chip.addEventListener('pointerenter', tell)
        chip.addEventListener('focus', tell)
        chip.update = function () {
          var hit = s.blockedBy(field, o.id)
          reason = hit ? 'not with ' + choice.title(catalog, hit.field, hit.id) + ' — ' + hit.why : ''
          chip.setAttribute('aria-pressed', String(names[field] === o.id))
          if (reason) { chip.setAttribute('aria-disabled', 'true'); chip.title = reason; chip.setAttribute('aria-describedby', id) }
          else { chip.removeAttribute('aria-disabled'); chip.title = o.line || ''; chip.removeAttribute('aria-describedby') }
          return reason
        }
        return chip
      })
      var legend = el('span', { class: 'lp-legend', id: id + '-l', text: label })
      /* Короткие варианты — в строку с заголовком группы (заказчик
         29.09.2026: «расположи регулировки правее от заголовка, места
         меньше займёт, и подобные регулировки в строке располагай с
         заголовком»): без крупных образцов, без своей кнопки в строке
         заголовка, имя каждого — не длиннее 10 знаков («34 px», «−1»,
         «Round»). Не помещаются — ряд переносится под заголовок сам. */
      var inline = !tiled && !extra && list.every(function (o) { return String(o.name).length <= 10 })
      var node = el('div', { class: 'lp-group', 'data-field': field, 'data-tiled': tiled, 'data-inline': inline ? '' : null }, [el('div', { class: 'lp-row' }, [legend, extra || null]), el('div', { class: 'lp-chips', role: 'group', 'aria-labelledby': id + '-l' }, chips), line])
      groups.push({ refresh: function () {
        var first = ''
        chips.forEach(function (c) { var r = c.update(); if (r && !first) first = c.label + ': ' + r })
        /* Выбранный вариант называет свои числа (слово заказчика 29.09.2026:
           «выбрал ритм — и его параметры написались»); у плиток они в подписи. */
        var picked = tiled ? null : list.find(function (o) { return o.id === names[field] })
        line.textContent = first || (picked && picked.line ? picked.name + ': ' + picked.line : '')
      } })
      return node
    }
    /* Главная кнопка — одна группа настоящих кнопок сайта (слово заказчика
       28.09.2026: «удаляй настройки главной кнопки, это хуйня какая-то»;
       «собрано множество элементов — выставляй их в панель»). Две оси
       каталога — заливка (`btn-loud`) и форма (`btn-shape`) — заказчик видит
       одним рядом кнопок: каждая форма — с заливкой марки, каждая заливка —
       обычной формой. Выбор пишет обе оси; значения — из каталога, как у
       любой группы. */
    var MAIN = [['btn-loud', 'fill'], ['btn-shape', 'standard']]
    function mainButton() {
      var loud = catalog.groups['btn-loud'] || [], shape = catalog.groups['btn-shape'] || []
      if (!loud.length || !shape.length) return null
      var of = function (f, id) { return catalog.groups[f].find(function (o) { return o.id === id }) || catalog.groups[f][0] }
      var list = shape.map(function (o) { return { name: o.name, line: o.line, set: { 'btn-loud': MAIN[0][1], 'btn-shape': o.id } } })
        .concat(loud.filter(function (o) { return o.id !== MAIN[0][1] }).map(function (o) { return { name: o.name, line: o.line, set: { 'btn-loud': o.id, 'btn-shape': MAIN[1][1] } } }))
      var line = el('p', { class: 'lp-why' })
      var picks = list.map(function (x) {
        var vars = Object.assign({}, of('btn-loud', x.set['btn-loud']).vars, of('btn-shape', x.set['btn-shape']).vars)
        var style = Object.keys(vars).map(function (k) { return k + ':' + vars[k] }).join(';')
        /* `data-shape` — образец носит форму, как кнопка героя (И618). */
        var real = siteButton ? el('span', { class: siteButton, 'data-voice': 'loud', 'data-shape': 'on', 'data-size': 'sm', text: 'Add to cart' }) : el('span', { class: 'lp-opt', text: 'Add to cart' })
        var b = el('button', { type: 'button', class: 'lp-pick-btn', title: x.line || null }, [el('span', { class: 'lp-pick-stage', style: style, 'aria-hidden': 'true' }, [real]), el('span', { class: 'lp-opt', 'data-text': x.name, text: x.name })])
        b.addEventListener('click', function () {
          var same = Object.keys(x.set).every(function (f) { return names[f] === x.set[f] })
          if (same) return
          s.pickMany(x.set)
        })
        b.update = function () {
          b.setAttribute('aria-pressed', String(Object.keys(x.set).every(function (f) { return names[f] === x.set[f] })))
          var hit = null
          Object.keys(x.set).some(function (f) { hit = s.blockedBy(f, x.set[f]); return hit })
          if (hit) { b.setAttribute('aria-disabled', 'true'); b.title = 'not with ' + choice.title(catalog, hit.field, hit.id) + ' — ' + hit.why }
          else { b.removeAttribute('aria-disabled'); b.title = x.line || '' }
        }
        return b
      })
      groups.push({ refresh: function () { picks.forEach(function (b) { b.update() }) } })
      return el('div', { class: 'lp-group', 'data-field': 'main-button' }, [
        el('span', { class: 'lp-legend', id: 'lp-main-l', text: 'Main button' }),
        el('div', { class: 'lp-picks', role: 'group', 'aria-labelledby': 'lp-main-l' }, picks), line,
      ])
    }
    /* Элементы набора — живыми отрисовками (ui/elements/). Страницы
       грузятся, когда подраздел открыли впервые, и каждая — когда дошла до
       окна (`loading=lazy`). Стоящий выбором ведёт к своему месту. */
    function gallery() {
      var node = el('div', { class: 'lp-els' })
      var built = false
      node.load = function () {
        if (built) return
        built = true
        fetch(new URL('elements/list.json', base).href).then(function (r) { return r.json() }).then(function (list) {
          node.replaceChildren.apply(node, list.map(function (e) {
            var src = new URL('elements/' + e.dir + '/element.html', base).href
            return el('figure', { class: 'lp-el' }, [
              el('iframe', { class: 'lp-el-frame', src: src, loading: 'lazy', title: e.n + ' · ' + e.name, tabindex: '-1' }),
              el('figcaption', {}, [
                el('b', { text: e.n + ' · ' + e.name }),
                el('span', { class: 'lp-line', text: e.where ? 'In the panel: ' + e.where : 'No place on the shop yet' }),
                el('a', { class: 'lp-link', href: src, target: '_blank', rel: 'noopener', text: 'Open with hover and press' }),
              ]),
            ])
          }))
        }, function () { node.replaceChildren(el('p', { class: 'lp-hint', text: 'The elements are not built yet: run the panel catalog build.' })) })
      }
      return node
    }
    var elements = gallery()
    /* Подложка секций (И591): строка на каждый блок главной — имя и четыре
       кружка цвета в ряд (нет · тихая · марки · тёмная). Кружок показывает,
       что получится, и занимает в строке одну ширину кнопки; слайдер тут не
       годится — четыре разных цвета, а не число по шкале. Список строк — из
       каталога, блок добавили на сайте — строка появилась. */
    function tones(sub) {
      var rows = sub.fields.map(function (f) {
        var field = f[0]
        var opts = catalog.groups[field] || []
        var word = el('span', { class: 'lp-tone-word' })
        var dots = opts.map(function (o) {
          var b = el('button', { type: 'button', class: 'lp-dot', 'data-tone': o.id, 'aria-label': f[1] + ': ' + o.name, title: o.name + ' — ' + o.line }, [el('span', { class: 'lp-dot-fill', 'aria-hidden': 'true' })])
          b.addEventListener('click', function () { s.pick(field, o.id) })
          return b
        })
        groups.push({ refresh: function () {
          dots.forEach(function (b) { b.setAttribute('aria-pressed', String(names[field] === b.dataset.tone)) })
          var on = opts.find(function (o) { return o.id === names[field] })
          word.textContent = on ? on.name : ''
        } })
        return el('div', { class: 'lp-tone-row', 'data-field': field }, [el('span', { class: 'lp-tone-name', text: f[1] }), el('span', { class: 'lp-tone-dots', role: 'group', 'aria-label': f[1] + ' background' }, dots.concat([word]))])
      })
      return el('div', { class: 'lp-tones' }, rows.length ? rows : [el('p', { class: 'lp-hint', text: 'No sections yet.' })])
    }
    /* Подраздел, который стоит ещё и на странице дизайн-системы (`page` в
       choice.mjs): там — рядом со своими образцами; у палитры там же
       строитель своей палитры (И572). */
    function moved(sub) {
      var lang = location.pathname.split('/')[1] || ''
      var color = sub.id === 'color'
      return el('div', { class: 'lp-aside' }, [
        el('a', { class: 'lp-link', href: '/' + lang + '/design?t=' + sub.page, title: color ? 'Your own palette from your brand colour is built on the design system page.' : sub.name + ' is also on the design system page, next to its samples.', text: color ? 'Build your own palette →' : 'Open ' + sub.name + ' on the design system page →' }),
      ])
    }

    /* ── Действия ──────────────────────────────────────────────────────── */

    var copy = el('button', { type: 'button', class: 'lp-act lp-quiet', text: 'Copy settings' })
    copy.addEventListener('click', function () {
      var text = JSON.stringify(s.body())
      var done = function () { say('Settings copied.', text) }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { say('Copy these settings:', text) })
      else say('Copy these settings:', text)
    })
    var publish = el('button', { type: 'button', class: 'lp-act lp-main', text: 'Publish' })
    publish.addEventListener('click', function () {
      publishing = true; refresh()
      s.publish().then(function () { publishing = false; refresh() })
    })
    var stop = el('button', { type: 'button', class: 'lp-act lp-quiet', text: 'Stop preview' })
    stop.addEventListener('click', function () {
      remember(OPEN, '1')
      s.stop()
    })

    /* ── Разделы и подразделы ──────────────────────────────────────────── */

    /* Образец в раскрытой панели — копия живого блока этой страницы: те же
       классы и краски, поэтому ответ на выбор виден сразу. Копия глухая
       (inert), своего текста в ней нет. */
    var lives = []
    function live(selector, below) {
      var box = el('div', { class: 'lp-live', 'aria-hidden': 'true' })
      if (below) box.dataset.below = ''
      lives.push({ box: box, selector: selector })
      return box
    }
    function fillLives() {
      lives.forEach(function (l) {
        var src = document.querySelector(l.selector)
        if (!src) return l.box.replaceChildren()
        var copy = src.cloneNode(true)
        copy.setAttribute('inert', '')
        copy.removeAttribute('id')
        l.box.replaceChildren(copy)
      })
    }
    /* Образец формы — вещи сайта, нарисованные его ролями (`--r-*`, `--sh-*`):
       отвечает на каждый выбор, где бы тень ни стояла на странице. Кнопка —
       настоящая кнопка сайта (`siteButton`), и угол ей ставит ручка Corners рядом
       (`--r-btn`; близнец «· pill» — полный круг; заказчик 04.10.2026: «не реагируют кнопки
       на настройку панели, не меняется форма»). */
    function shapeDemo() {
      var item = function (cls, text, inner) { return el('figure', { class: 'lp-demo-item' }, [el('div', { class: 'lp-demo-obj ' + cls }, inner || []), el('figcaption', { text: text })]) }
      var button = siteButton
        ? el('figure', { class: 'lp-demo-item' }, [el('span', { class: siteButton, 'data-voice': 'loud', text: 'Add to cart' }), el('figcaption', { text: 'Button · corner from Corners' })])
        : item('lp-demo-btn', 'Button · corner from Corners', [el('span', { text: 'Add to cart' })])
      return el('div', { class: 'lp-demo', 'aria-hidden': 'true' }, [
        button,
        item('lp-demo-field', 'Field', [el('span', { text: 'Email' })]),
        item('lp-demo-card', 'Card at rest', [el('span', { text: 'Product name' })]),
        item('lp-demo-card lp-demo-lift', 'Card under the hand', [el('span', { text: 'Product name' })]),
        item('lp-demo-pop', 'Menu, popup', [el('span', { text: 'Sort by' })])
      ])
    }
    var content = function (sub) {
      return (sub.hint ? [el('p', { class: 'lp-hint', text: sub.hint })] : [])
        .concat(sub.id === 'buttons' ? [mainButton()] : [])
        .concat(sub.bands ? [tones(sub)] : [])
        .concat(sub.bands ? [] : sub.fields.filter(function (f) { return sub.id !== 'buttons' || !MAIN.some(function (m) { return m[0] === f[0] }) })
          .map(function (f) { return group(f[0], f[1]) }))
        .concat(sub.place && sub.place.sample ? [live(sub.place.sample, sub.place.below)] : [])
        .concat(sub.demo === 'shape' ? [shapeDemo()] : [])
        .concat(sub.page ? [moved(sub)] : [])
        .concat(sub.id === 'elements' ? [elements] : [])
    }
    /* Подразделы, не влезшие в ряд, уходят вбок; недоступный край растворён. */
    var fade = function (bar) {
      var start = bar.scrollLeft > 1
      var end = bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1
      if (start && end) bar.dataset.more = 'both'
      else if (start) bar.dataset.more = 'start'
      else if (end) bar.dataset.more = 'end'
      else delete bar.dataset.more
    }
    var sections = choice.sectionsOf(catalog).map(function (s) {
      var tab = el('button', { type: 'button', role: 'tab', class: 'lp-tab', id: 'lp-tab-' + s.id, 'aria-controls': 'lp-subs-' + s.id, text: s.name })
      var bar = el('div', { class: 'lp-subs', role: 'tablist', id: 'lp-subs-' + s.id, 'aria-label': s.name + ' sections' })
      var subs = s.subs.map(function (sub) {
        var b = el('button', { type: 'button', role: 'tab', class: 'lp-sub', id: 'lp-sub-' + sub.id, 'aria-controls': 'lp-pane-' + sub.id, text: sub.name })
        var pane = el('div', { role: 'tabpanel', class: 'lp-pane', id: 'lp-pane-' + sub.id, 'aria-labelledby': 'lp-sub-' + sub.id }, content(sub))
        b.addEventListener('click', function () { showSub(s.id, sub.id) })
        bar.appendChild(b)
        return { id: sub.id, tab: b, pane: pane, place: sub.place || null }
      })
      tab.addEventListener('click', function () { show(s.id) })
      bar.addEventListener('keydown', function (e) { arrows(e, subs, function (x) { showSub(s.id, x.id) }) })
      bar.addEventListener('scroll', function () { fade(bar) }, { passive: true })
      return { id: s.id, tab: tab, bar: bar, subs: subs }
    })
    function arrows(e, list, go) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      var i = list.findIndex(function (p) { return p.tab.getAttribute('aria-selected') === 'true' })
      var next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length]
      go(next); next.tab.focus()
    }
    function showSub(section, id) {
      var s = sections.find(function (x) { return x.id === section })
      s.subs.forEach(function (x) {
        var on = x.id === id
        x.tab.setAttribute('aria-selected', String(on))
        x.tab.tabIndex = on ? 0 : -1
        x.pane.hidden = !on
        if (on && x.tab.scrollIntoView) x.tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
      remember(SUB + section, id)
      if (ready) visit(s.subs.find(function (x) { return x.id === id }).place)
      if (id === 'elements') elements.load()
      middle.scrollTop = 0
      fade(s.bar)
    }
    /* Вкладка — место на сайте (choice.mjs, `place`): открыл вкладку —
       сайт переходит на её страницу и показывает её блок. Адреса страниц
       даёт сервер панели из данных магазина (`places`); оформлению он
       кладёт в пустую корзину товар образца, иначе полей не видно. Переход —
       обычной загрузкой: панель помнит, что открыта и на какой вкладке, а
       блок показывает уже на новой странице (`PLACE`). Вкладки общего вида
       места не имеют — страница остаётся та, что была. */
    var ready = false
    var PLACE = 'look-panel-place'
    function reveal(block) {
      var node = block && block !== 'body' ? document.querySelector(block) : null
      if (node) node.scrollIntoView({ block: 'start', behavior: 'smooth' })
      else if (block === 'body') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    function visit(place) {
      if (!place) return
      if (!place.page) return reveal(place.block)
      var lang = location.pathname.split('/')[1] || ''
      fetch(new URL('places?lang=' + lang, base).href, { cache: 'no-store' }).then(function (r) { return r.json() }).then(function (p) {
        var path = p[place.page]
        var go = function () {
          if (!path || location.pathname === path) return reveal(place.block)
          remember(OPEN, '1'); remember(PLACE, place.block)
          location.assign(path)
        }
        if (place.page === 'checkout') return fetch(new URL('sample-cart?lang=' + lang, base).href, { method: 'POST' }).then(go, go)
        go()
      }, function () { /* адресов нет — остаёмся на странице */ })
    }
    function show(id) {
      sections.forEach(function (s) {
        var on = s.id === id
        s.tab.setAttribute('aria-selected', String(on))
        s.tab.tabIndex = on ? 0 : -1
        s.bar.hidden = !on
        if (!on) s.subs.forEach(function (x) { x.pane.hidden = true })
      })
      var s = sections.find(function (x) { return x.id === id })
      var want = recall(SUB + id)
      showSub(id, s.subs.some(function (x) { return x.id === want }) ? want : s.subs[0].id)
      remember(TAB, id)
    }
    var tabs = el('div', { class: 'lp-tabs', role: 'tablist', 'aria-label': 'Look sections' }, sections.map(function (s) { return s.tab }))
    tabs.addEventListener('keydown', function (e) { arrows(e, sections, function (x) { show(x.id) }) })

    var close = el('button', { class: 'lp-x', type: 'button', popovertarget: 'lp-panel', popovertargetaction: 'hide', 'aria-label': 'Close' }, [icon(CROSS, 16)])
    /* Развернуть — панель широкая, варианты крупными образцами; свернуть —
       обратно в 360. На телефоне развёрнутая — шторка во всю высоту. Панель
       остаётся немодальной: страница под ней живая, изменения видны сразу. */
    var widen = el('button', { class: 'lp-widen', type: 'button', 'aria-controls': 'lp-panel' })
    function wide(on) {
      if (on) buildBig()
      panel.toggleAttribute('data-wide', on)
      widen.setAttribute('aria-label', on ? 'Collapse the panel' : 'Expand the panel')
      widen.replaceChildren(icon(on ? SHRINK : GROW, 14), el('span', { text: on ? 'Collapse' : 'Expand' }))
      widen.title = on ? 'Back to the narrow panel' : 'Show every option large, on the page and on the dark band'
      keepWide(on)
      sections.forEach(function (s) { fade(s.bar) })
    }
    widen.addEventListener('click', function () { wide(!panel.hasAttribute('data-wide')) })
    var move = el('button', { class: 'lp-widen lp-move', type: 'button', 'aria-controls': 'lp-panel' })
    function side(start) {
      panel.toggleAttribute('data-start', start)
      move.setAttribute('aria-label', start ? 'Move the panel to the right' : 'Move the panel to the left')
      move.title = start ? 'Move to the right edge' : 'Move to the left edge'
      move.replaceChildren(icon(start ? TO_END : TO_START, 14))
      keepSide(start)
    }
    move.addEventListener('click', function () { side(!panel.hasAttribute('data-start')) })
    var middle = el('div', { class: 'lp-body' }, sections.flatMap(function (s) { return s.subs.map(function (x) { return x.pane }) }))
    var panel = el('div', { id: 'lp-panel', class: 'lp-panel', popover: 'manual', role: 'region', 'aria-label': 'Look' }, [
      el('div', { class: 'lp-top' }, [el('div', { class: 'lp-head' }, [el('p', { class: 'lp-title', text: 'Look' }), tabs, move, widen, close])].concat(sections.map(function (s) { return s.bar }))),
      middle,
      el('div', { class: 'lp-foot' }, [
        el('div', { class: 'lp-acts' }, [publish, copy, stop]),
        el('p', { class: 'lp-note', text: 'Publishing runs the site check on this combination first.' }),
        status,
      ]),
    ])
    /* Вход в панель — полоса «Look» у низа окна со своим местом (look.css,
       «Полоса «Look»», И354): видна с любого места страницы, страница держит
       место под неё сама (резерв нижней полосы), ни одна сумма под ней не
       прячется. В полосе одна цель у её конца, по своему содержимому:
       «Look», выбор словами, «Open». Открытая панель стоит на полосе, и та
       же цель её закрывает («Close»). */
    var bandWords = el('span', { class: 'lp-band-words' })
    var bandDraft = el('span', { class: 'lp-band-draft', text: 'Draft', hidden: true })
    var bandAct = el('span', { class: 'lp-band-act' })
    var bandBtn = el('button', { class: 'lp-band-btn', type: 'button', popovertarget: 'lp-panel', 'aria-expanded': 'false' }, [
      icon(SLIDERS, 16), el('span', { class: 'lp-band-name', text: 'Look' }), bandWords, bandDraft, bandAct,
    ])
    var band = el('div', { class: 'lp-band' }, [bandBtn])
    bandSync = function () {
      var open = bandBtn.getAttribute('aria-expanded') === 'true'
      var words = s.words()
      bandWords.textContent = words
      bandDraft.hidden = !s.drafting
      bandAct.replaceChildren(el('span', { text: open ? 'Close' : 'Open' }), icon(UP, 14))
      bandBtn.setAttribute('aria-label', 'Look: ' + words + (s.drafting ? ', draft' : '') + '. ' + (open ? 'Close' : 'Open') + ' the panel')
    }
    document.body.appendChild(el('div', { class: 'lp' }, [band, panel]))
    wide(keptWide())
    side(keptSide())
    show(recall(TAB) === 'admin' ? 'admin' : 'system')
    ready = true
    fillLives()
    var arrived = recall(PLACE)
    if (arrived) { remember(PLACE, null); setTimeout(function () { reveal(arrived) }, 300) }
    s.on(function (what, d) { if (what === 'say') say(said[d.code] || d.code, d.detail); else refresh() })
    refresh()
    panel.addEventListener('toggle', function (e) {
      remember(OPEN, e.newState === 'open' ? '1' : null)
      bandBtn.setAttribute('aria-expanded', String(e.newState === 'open'))
      bandSync()
      if (e.newState === 'open') sections.forEach(function (s) { fade(s.bar) })
    })
    addEventListener('resize', later(function () { sections.forEach(function (s) { fade(s.bar) }) }, 100))
    if (recall(OPEN) === '1' && panel.showPopover) panel.showPopover()
    root.dataset.lookPanel = 'ready'
  }

  /* Состояние выбора — общее со страницей дизайн-системы (studio.mjs): тот
     же адрес модуля — тот же объект на странице. */
  Promise.all([import(new URL('studio.mjs', base).href), import(new URL('choice.mjs', base).href), import(new URL('swatch.mjs', base).href)])
    .then(function (m) { return m[0].studio().then(function (s) { build(s, m[0].later, m[1], m[0].SAID, m[2].paletteSample) }) }).catch(function (e) { if (window.console) console.warn('look panel:', e) })
})()
