"use client";
import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Components use the lightweight `m` element instead of `motion`, and the animation engine is fetched as its own
 * chunk after first paint, so it no longer blocks the initial JavaScript. Elements render their initial styles
 * (the same markup the server sent) until it arrives.
 */
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;
}
