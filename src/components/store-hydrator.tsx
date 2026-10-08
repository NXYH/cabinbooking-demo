"use client";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

export function StoreHydrator() {
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).then(() => useApp.setState({ hydrated: true }));
  }, []);
  return null;
}
