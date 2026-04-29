"use client";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactNode } from "react";

export function FluentWrapper({ children }: { children: ReactNode }) {
  return (
    <FluentProvider theme={webLightTheme}>
      {children}
    </FluentProvider>
  );
}
