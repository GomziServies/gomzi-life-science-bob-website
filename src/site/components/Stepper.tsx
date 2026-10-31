const STEPS = ['Products', 'Your details', 'Pick labels', 'Send inquiry'];

/** Where the customer is in the order: 1 products, 2 details, 3 design, 4 review and pay. */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="stepper" aria-label="Order progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'todo';
        return (
          <li key={label} className={`step ${state}`} aria-current={state === 'now' ? 'step' : undefined}>
            <span className="dot">{state === 'done' ? '✓' : n}</span>
            <span className="lbl">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
