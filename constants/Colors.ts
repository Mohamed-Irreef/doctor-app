/**
 * NiviDoc Design System — Color Tokens (Hybrid Blue)
 * Dual-tone healthcare palette: Deep Trust Blue + Cyan/Teal accent
 * Balance: 70% white + 20% blue + 10% accent
 */

export const Colors = {
  // ── PRIMARY (Deep Trust Blue) ─────────────────────────
  primary: "#1E3A8A",
  primaryHover: "#2548A0",
  primaryPressed: "#172554",
  primaryLight: "#DBEAFE",
  primaryUltraLight: "#EFF6FF",

  // ── SECONDARY / ACCENT (Medical Cyan-Teal) ────────────
  secondary: "#14B8A6",
  secondaryHover: "#2DD4BF",
  secondaryPressed: "#0D9488",
  secondaryLight: "#CCFBF1",
  secondaryUltraLight: "#F0FDFA",

  // ── ACCENT BRIGHT (Highlights, Links) ─────────────────
  accentBright: "#06B6D4",
  accentBrightLight: "#CFFAFE",

  // ── GRADIENT ──────────────────────────────────────────
  gradientStart: "#1E3A8A",
  gradientEnd: "#06B6D4",

  // ── BACKGROUNDS & SURFACES ────────────────────────────
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#FFFFFF",
  overlay: "rgba(0,0,0,0.40)",
  skeleton: "#E2E8F0",
  sectionBg: "#FFFFFF",

  // ── TEXT HIERARCHY ────────────────────────────────────
  text: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  textDisabled: "#CBD5E1",
  textInverse: "#FFFFFF",
  textLink: "#06B6D4",

  // ── BORDERS & DIVIDERS ────────────────────────────────
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  divider: "#E2E8F0",
  focusBorder: "#1E3A8A",

  // ── STATUS COLORS ─────────────────────────────────────
  success: "#22C55E",
  successLight: "#DCFCE7",
  successPressed: "#16A34A",

  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorPressed: "#DC2626",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningPressed: "#D97706",

  info: "#1E3A8A",
  infoLight: "#DBEAFE",

  // ── MODULE: DOCTOR CARDS ──────────────────────────────
  doctorCardBg: "#FFFFFF",
  doctorName: "#0F172A",
  doctorSpeciality: "#475569",
  doctorRating: "#F59E0B",
  doctorOnline: "#22C55E",
  doctorOffline: "#CBD5E1",

  // ── MODULE: APPOINTMENT SLOTS ─────────────────────────
  slotAvailable: "#CCFBF1",
  slotSelected: "#14B8A6",
  slotBooked: "#E2E8F0",
  slotBorder: "#14B8A6",
  slotText: "#0D9488",

  // ── MODULE: LAB ───────────────────────────────────────
  labCardBg: "#FFFFFF",
  labPrice: "#1E3A8A",
  labDiscount: "#22C55E",
  reportReady: "#22C55E",
  reportPending: "#F59E0B",

  // ── MODULE: PHARMACY ──────────────────────────────────
  medicineCardBg: "#FFFFFF",
  medicinePrice: "#1E3A8A",
  addToCart: "#14B8A6",
  prescriptionRequired: "#EF4444",

  // ── MODULE: PAYMENT ───────────────────────────────────
  paymentSuccess: "#22C55E",
  paymentPending: "#F59E0B",
  paymentFailed: "#EF4444",

  // ── UTILITY ───────────────────────────────────────────
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
  lightGray: "#F8FAFC",

  // ── RATING ────────────────────────────────────────────
  ratingGold: "#FBBF24",
  ratingBg: "#FEF3C7",

  // ── DARK MODE TOKENS ──────────────────────────────────
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    surfaceAlt: "#334155",
    text: "#F1F5F9",
    textSecondary: "#CBD5E1",
    border: "#334155",
    primary: "#3B82F6",
    secondary: "#14B8A6",
    overlay: "rgba(0,0,0,0.60)",
  },
};
