import { evaluate } from "mathjs";
import Input from "./input";

function evalMath(value: string): number {
  try {
    const result = evaluate(value);
    if (typeof result === "number" && isFinite(result)) return result;
    return NaN;
  } catch {
    return NaN;
  }
}

interface MathInputProps {
  className?: string;
  actualValue: string;
  updateValue: (v: string) => void;
  isValid: (v: string) => boolean;
  disabled?: boolean;
}
export default function MathInput(props: MathInputProps) {
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
}
