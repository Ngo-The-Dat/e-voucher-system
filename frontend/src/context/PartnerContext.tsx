"use client";

import { createContext, useContext } from "react";
import { PartnerProfile } from "@/lib/types/profile";

const PartnerContext = createContext<PartnerProfile | null>(null);

export const PartnerProvider = PartnerContext.Provider;

export const usePartner = () => useContext(PartnerContext);
