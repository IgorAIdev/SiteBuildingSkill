import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import { Part } from './parts.tsx'
import s from './design.module.css'

/* Перечень источников — внизу страницы дизайн-системы (слово заказчика
   02.10.2026: «завести внизу страницы типа перечень литературы»). Что взято
   у кого и на каких условиях: знаки, шрифты, исследования, на которых стоят
   пороги и правила набора (`research/site-building-2026-09-20/raw/sources`).
   Новый знак чужого набора — строка здесь и в `LICENSE` рядом со знаком. */
type Source = [name: string, what: string, terms: string, href: string]

const GROUPS: { title: string; sources: Source[] }[] = [
  { title: 'Знаки', sources: [
    ['Lucide', 'основа листа знаков: линейные знаки сайта и их залитые силуэты', 'ISC', 'https://lucide.dev'],
    ['Tabler Icons', 'знак «магазин · здание» (building-store)', 'MIT', 'https://tabler.io/icons'],
    ['Heroicons', 'знак «магазин · витрина» (building-storefront)', 'MIT', 'https://heroicons.com'],
    ['Simple Icons', 'логотипы мессенджеров, соцсетей и платёжных систем', 'CC0', 'https://simpleicons.org'],
    ['Лист значков cbdin.bg', 'семь знаков: главная, кабинет, избранное, тележка, корзинка, пакет и магазин с навесом — линией', 'Рисунки заказчика', 'https://cbdin.bg'],
  ] },
  { title: 'Готовые компоненты — образцы', sources: [
    ['HyperUI', 'блоки на Tailwind: кнопки, группы кнопок, аккордеоны, корзины, значки, поля; берём устройство, вид рисуем свой', 'MIT', 'https://www.hyperui.dev'],
    ['Uiverse', 'кнопки, переключатели, карточки и поля от сообщества; лицензия у каждого образца — проверять при взятии', 'MIT, проверять на образце', 'https://uiverse.io'],
    ['shadcn/ui', 'устройство и состояния доступных компонентов: окно, меню, переключатель, аккордеон', 'MIT', 'https://ui.shadcn.com'],
    ['Radix Themes и Radix Primitives', 'как устроены окно, меню, вкладки и переключатель без вида', 'MIT', 'https://www.radix-ui.com'],
    ['daisyUI', 'готовые названия частей и состояния: шаги, полоса прогресса, значок, скелетон', 'MIT', 'https://daisyui.com'],
    ['Flowbite', 'блоки торгового сайта и формы на Tailwind', 'MIT', 'https://flowbite.com'],
    ['Preline UI', 'формы, шаги, аккордеоны и их доступность', 'MIT', 'https://preline.co'],
    ['Headless UI', 'поведение выпадающих списков, окон и вкладок для клавиатуры и чтеца', 'MIT', 'https://headlessui.com'],
    ['Meraki UI', 'свободные блоки на Tailwind: карточки, кнопки, формы; лицензию проверять при взятии', 'проверять на образце', 'https://merakiui.com'],
  ] },
  { title: 'Шрифты', sources: [
    ['Google Fonts', 'шрифты вида: Manrope и другие семейства из панели Look', 'SIL Open Font License', 'https://fonts.google.com'],
  ] },
  { title: 'Исследования и нормы', sources: [
    ['Material Design 3 — States', 'наведение и нажатие вуалью поверх заливки: доли состояния, фокус кольцом', 'Google', 'https://m3.material.io/foundations/interaction/states'],
    ['Apple Human Interface Guidelines — Pointer', 'виды ответа указателю: подсветка, подъём, наведение', 'Apple', 'https://developer.apple.com/design/human-interface-guidelines/pointing-devices'],
    ['WCAG 2.2', 'контраст 4.5 : 1 и 3 : 1, цель нажатия, масштаб текста', 'W3C', 'https://www.w3.org/TR/WCAG22/'],
    ['APCA', 'второй замер контраста краски на краске', 'Myndex', 'https://github.com/Myndex/apca-w3'],
    ['OKLab', 'цветовое пространство ступеней палитры', 'Björn Ottosson', 'https://bottosson.github.io/posts/oklab/'],
    ['Utopia', 'шкала размеров, плавно меняющихся с шириной', 'Clearleft', 'https://utopia.fyi'],
    ['Baymard Institute', 'исследования покупательского пути: карточка, корзина, оформление', 'Baymard', 'https://baymard.com/research'],
    ['Nielsen Norman Group', 'правила юзабилити: иерархия, формы, навигация', 'NN/g', 'https://www.nngroup.com'],
    ['Material Design 3', 'состояния, цели, выбор по голосу кнопки', 'Google', 'https://m3.material.io'],
    ['Apple Human Interface Guidelines', 'размер цели под пальцем, отклик на нажатие', 'Apple', 'https://developer.apple.com/design/human-interface-guidelines'],
    ['Radix Colors', 'двенадцать ступеней на краску и их роли; ступени органа: покой, наведение, нажатие', 'MIT', 'https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale'],
    ['Material Design 3 — Elevation', 'тени по работе: уровни, тень только у висящего над страницей', 'Google', 'https://m3.material.io/styles/elevation/overview'],
    ['Shopify Polaris', 'устройство торгового интерфейса', 'Shopify', 'https://polaris.shopify.com'],
    ['Carbon · Atlassian · Primer · Spectrum · Geist', 'как крупные системы называют и делят роли', 'IBM · Atlassian · GitHub · Adobe · Vercel', 'https://carbondesignsystem.com'],
    ['Open Props · Tailwind CSS', 'сверка токенов и шкал', 'MIT', 'https://open-props.style'],
    ['MDN Web Docs', 'как работают dialog, popover, контейнерные запросы', 'Mozilla', 'https://developer.mozilla.org'],
  ] },
]

export function Sources() {
  return (
    <Part title="Источники" lede="Что на странице и в наборе взято у кого и на каких условиях: знаки, шрифты и исследования, на которых стоят пороги и правила. Новый чужой знак записывается сюда и в файл лицензии рядом со знаком.">
      {GROUPS.map(({ title, sources }) => (
        <div key={title} className={s.group}>
          <h3>{title}</h3>
          <ul className={`${p.stack} ${s.sources}`}>
            {sources.map(([name, what, terms, href]) => (
              <li key={name} className={p.note}>
                <a className={go.go} href={href} target="_blank" rel="noopener noreferrer">{name}</a>
                <span> — {what}. {terms}.</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Part>
  )
}
