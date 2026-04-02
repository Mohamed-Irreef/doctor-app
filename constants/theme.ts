/**
 * NiviDoc Design System — Theme Colors (Hybrid Blue)
 * Light and dark mode base tokens + font definitions
 */
import { Platform } from "react-native";

const tintColorLight = "#1E3A8A";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#0F172A",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#475569",
    tabIconDefault: "#94A3B8",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#F1F5F9",
    background: "#0F172A",
    tint: tintColorDark,
    icon: "#CBD5E1",
    tabIconDefault: "#CBD5E1",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
