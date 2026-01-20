"use client";

// Basic Assistant Provider wrapper
// Note: Full assistant-ui integration requires additional setup based on specific version

interface AssistantProviderProps {
  children: React.ReactNode;
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  return <>{children}</>;
}
