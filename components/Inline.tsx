import Link from "next/link";
import { resolve, noteHref } from "@/lib/vault";

/** Renders a single line of Obsidian text: [[links]] become app links, **bold** stays bold. */
export default function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      const n = resolve(m[1]); const label = m[2] || m[1].split("/").pop()!.replace(/\.(md|canvas|base)$/, "");
      parts.push(n ? <Link key={k++} href={noteHref(n)} className="text-brass hover:underline underline-offset-4">{label}</Link> : <span key={k++}>{label}</span>);
    } else parts.push(<strong key={k++} className="text-[#fffaf0] font-semibold">{m[3]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
