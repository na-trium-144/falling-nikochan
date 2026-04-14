import { ReactNode } from "react";

let renderAll = false;

export function MDXRenderAll({ children }: { children: ReactNode }) {
  // eslint-disable-next-line react-hooks/globals
  renderAll = true;
  return <>{children}</>;
}

export function Hidden({ children }: { children: ReactNode }) {
  if (renderAll) {
    // eslint-disable-next-line react-hooks/globals
    renderAll = false;
    return <>{children}</>;
  }
  return null;
}
