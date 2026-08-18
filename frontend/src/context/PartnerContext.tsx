"use client";

import { createContext, useContext } from "react";
import { PartnerProfile } from "@/lib/types/partner-profile";

export interface PartnerContextValue {
  partner: PartnerProfile | null;
  refreshPartner?: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextValue>({
  partner: null,
});

export const PartnerProvider = PartnerContext.Provider;

export const usePartner = () => {
  const context = useContext(PartnerContext);
  return context.partner;
};

export const usePartnerContext = () => useContext(PartnerContext);
