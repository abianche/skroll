import * as React from "react";
import { cn } from "src/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | number;
  py?: "sm" | "md" | "lg" | "xl" | number;
}

const sizeToMaxWidth: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
};

const spaceY: Record<string, string> = {
  sm: "py-4",
  md: "py-6",
  lg: "py-8",
  xl: "py-12",
};

export function Container({ className, size = "md", py, ...props }: ContainerProps) {
  const sizeClass =
    typeof size === "number" ? `max-w-[${size}px]` : (sizeToMaxWidth[size] ?? "max-w-screen-md");
  let pyClass: string | undefined;
  if (typeof py === "number") pyClass = `py-[${py}px]`;
  else if (py) pyClass = spaceY[py];
  return (
    <div
      className={cn(
        "mx-auto w-full bg-background px-4 text-foreground",
        sizeClass,
        pyClass,
        className
      )}
      {...props}
    />
  );
}
