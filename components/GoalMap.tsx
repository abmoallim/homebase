import { toMarkdown } from "@/lib/vault";
import GoalMapView from "./GoalMapView";

/** Server wrapper: turns a .canvas file into nodes with app links, then hands it to the interactive view. */
export default function GoalMap({ raw }: { raw: string }) {
  let data: any = { nodes: [], edges: [] };
  try { data = JSON.parse(raw); } catch { /* empty */ }
  const nodes = (data.nodes || []).map((n: any) => ({ ...n, text: toMarkdown(n.text || (n.file ? `[[${n.file}]]` : "")) }));
  return <GoalMapView nodes={nodes} edges={data.edges || []} />;
}
