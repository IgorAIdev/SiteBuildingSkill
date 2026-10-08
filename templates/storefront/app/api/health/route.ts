/* Жив ли сайт — для проверки здоровья контейнера (Coolify, `healthcheck` в compose):
   ответ без похода в движок, чтобы медленный каталог не делал витрину «больной». */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ ok: true })
}
