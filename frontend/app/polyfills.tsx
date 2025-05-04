"use client";
import "core-js/features/string/replace-all";
import "core-js/features/array/to-reversed";
import "core-js/features/array/find-last-index";
import { ReactNode } from "react";

export function PolyfillProvider(props: { children: ReactNode }) {
  return props.children;
}
