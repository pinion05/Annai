"use client";

import { AssistantModal } from "@assistant-ui/react";
import type { ThreadConfig } from "@assistant-ui/react";

interface AssistantProviderProps {
  children: React.ReactNode;
  config?: ThreadConfig;
}

export function AssistantProvider({ children, config }: AssistantProviderProps) {
  return (
    <>
      {children}
      <AssistantModal />
    </>
  );
}
