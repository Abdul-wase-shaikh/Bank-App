import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Props = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
};

export const AnimatedNumber = ({ value, format, duration = 1.2, className }: Props) => {
  const [display, setDisplay] = useState(0);
  const obj = useRef({ v: 0 });

  useEffect(() => {
    const tween = gsap.to(obj.current, {
      v: value,
      duration,
      ease: "power3.out",
      onUpdate: () => setDisplay(obj.current.v),
    });
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display).toLocaleString("en-IN")}</span>;
};
