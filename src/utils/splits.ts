import type { Split } from "../types";

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const defaultSplit = (): Split => ({ id: makeId(), name: "Collaborator", pct: 10 });
