import { ReactNode } from "react";

let renderAll = false;

export function MDXRenderAll({ children }: { children: ReactNode }) {
  renderAll = true;
  return <>{children}</>;
}

export function Hidden({ children }: { children: ReactNode }) {
  if (renderAll) {
    renderAll = false;
    return <>{children}</>;
  }
  return null;
}
