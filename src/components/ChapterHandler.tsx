"use client";
import { useEffect, useRef } from "react";

function ChapterHandler({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      console.log("clicked", event.target);
    };
    ref.current?.addEventListener("click", handleClick, true);
    return () => {
      //   ref.current?.removeEventListener('click', handleClick);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

export default ChapterHandler;
