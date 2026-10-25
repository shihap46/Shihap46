// Remounts on every navigation; the page fades in underneath the column wipe (components/site/PageTransition.tsx).
// Opacity only — transforming the page itself would throw off #hash scrolling.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
