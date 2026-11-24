import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { toMarkdown } from "@/lib/vault";

export default function Md({ body }: { body: string }) {
  return (
    <div className="prose-vault">
      <ReactMarkdown remarkPlugins={[remarkGfm]}
        components={{ a: ({ href = "", children }) => href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>
        {toMarkdown(body)}
      </ReactMarkdown>
    </div>
  );
}
