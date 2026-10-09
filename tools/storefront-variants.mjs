import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Named previews have separate runtime files, published looks, drafts and caches. */
export function storefrontVariant(kit, args) {
  const at = args.indexOf('--variant')
  if (at < 0) return { site: join(kit, '.storefront'), showcase: join(kit, 'showcase'), port: '3020' }
  const name = args[at + 1]
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('--variant: укажите имя варианта, например minimal')
  const showcase = join(kit, 'showcase', 'variants', name)
  if (!existsSync(join(showcase, 'look.json'))) throw new Error(`Нет варианта «${name}» в showcase/variants/`)
  return { site: join(kit, `.storefront-${name}`), showcase, port: '3021' }
}
