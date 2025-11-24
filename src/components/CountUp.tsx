import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type CountUpProps = {
  value: number;
  formatter: (value: number) => string;
};

export default function CountUp({ value, formatter }: CountUpProps) {
  const spring = useSpring(value, { stiffness: 800, damping: 50, mass: 1 });
  const display = useTransform(spring, (current) => formatter(Math.max(0, current)));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}
