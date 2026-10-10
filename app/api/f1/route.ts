import { fetchF1Report } from '@/lib/f1-data';
export async function GET() {
  try { return Response.json(await fetchF1Report()); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 503 }); }
}
