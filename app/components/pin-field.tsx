// copy-paste from
// https://mantine.dev/core/pin-input/

import React, {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from '~/utils/misc.ts'
import { Input } from '~/components/ui/input.tsx'


export const useIsomorphicEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;

const __useId: () => string | undefined =
  (React as any)["useId".toString()] || (() => undefined);

export function useReactId() {
  const id = __useId();
  return id ? `mantine-${id.replace(/:/g, "")}` : "";
}

export function randomId() {
  return `epic-stack-${Math.random().toString(36).slice(2, 11)}`;
}

export function useId(staticId?: string) {
  const reactId = useReactId();
  const [uuid, setUuid] = useState(reactId);

  useIsomorphicEffect(() => {
    setUuid(randomId());
  }, []);

  if (typeof staticId === "string") {
    return staticId;
  }

  if (typeof window === "undefined") {
    return reactId;
  }

  return uuid;
}

interface UseUncontrolledInput<T> {
  /** Value for controlled state */
  value?: T;

  /** Initial value for uncontrolled state */
  defaultValue?: T;

  /** Final value for uncontrolled state when value and defaultValue are not provided */
  finalValue?: T;

  /** Controlled state onChange handler */
  onChange?(value: T): void;
}

export function useUncontrolled<T>({
  value,
  defaultValue,
  finalValue,
  onChange = () => {},
}: UseUncontrolledInput<T>): [T, (value: T) => void, boolean] {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue !== undefined ? defaultValue : finalValue
  );

  const handleUncontrolledChange = (val: T) => {
    setUncontrolledValue(val);
    onChange?.(val);
  };

  if (value !== undefined) {
    return [value as T, onChange, true];
  }

  return [uncontrolledValue as T, handleUncontrolledChange, false];
}

export function createPinArray(length: number, value: string): string[] {
  if (length < 1) {
    return [];
  }

  const values = new Array<string>(length).fill("");

  if (value) {
    const splitted = value.trim().split("");
    for (let i = 0; i < Math.min(length, splitted.length); i += 1) {
      values[i] = splitted[i];
    }
  }

  return values;
}

const regex = {
  number: /^[0-9]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/i,
};

export interface PinInputProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Hidden input name attribute */
  name?: string;

  /** Hidden input form attribute */
  form?: string;

  /** If set, first input is focused when component is mounted */
  autoFocus?: boolean;

  /** Value for controlled component */
  value?: string;

  /** Default value for uncontrolled component */
  defaultValue?: string;

  /** Called when value changes */
  onChange?: (value: string) => void;

  /** Called when user enters value to all inputs */
  onComplete?(value: string): void;

  /** Placeholder for every input field */
  placeholder?: string;

  /** Determines whether focus should be moved automatically to the next input once filled */
  manageFocus?: boolean;

  /** Determines whether autocomplete="one-time-code" attribute should be set on all inputs */
  oneTimeCode?: boolean;

  /** The top-level id that is used as a base in all input fields */
  id?: string;

  /** Sets inputs disabled attribute */
  disabled?: boolean;

  /** Adds error styles to all inputs */
  error?: boolean;

  /** The type of allowed values */
  type?: "alphanumeric" | "number" | RegExp;

  /** Changes input type to "password" */
  mask?: boolean;

  /** Number of input boxes */
  length?: number;

  /** Determines whether the user can edit input content */
  readOnly?: boolean;

  /** Inputs type attribute, inferred from type prop if not specified */
  inputType?: React.HTMLInputTypeAttribute;

  /** inputmode attr, inferred from type prop if not specified */
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search"
    | undefined;
}

const defaultProps: Partial<PinInputProps> = {
  length: 4,
  manageFocus: true,
  placeholder: "○",
  type: "alphanumeric",
};

export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(
  (
    {
      id,
      value,
      defaultValue,
      onChange,
      onComplete,
      placeholder = defaultProps.placeholder,
      manageFocus = defaultProps.manageFocus,
      oneTimeCode,
      disabled,
      error,
      type = defaultProps.type,
      mask,
      length = defaultProps.length,
      readOnly,
      inputType,
      inputMode,
      name,
      className,
      autoFocus,
      "aria-label": ariaLabel,
      ...others
    },
    ref
  ) => {
    const uuid = useId(name);

    const [focusedIndex, setFocusedIndex] = useState(-1);

    const [_value, setValues] = useUncontrolled({
      value,
      defaultValue,
      finalValue: "",
      onChange,
    });

    const inputsRef = useRef<Array<HTMLInputElement>>([]);

    const validate = (code: string) => {
      const re =
        type instanceof RegExp
          ? type
          : (type || "alphanumeric") in regex
          ? regex[type || "alphanumeric"]
          : null;
      return re?.test(code);
    };

    const focusInputField = (dir: "next" | "prev", index: number) => {
      if (!manageFocus) return;

      if (dir === "next") {
        const nextIndex = index + 1;
        inputsRef.current[
          nextIndex < (length || 1) ? nextIndex : index
        ].focus();
      }

      if (dir === "prev") {
        const nextIndex = index - 1;

        inputsRef.current[nextIndex > -1 ? nextIndex : index].focus();
      }
    };

    const setFieldValue = (val: string, index: number) => {
      const values = [...createPinArray(length || 1, _value)];
      values[index] = val;
      setValues(values.join(""));
    };

    const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      index: number
    ) => {
      const inputValue = event.target.value;
      const nextChar =
        inputValue.length > 1
          ? inputValue.split("")[inputValue.length - 1]
          : inputValue;

      const isValid = validate(nextChar);

      if (isValid) {
        setFieldValue(nextChar, index);
        focusInputField("next", index);
      } else {
        setFieldValue("", index);
      }
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
      index: number
    ) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusInputField("prev", index);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        focusInputField("next", index);
      } else if (event.key === "Delete") {
        event.preventDefault();
        setFieldValue("", index);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setFieldValue("", index);
        if (length === index + 1) {
          if ((event.target as HTMLInputElement).value === "") {
            focusInputField("prev", index);
          }
        } else {
          focusInputField("prev", index);
        }
      }
    };

    const handleFocus = (
      event: React.FocusEvent<HTMLInputElement>,
      index: number
    ) => {
      event.target.select();
      setFocusedIndex(index);
    };

    const handleBlur = () => {
      setFocusedIndex(-1);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const copyValue = event.clipboardData.getData("Text");
      const isValid = validate(copyValue);

      if (isValid) {
        setValues(copyValue);
        const toFocusIndex =
          copyValue.length - 1 < (length || 1)
            ? copyValue.length - 1
            : (length || 1) - 1;
        inputsRef.current[toFocusIndex].focus();
      }
    };

    useEffect(() => {
      if (_value.length !== length) return;

      onComplete?.(_value);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_value]);

    return (
      <>
        <div
          ref={ref}
          className={cn("flex flex-nowrap gap-1", className)}
          id={uuid}
          {...others}
        >
          {createPinArray(length || 1, _value).map((char, index) => (
            <Input
              id={`${uuid}-${index + 1}`}
              key={`${uuid}-${index}`}
              inputMode={inputMode || (type === "number" ? "numeric" : "text")}
              onChange={(event) => handleChange(event, index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onFocus={(event) => handleFocus(event, index)}
              onBlur={handleBlur}
              onPaste={handlePaste}
              type={
                inputType ||
                (mask ? "password" : type === "number" ? "tel" : "text")
              }
              className="h-10 w-10 text-center"
              // error={error}
              disabled={disabled}
              ref={(node) => {
                if (!node) return;
                inputsRef.current[index] = node;
              }}
              autoComplete={oneTimeCode ? "one-time-code" : "off"}
              placeholder={focusedIndex === index ? "" : placeholder}
              value={char}
              autoFocus={autoFocus && index === 0}
              aria-label={ariaLabel}
              readOnly={readOnly}
            />
          ))}
        </div>
        <input type="hidden" name={name} value={_value} />
      </>
    );
  }
);
PinInput.displayName = "PinInput";
