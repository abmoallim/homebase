import { connection } from "next/server";
import { finishSetup } from "./actions";
import TzField from "./TzField";

const inp = "w-full bg-[rgba(255,255,255,0.03)] border border-line rounded-xl px-3 py-2 text-[14px] outline-none focus:border-brass";
export default async function Setup() {
  await connection();
  return (
    <div className="max-w-3xl space-y-6">
      <div><div className="eyebrow">Welcome to Homebase</div><h1 className="serif text-[52px] leading-none mt-2">Let's set you up</h1>
        <p className="text-muted mt-3">One minute. This fills in your vault (the notes Homebase reads) and you can change everything later in Obsidian. Leave anything blank to skip it.</p></div>
      <form action={finishSetup} className="panel p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block"><span className="eyebrow">Your name</span><input name="name" className={inp + " mt-1"} placeholder="Sam" /></label>
          <TzField />
        </div>
        <label className="block"><span className="eyebrow">One line about you or what you're building</span><input name="tagline" className={inp + " mt-1"} placeholder="Building a design studio and a newsletter." /></label>
        <div className="grid sm:grid-cols-4 gap-4">
          <label className="block sm:col-span-2"><span className="eyebrow">Main goal</span><input name="goal" className={inp + " mt-1"} placeholder="Monthly revenue" /></label>
          <label className="block"><span className="eyebrow">Target</span><input name="target" type="number" className={inp + " mt-1"} placeholder="5000" /></label>
          <label className="block"><span className="eyebrow">Unit · label</span><div className="flex gap-2 mt-1"><input name="unit" className={inp + " !w-14"} placeholder="$" /><input name="short" className={inp} placeholder="MRR" /></div></label>
        </div>
        <div className="space-y-3">
          <div className="eyebrow">Your top focus areas (projects, businesses, goals), most important first</div>
          {[1, 2, 3].map(i => (
            <div key={i} className="grid sm:grid-cols-12 gap-2 items-center">
              <span className="text-faint font-mono text-sm sm:col-span-1">P{i}</span>
              <input name={`area${i}`} className={inp + " sm:col-span-3"} placeholder="Name" />
              <input name={`kpi${i}`} className={inp + " sm:col-span-4"} placeholder="What success looks like" />
              <input name={`t${i}`} type="number" className={inp + " sm:col-span-2"} placeholder="Target share" />
              <input name={`need${i}`} type="number" className={inp + " sm:col-span-2"} placeholder="Clients needed" />
            </div>
          ))}
        </div>
        <button className="rounded-full bg-brass text-[#06110c] font-medium px-6 py-2.5 text-[14px]">Create my Homebase</button>
      </form>
    </div>
  );
}
