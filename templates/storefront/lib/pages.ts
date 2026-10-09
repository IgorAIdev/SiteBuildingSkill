import { LOCALES, type Lang } from './locale.ts'
import type { Block, Image } from './source/contract.ts'
import { scene } from './source/sample/art.ts'
import copy from './content/home-copy.json' with { type: 'json' }

type SamplePage = { title: Record<Lang, string>; description: Record<Lang, string>; blocks: Record<Lang, Block[]> }
const HERO: Image = { src: scene(), alt: '', width: 1600, height: 1000 }
// Product references are sample data. The Vendure content adapter resolves
// these shelves to the real catalogue without duplicating the editorial copy.
const OILS = ['ulei-cbd-full-spectrum', 'ulei-cbd-izolat-10', 'ulei-cbd-5-incepatori', 'ulei-cbd-20-seara', 'ulei-cbd-30-forte']
const CAPSULES = ['capsule-cbd-25', 'capsule-cbd-10']
const FEATURED = ['ulei-cbd-full-spectrum', 'capsule-cbd-25', 'crema-cbd', 'ulei-caini-cbd']
const localized = <T,>(read: (lang: Lang) => T): Record<Lang, T> => Object.fromEntries(LOCALES.map((lang) => [lang, read(lang)])) as Record<Lang, T>

export const PAGES: Record<string, SamplePage> = {
  home: {
    title: localized((lang) => copy[lang].title),
    description: localized((lang) => copy[lang].description),
    blocks: localized((lang): Block[] => {
      const words = copy[lang]
      return [
        { type: 'hero', ...words.hero, image: HERO, shelves: 'all' },
        { type: 'effects', ...words.effects },
        { type: 'featured', ...words.oils, ids: OILS, to: 'uleiuri' },
        { type: 'featured', ...words.capsules, ids: CAPSULES, to: 'capsule' },
        { type: 'featured', ...words.featured, ids: FEATURED },
        { type: 'reviews', ...words.reviews, all: null },
        { type: 'posts', ...words.posts },
        { type: 'faq', ...words.faq },
      ]
    }),
  },
}
