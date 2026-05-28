import { atom } from 'jotai';

export const warehousesAtom = atom([]);
export const productsAtom = atom([]);
export const lowStockAtom = atom([]);
export const thresholdAtom = atom(5);
export const loadingAtom = atom(false);
export const errorAtom = atom(null);
