"use client";

import { useState } from "react";
import { DetailMapContext } from "./DetailMapContext";
import { DetailMapModal } from "./DetailMapModal";
import type { HotelDetail } from "@/lib/data";

export function DetailMapProvider({
  detail,
  children,
}: {
  detail: HotelDetail;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DetailMapContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <DetailMapModal
        open={open}
        onClose={() => setOpen(false)}
        detail={detail}
      />
    </DetailMapContext.Provider>
  );
}
