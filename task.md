# NiviDoc UI Redesign — Task Tracker

## Phase 1: Design System Foundation
- [/] constants/Colors.ts — expand to 55+ tokens
- [ ] constants/Typography.ts — add lineHeight, letterSpacing, variants
- [ ] constants/Spacing.ts — NEW 8pt grid system
- [ ] constants/Shadows.ts — NEW shadow presets

## Phase 2: New Shared Components
- [ ] components/Badge.tsx — NEW status badge
- [ ] components/StatCard.tsx — NEW stat card for dashboard
- [ ] components/ChipFilter.tsx — NEW animated filter chip

## Phase 3: Enhanced Existing Components
- [ ] components/AnimatedCard.tsx — withShadow, entry animation
- [ ] components/ButtonPrimary.tsx — sizes, icon support, radius fix
- [ ] components/InputField.tsx — animated focus border
- [ ] components/DoctorCard.tsx — online dot, shadow, rating UI
- [ ] components/BannerCarousel.tsx — spring pill indicators
- [ ] components/SectionHeader.tsx — chevron icon
- [ ] components/SkeletonLoader.tsx — AppointmentSkeleton variant

## Phase 4: Patient App Navigation
- [ ] app/(patient)/_layout.tsx — premium tab bar

## Phase 5: Patient App Screens
- [ ] app/(patient)/index.tsx — full home redesign
- [ ] app/(patient)/search.tsx — redesign
- [ ] app/(patient)/appointments.tsx — redesign
- [ ] app/(patient)/profile.tsx — redesign

## Phase 6: Doctor App Navigation + Screens
- [ ] app/(doctor)/_layout.tsx — premium tab bar
- [ ] app/(doctor)/index.tsx — dashboard redesign
- [ ] app/(doctor)/appointments.tsx — redesign
- [ ] app/(doctor)/profile.tsx — redesign

## Phase 7: TypeScript Validation
- [ ] npx tsc --noEmit
