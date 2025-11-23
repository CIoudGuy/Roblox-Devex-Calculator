import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function CountUp({ value, formatter }) {
    const spring = useSpring(value, { stiffness: 800, damping: 50, mass: 1 });
    const display = useTransform(spring, (current) => formatter(Math.max(0, current)));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
}
