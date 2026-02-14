import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-fast outline-none",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent",
        "dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:border-red-400",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
