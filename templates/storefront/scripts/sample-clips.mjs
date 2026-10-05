/* Ролики видеоотзывов образца (И728) — из снимков полок образца, без съёмки
   и без скачивания.

   Список роликов, их кадр и постер — lib/source/sample/review-clips.ts (один
   список на файлы и на адреса). Ролик — немой медленный наплыв (масштаб 1 →
   1,08 за 7 с) на середину снимка, вырезанную в 2 : 3; постер — первый кадр,
   оригиналом и копиями по ширинам. Кадры режет sharp (приходит с Next),
   склеивает ffmpeg: из PATH, из `FFMPEG` или тот, что ставит Playwright
   (`ms-playwright/ffmpeg-*`): у него есть только VP8 и WebM — отсюда .webm.

     node scripts/sample-clips.mjs [корень витрины]

   Корень по умолчанию — папка над scripts/; запуск из .storefront с корнем
   ../templates/storefront пишет файлы в шаблон. */
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CLIPS, CLIP, POSTER } from '../lib/source/sample/review-clips.ts'

const ROOT = process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url))
const FROM = join(ROOT, 'public/sample/shelves')
const TO = join(ROOT, 'public/sample/reviews')

function ffmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg'
  const home = join(process.env.LOCALAPPDATA ?? join(process.env.HOME ?? '', '.cache'), 'ms-playwright')
  const dir = existsSync(home) ? readdirSync(home).find((d) => d.startsWith('ffmpeg-')) : undefined
  const exe = dir && readdirSync(join(home, dir)).find((f) => f.startsWith('ffmpeg'))
  if (!exe) throw new Error('sample-clips: ffmpeg не найден (PATH, FFMPEG или Playwright)')
  return join(home, dir, exe)
}

/** Вырез 2 : 3 из середины снимка при наплыве `zoom`. */
function cut(width, height, zoom) {
  const h0 = Math.min(height, (width * CLIP.height) / CLIP.width)
  const w0 = (h0 * CLIP.width) / CLIP.height
  const w = Math.round(w0 / zoom)
  const h = Math.round(h0 / zoom)
  return { left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h }
}

{
  const { default: sharp } = await import('sharp')
  const exe = ffmpeg()
  mkdirSync(TO, { recursive: true })
  for (const [clip, shelf] of Object.entries(CLIPS)) {
    const file = join(FROM, `${shelf}.jpg`)
    const { width = 0, height = 0 } = await sharp(file).metadata()
    const still = sharp(file).extract(cut(width, height, 1))
    await still.clone().resize(POSTER.width, POSTER.height).webp({ quality: 78 }).toFile(join(TO, `${clip}.webp`))
    for (const w of POSTER.cuts) await still.clone().resize(w, Math.round((w * POSTER.height) / POSTER.width)).webp({ quality: 78 }).toFile(join(TO, `${clip}-${w}.webp`))
    const frames = CLIP.seconds * CLIP.fps
    const out = join(TO, `${clip}.webm`)
    const enc = spawn(exe, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(CLIP.fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
      '-c:v', 'libvpx', '-b:v', '700k', '-crf', '12', '-auto-alt-ref', '0', '-an', out], { stdio: ['pipe', 'inherit', 'inherit'] })
    const done = new Promise((ok, fail) => enc.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg: ${code}`)))))
    for (let i = 0; i < frames; i++) {
      const zoom = 1 + 0.08 * (i / (frames - 1))
      const jpg = await sharp(file).extract(cut(width, height, zoom)).resize(CLIP.width, CLIP.height).jpeg({ quality: 88 }).toBuffer()
      if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r))
    }
    enc.stdin.end()
    await done
    console.log(`sample-clips: ${clip} ← ${shelf}.jpg`)
  }
}
