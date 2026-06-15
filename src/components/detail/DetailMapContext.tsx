"use client";

import { createContext, useContext } from "react";

type DetailMapCtx = { open: () => void };

export const DetailMapContext = createContext<DetailMapCtx | null>(null);

export function useDetailMap(): DetailMapCtx {
  const ctx = useContext(DetailMapContext);
  return ctx ?? { open: () => {} };
}
