import { redirect } from "next/navigation";
import { today } from "@/lib/vault";
export default function Day() { redirect(`/day/${today()}`); }
