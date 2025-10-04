"use client";

import React, { forwardRef } from "react";
import type { JSX } from "react";

type MotionComponent<T extends keyof JSX.IntrinsicElements> = React.ForwardRefExoticComponent<
  JSX.IntrinsicElements[T] & React.RefAttributes<Element>
>;

function createMotionComponent<T extends keyof JSX.IntrinsicElements>(tag: T): MotionComponent<T> {
  return forwardRef<Element, JSX.IntrinsicElements[T]>((props, ref) =>
    React.createElement(tag, { ref, ...props })
  );
}

export const motion = new Proxy(
  {},
  {
    get: (_target, key: string) => createMotionComponent(key as keyof JSX.IntrinsicElements),
  }
) as Record<string, MotionComponent<keyof JSX.IntrinsicElements>>;

export function AnimatePresence({ children }: { children: React.ReactNode; mode?: string }) {
  return <>{children}</>;
}
