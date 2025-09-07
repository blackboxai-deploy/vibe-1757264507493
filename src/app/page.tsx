"use client";

import { useState, useEffect, useCallback } from "react";

interface CalculatorState {
  display: string;
  previousValue: number | null;
  currentValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
  lastOperation: string | null;
}

export default function Calculator() {
  const [state, setState] = useState<CalculatorState>({
    display: "0",
    previousValue: null,
    currentValue: null,
    operation: null,
    waitingForNewValue: false,
    lastOperation: null,
  });

  // Handle number input
  const inputNumber = useCallback((num: string) => {
    setState(prevState => {
      if (prevState.waitingForNewValue) {
        return {
          ...prevState,
          display: num,
          waitingForNewValue: false,
        };
      }

      if (prevState.display === "0" && num !== ".") {
        return {
          ...prevState,
          display: num,
        };
      }

      // Prevent multiple decimal points
      if (num === "." && prevState.display.includes(".")) {
        return prevState;
      }

      return {
        ...prevState,
        display: prevState.display + num,
      };
    });
  }, []);

  // Handle operations
  const inputOperation = useCallback((nextOperation: string) => {
    setState(prevState => {
      const inputValue = parseFloat(prevState.display);

      if (prevState.previousValue === null) {
        return {
          ...prevState,
          previousValue: inputValue,
          operation: nextOperation,
          waitingForNewValue: true,
          lastOperation: nextOperation,
        };
      }

      if (prevState.operation && !prevState.waitingForNewValue) {
        const currentValue = prevState.previousValue || 0;
        const newValue = calculate(currentValue, inputValue, prevState.operation);

        return {
          ...prevState,
          display: formatNumber(newValue),
          previousValue: newValue,
          operation: nextOperation,
          waitingForNewValue: true,
          lastOperation: nextOperation,
        };
      }

      return {
        ...prevState,
        operation: nextOperation,
        waitingForNewValue: true,
        lastOperation: nextOperation,
      };
    });
  }, []);

  // Calculate result
  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        if (secondValue === 0) {
          throw new Error("Cannot divide by zero");
        }
        return firstValue / secondValue;
      case "%":
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  // Format number display
  const formatNumber = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) {
      return "Error";
    }

    // Handle very large or very small numbers
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }

    // Remove unnecessary decimal places
    const formatted = num.toString();
    if (formatted.length > 12) {
      return parseFloat(num.toPrecision(10)).toString();
    }

    return formatted;
  };

  // Handle equals operation
  const performCalculation = useCallback(() => {
    setState(prevState => {
      const inputValue = parseFloat(prevState.display);

      if (prevState.operation && prevState.previousValue !== null) {
        try {
          const newValue = calculate(prevState.previousValue, inputValue, prevState.operation);
          return {
            ...prevState,
            display: formatNumber(newValue),
            previousValue: null,
            operation: null,
            waitingForNewValue: true,
            currentValue: newValue,
          };
        } catch (error) {
          return {
            ...prevState,
            display: "Error",
            previousValue: null,
            operation: null,
            waitingForNewValue: true,
          };
        }
      }

      return prevState;
    });
  }, []);

  // Clear display (C)
  const clearDisplay = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      display: "0",
    }));
  }, []);

  // All clear (AC)
  const allClear = useCallback(() => {
    setState({
      display: "0",
      previousValue: null,
      currentValue: null,
      operation: null,
      waitingForNewValue: false,
      lastOperation: null,
    });
  }, []);

  // Plus/minus toggle
  const toggleSign = useCallback(() => {
    setState(prevState => {
      const value = parseFloat(prevState.display);
      return {
        ...prevState,
        display: formatNumber(-value),
      };
    });
  }, []);

  // Percentage
  const percentage = useCallback(() => {
    setState(prevState => {
      const value = parseFloat(prevState.display);
      return {
        ...prevState,
        display: formatNumber(value / 100),
      };
    });
  }, []);

  // Backspace
  const backspace = useCallback(() => {
    setState(prevState => {
      if (prevState.display.length === 1 || prevState.waitingForNewValue) {
        return {
          ...prevState,
          display: "0",
        };
      }
      return {
        ...prevState,
        display: prevState.display.slice(0, -1) || "0",
      };
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event;

      // Prevent default behavior for calculator keys
      if (/[\d.+\-*/=%]/.test(key) || key === "Enter" || key === "Escape" || key === "Backspace") {
        event.preventDefault();
      }

      // Numbers and decimal
      if (/[\d.]/.test(key)) {
        inputNumber(key);
      }
      // Operations
      else if (key === "+") {
        inputOperation("+");
      } else if (key === "-") {
        inputOperation("-");
      } else if (key === "*") {
        inputOperation("×");
      } else if (key === "/") {
        inputOperation("÷");
      } else if (key === "%") {
        percentage();
      }
      // Functions
      else if (key === "Enter" || key === "=") {
        performCalculation();
      } else if (key === "Escape") {
        allClear();
      } else if (key === "Backspace") {
        backspace();
      } else if (key === "c" || key === "C") {
        clearDisplay();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [inputNumber, inputOperation, performCalculation, allClear, clearDisplay, backspace, percentage]);

  // Button component
  const Button = ({ 
    onClick, 
    children, 
    className = "", 
    variant = "default" 
  }: { 
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "operator" | "equals" | "clear" | "zero";
  }) => {
    const baseClasses = "text-xl font-semibold rounded-2xl transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl";
    
    const variantClasses = {
      default: "bg-gray-300 hover:bg-gray-400 text-gray-800",
      operator: "bg-orange-500 hover:bg-orange-600 text-white",
      equals: "bg-orange-500 hover:bg-orange-600 text-white",
      clear: "bg-gray-400 hover:bg-gray-500 text-gray-800",
      zero: "bg-gray-300 hover:bg-gray-400 text-gray-800 col-span-2",
    };

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className} h-16 flex items-center justify-center`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="calculator-container">
      <div className="bg-black rounded-3xl shadow-2xl p-6 w-80">
        {/* Display */}
        <div className="bg-black rounded-xl p-4 mb-4">
          <div className="text-right">
            <div className="text-4xl font-light text-white min-h-[3rem] flex items-center justify-end">
              {state.display}
            </div>
          </div>
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <Button onClick={allClear} variant="clear">AC</Button>
          <Button onClick={toggleSign} variant="clear">±</Button>
          <Button onClick={percentage} variant="clear">%</Button>
          <Button onClick={() => inputOperation("÷")} variant="operator">÷</Button>

          {/* Row 2 */}
          <Button onClick={() => inputNumber("7")} variant="default">7</Button>
          <Button onClick={() => inputNumber("8")} variant="default">8</Button>
          <Button onClick={() => inputNumber("9")} variant="default">9</Button>
          <Button onClick={() => inputOperation("×")} variant="operator">×</Button>

          {/* Row 3 */}
          <Button onClick={() => inputNumber("4")} variant="default">4</Button>
          <Button onClick={() => inputNumber("5")} variant="default">5</Button>
          <Button onClick={() => inputNumber("6")} variant="default">6</Button>
          <Button onClick={() => inputOperation("-")} variant="operator">−</Button>

          {/* Row 4 */}
          <Button onClick={() => inputNumber("1")} variant="default">1</Button>
          <Button onClick={() => inputNumber("2")} variant="default">2</Button>
          <Button onClick={() => inputNumber("3")} variant="default">3</Button>
          <Button onClick={() => inputOperation("+")} variant="operator">+</Button>

          {/* Row 5 */}
          <Button onClick={() => inputNumber("0")} variant="zero">0</Button>
          <Button onClick={() => inputNumber(".")} variant="default">.</Button>
          <Button onClick={performCalculation} variant="equals">=</Button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 text-center text-gray-400 text-xs">
          Keyboard shortcuts: Numbers, +, -, *, /, =, Enter, Escape (AC), Backspace, %
        </div>
      </div>
    </div>
  );
}