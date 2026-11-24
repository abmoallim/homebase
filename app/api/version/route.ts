import { latestMtime } from "@/lib/vault";
export const dynamic = "force-dynamic";
export function GET() { return Response.json({ v: latestMtime() }); }
