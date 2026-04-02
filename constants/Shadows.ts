/**
 * NiviDoc Design System — Shadow Presets (Hybrid Blue)
 * Soft elevation with deep blue accent on CTA buttons.
 */
import { Platform } from 'react-native';

const baseShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
};

export const Shadows = {
  none: {},

  /** Very subtle lift — use on cards in list */
  soft: Platform.select({
    ios: {
      ...baseShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }),

  /** Standard card shadow */
  card: Platform.select({
    ios: {
      ...baseShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),

  /** Elevated elements like modals, FABs */
  elevated: Platform.select({
    ios: {
      ...baseShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),

  /** Tab bar / bottom sheet shadow (upward) */
  tabBar: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    android: { elevation: 8 },
    default: {},
  }),

  /** CTA button shadow — deep blue tint */
  button: Platform.select({
    ios: {
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.20,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  }),
};
