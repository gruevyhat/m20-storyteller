import type { RoteSource } from '../types';
import { FLESH } from './flesh';
import { GUTTER } from './gutter';
import { CODE } from './code';
import { CHROME } from './chrome';
import { OUTER } from './outer';
import { HIVE } from './hive';
import { BLOOD } from './blood';
import { NUMBER } from './number';
import { MESMER } from './mesmer';

/** Written rotes by hand key. */
export const HAND_ROTES: Record<string, RoteSource[]> = {
  flesh: FLESH,
  gutter: GUTTER,
  code: CODE,
  chrome: CHROME,
  outer: OUTER,
  hive: HIVE,
  blood: BLOOD,
  number: NUMBER,
  mesmer: MESMER,
};
