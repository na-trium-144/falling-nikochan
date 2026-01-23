"use client";

import clsx from "clsx/lite";
import { useEffect, useState } from "react";
import "@/styles/key.scss";
import { useTheme } from "./theme";

interface KeyProps {
  children: string;
  handleKeyDown?: boolean;
}
export function Key(props: KeyProps) {
  const { isDark } = useTheme();
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (props.handleKeyDown) {
      let targetKey: string[];
      switch (props.children.toLowerCase()) {
        case "space":
          targetKey = [" "];
          break;
        case "esc":
          targetKey = ["escape", "esc"];
          break;
        case "pagedn":
          targetKey = ["pagedown"];
          break;
        case "←":
          targetKey = ["arrowleft", "left"];
          break;
        case "→":
          targetKey = ["arrowright", "right"];
          break;
        default:
          targetKey = [props.children.toLowerCase()];
          break;
      }
      const keydown = (e: KeyboardEvent) => {
        if (targetKey.includes(e.key.toLowerCase())) {
          setActive(true);
        }
      };
      const keyup = (e: KeyboardEvent) => {
        if (targetKey.includes(e.key.toLowerCase())) {
          setActive(false);
        }
      };
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      return () => {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
      };
    }
  }, [props.children, props.handleKeyDown]);
  return (
    <a
      className={clsx(
        "kbc-button no-container kbc-button-xxs",
        isDark ? "kbc-button-dark" : "kbc-button-light",
        active ? "active" : "disabled",
        "align-top m-0!"
      )}
    >
      <kbd>{props.children}</kbd>
    </a>
  );
}
