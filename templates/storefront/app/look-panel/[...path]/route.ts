// look-panel — единственный вход панели вида в дерево маршрутов (look-panel/PANEL.md).
// Открыт, только пока LOOK_PICKER=on; `npm run look:remove` удаляет этот файл вместе с папкой look-panel/.
import { handle } from '@/look-panel/routes/index.ts'
import { inRequestSite } from '@/lib/request-site.ts'

type Context = { params: Promise<{ path: string[] }> }
const route = async (request: Request, { params }: Context) =>
  /* Панель — вид сайта запроса (lib/request-site.ts). */
  process.env.LOOK_PICKER === 'on' ? inRequestSite(async () => handle(request, (await params).path)) : new Response(null, { status: 404 })

export const GET = route
export const POST = route
export const DELETE = route
