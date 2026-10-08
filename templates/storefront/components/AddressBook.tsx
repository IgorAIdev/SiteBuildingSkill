import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import s from './Account.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { AddressBookView } from '@/lib/account-view.ts'
import { removeAddress, saveAddress } from '@/lib/actions/account.ts'
import { RecapLines } from './OrderReview.tsx'
import { AddressEdit } from './AddressEdit.tsx'
import { Icon } from './Icon.tsx'

/* Адреса кабинета (И771) — столбиком мерой строки формы: адрес карточкой,
   строками конверта, «адрес по умолчанию» словом, «изменить» и «удалить»
   тихими словами под ним; правка встаёт на место адреса. Новый адрес —
   кнопкой внизу; адресов нет — форма открыта сразу. `landmark={false}` —
   образцом в дизайн-системе, у которой свой `main`. */
export function AddressBook({ lang, view, permalink, landmark = true }: { lang: Lang; view: AddressBookView; permalink: string; landmark?: boolean }) {
  const save = saveAddress.bind(null, lang)
  const Main = landmark ? 'main' : 'div'
  return (
    <Main id={landmark ? 'main' : undefined} className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={`${p.stack} ${s.book}`}>
        <div className={p.pagehead}>
          <h1>{view.title}</h1>
          <p>{view.lede}</p>
        </div>
        {view.cards.length ? (
          <ul className={s.cards}>
            {view.cards.map((card) => (
              <li key={card.id} className={s.card}>
                {card.editing ? <AddressEdit form={card.edit.form} action={save} permalink={permalink} cancel={view.cancel} /> : (
                  <>
                    <RecapLines lines={card.lines} />
                    {card.isDefault ? <p className={s.mark}>{view.mark}</p> : null}
                    <div className={s.acts}>
                      <a className={`${b.word} ${p.tap}`} href={card.edit.href} aria-label={card.edit.aria}>{card.edit.label}</a>
                      <form action={removeAddress.bind(null, lang)}>
                        <input type="hidden" name="id" value={card.id} />
                        <button className={`${b.word} ${p.tap}`} type="submit" aria-label={card.remove.aria}>{card.remove.label}</button>
                      </form>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        {view.add.open ? (
          <section className={s.card} aria-labelledby="add-title">
            <h2 id="add-title">{view.add.label}</h2>
            <AddressEdit form={view.add.form} action={save} permalink={permalink} cancel={view.cards.length ? view.cancel : null} />
          </section>
        ) : (
          <div className={p.cluster}><a className={b.btn} href={view.add.href}><Icon id="plus" />{view.add.label}</a></div>
        )}
        {/* Ряд, а не строка: ссылка со знаком первым садится в строке блока по низу знака,
            и строка добавляла под ней 4 px — у подвала воздух 74 против 69 (замер 06.10.2026, И738). */}
        <div className={p.cluster}><a className={`${go.go} ${p.tap}`} data-to="back" href={view.back.href}><Icon id="arrow-left" />{view.back.label}</a></div>
      </div>
    </Main>
  )
}
