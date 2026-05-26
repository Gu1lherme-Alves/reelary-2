import { b as h } from "./button-BCDv24mv.js";
import { h as e, s as o } from "./index-CDMAuvnc.js";
const p = [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
        key: "1s2grr",
      },
    ],
    ["path", { d: "M20 2v4", key: "1rf3ol" }],
    ["path", { d: "M22 4h-4", key: "gwowj6" }],
    ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }],
  ],
  f = h("sparkles", p);
function k() {
  const [r, t] = e.useState(null),
    [u, a] = e.useState(null),
    [l, c] = e.useState(!0);
  return (
    e.useEffect(() => {
      const {
        data: { subscription: i },
      } = o.auth.onAuthStateChange((s, n) => {
        (t(n), a(n?.user ?? null));
      });
      return (
        o.auth.getSession().then(({ data: { session: s } }) => {
          (t(s), a(s?.user ?? null), c(!1));
        }),
        () => i.unsubscribe()
      );
    }, []),
    { session: r, user: u, loading: l }
  );
}
export { f as S, k as u };
