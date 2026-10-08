import type { Lang } from '@/lib/locale.ts'
import type { ShopCopy } from '@/lib/content/shop-copy.ts'
import { hrefFor } from '@/lib/href.ts'
import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import d from './DocView.module.css'
import { Faq } from './blocks/Faq.tsx'
import s from './CatalogCopy.module.css'

/* Ссылки без своих у страницы — общие две; свои пишет текст страницы (`links`), словами запроса цели. */
const LINKS = {
  en: { lab: 'How to read a lab report', all: 'Compare all products' },
  ro: { lab: 'Cum citiți un buletin de analiză', all: 'Comparați toate produsele' },
  hu: { lab: 'A laborjegyzőkönyv értelmezése', all: 'Minden termék összehasonlítása' },
}

/** Below the products, inside the catalogue's main landmark. Reuses the
 * site's prose and FAQ so selection controls and the first screen stay intact. */
export function CatalogCopy({ copy, lang }: { copy: ShopCopy; lang: Lang }) {
  return (
    <div className={s.copy} data-catalog-copy>
      <div className={`${p.prose} ${p.stack} ${p.section} ${d.parts}`}>
        {copy.sections.map((section) => (
          <section key={section.heading} className={d.part}>
            <div className={p.stack}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
        <div className={p.cluster}>
          {copy.links
            ? copy.links.map((link) => <a key={link.label} className={go.go} href={hrefFor(lang, link.to)}>{link.label}</a>)
            : <>
              <a className={go.go} href={hrefFor(lang, { doc: 'analize-de-laborator' })}>{LINKS[lang].lab}</a>
              <a className={go.go} href={hrefFor(lang, { catalog: true })}>{LINKS[lang].all}</a>
            </>}
          {copy.sources?.map((source) => <a key={source.url} className={go.go} href={source.url}>{source.label}</a>)}
        </div>
      </div>
      <Faq block={{ type: 'faq', ...copy.faq }} place={{ air: null }} inset />
    </div>
  )
}
