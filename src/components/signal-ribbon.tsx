const SIGNALS = ["Intent", "Context", "Boundary", "Agent work", "Human gate", "Evidence"] as const;

function SignalSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="signal-ribbon-set" aria-hidden={duplicate || undefined}>
      {SIGNALS.map((signal, index) => (
        <span key={signal}>
          <i aria-hidden="true">0{index + 1}</i>
          {signal}
        </span>
      ))}
    </div>
  );
}

export function SignalRibbon() {
  return (
    <aside className="signal-ribbon" aria-label="Akrithos controlled AI path: intent, context, boundary, agent work, human gate, and evidence">
      <p className="sr-only">Intent. Context. Boundary. Agent work. Human gate. Evidence.</p>
      <div className="signal-ribbon-track" data-testid="signal-ribbon-track">
        <SignalSet />
        <SignalSet duplicate />
      </div>
    </aside>
  );
}
