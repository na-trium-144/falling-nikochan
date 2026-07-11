"use client";

import { useEffect, useState } from "react";
import Input from "./input";

// import { evaluate } from "mathjs";
// lazy load mathjs because it's heavy

interface MathInputProps {
  className?: string;
  actualValue: string;
  updateValue: (v: string) => void;
  isValid: (v: string) => boolean;
  disabled?: boolean;
}
export default function MathInput(props: MathInputProps) {
  const [evaluate, setEvaluate] = useState<
    null | typeof import("mathjs").evaluate
  >(null);
  useEffect(() => {
    (async () => {
      const { evaluate } = await import("mathjs");
      setEvaluate(() => evaluate);
    })();
  }, []);

  if (evaluate) {
    const evalMath = (value: string): number => {
      try {
        const result = evaluate(value);
        if (typeof result === "number" && isFinite(result)) return result;
        return NaN;
      } catch {
        return NaN;
      }
    };

    const mathIsValid = (raw: string): boolean => {
      const evaluated = evalMath(raw);
      if (isNaN(evaluated)) return false;
      return props.isValid(evaluated.toString());
    };

    const mathUpdateValue = (raw: string): void => {
      const evaluated = evalMath(raw);
      if (!isNaN(evaluated)) {
        props.updateValue(evaluated.toString());
      }
    };

    return (
      <Input
        className={props.className}
        actualValue={props.actualValue}
        updateValue={mathUpdateValue}
        isValid={mathIsValid}
        disabled={props.disabled}
      />
    );
  } else {
    // mathjsの読み込みが完了するまでの間は、一旦disabled
    return (
      <Input
        className={props.className}
        actualValue={props.actualValue}
        updateValue={() => undefined}
        disabled={true}
      />
    );
  }
}
