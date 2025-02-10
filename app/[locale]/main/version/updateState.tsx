"use client";

import { updateLastVisited } from "@/common/version";
import { useEffect } from "react";

export function UpdateVersionState() {
  useEffect(() => updateLastVisited(), []);
  return null;
}
