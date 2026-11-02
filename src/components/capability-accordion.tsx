const capabilities = [
  {
    number: "01",
    title: "Agents for every seat in the business",
    body: "An always-on workforce across voice, chat, pipeline, executive assistance, and operations. Agents qualify, route, follow up, and hand to a person when the workflow calls for it.",
  },
  {
    number: "02",
    title: "Living interfaces",
    body: "Interactive avatars, on-screen support, kiosks, holographic experiences, and branded multilingual spokespersons grounded in your knowledge base.",
  },
  {
    number: "03",
    title: "Digital twins and knowledge",
    body: "Digital twins of founders and senior operators, grounded RAG systems, internal copilots, and codified institutional processes.",
  },
  {
    number: "04",
    title: "Industry-grade systems",
    body: "Financial automation, healthcare and government systems, regional hosting, compact AI hardware, encrypted resilience, and jurisdiction-aware controls.",
  },
  {
    number: "05",
    title: "Productized platforms",
    body: "Expertise-to-SaaS products, custom media and audience platforms, recurring-revenue systems, and end-to-end brand activations.",
  },
] as const;

export function CapabilityAccordion() {
  return (
    <div className="mt-7 border-t border-stone-400">
      {capabilities.map((item, index) => (
        <details key={item.number} open={index === 0} className="group border-b border-stone-400">
          <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-center gap-4 py-5 font-display text-h3 font-semibold">
            <span className="font-mono text-overline font-normal text-bronze">{item.number}</span>
            {item.title}
            <span aria-hidden="true" className="text-terracotta group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-copy pb-6 pl-7 text-stone-600 sm:pl-9">{item.body}</p>
        </details>
      ))}
    </div>
  );
}
