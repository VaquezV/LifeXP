# Avatar Assets - Dog Avatars

This folder contains SVG avatar files for the LifeXP application.

## Current Structure

Dog avatars with granular score ranges:
```
assets/avatars/
├── dog.0-10.svg      # Scruffy Old Dog (0-10%)
├── dog.11-20.svg     # Mongrel Street (11-20%)
├── dog.21-30.svg     # Chubby Bulldog (21-30%)
├── dog.31-40.svg     # Luffy Poodle (31-40%)
├── dog.41-50.svg     # Chubby Labrador (41-50%)
├── dog.51-60.svg     # Golden Retriever (51-60%)
├── dog.61-70.svg     # Border Collie (61-70%)
├── dog.71-80.svg     # Shiba Inu (71-80%)
├── dog.81-90.svg     # Husky (81-90%)
└── dog.91-100.svg    # Epic Direwolf (91-100%)
```

## Naming Convention

Files follow the pattern:
```
{avatar-name}.{range}.svg
```

Where `{range}` is the percentage range (e.g., `0-10`, `11-20`).

## Score Mapping

Each dog avatar maps to a specific score range:
- 0-10%: Scruffy Old Dog (exhausted)
- 11-20%: Mongrel Street (exhausted)
- 21-30%: Chubby Bulldog (sad)
- 31-40%: Luffy Poodle (sad)
- 41-50%: Chubby Labrador (neutral)
- 51-60%: Golden Retriever (neutral)
- 61-70%: Border Collie (content)
- 71-80%: Shiba Inu (content)
- 81-90%: Husky (happy)
- 91-100%: Epic Direwolf (epic)

## Integration

The avatar configuration is defined in `lib/avatars/config.ts`:
- `DOG_AVATAR_RANGES`: Array mapping score ranges to SVG files
- `getAvatarByScore(score)`: Function to get the correct avatar for a given score

The `SVGAvatarLoader` component handles loading and rendering the SVG files.

## SVG Requirements

- Viewbox: `0 0 240 240` (recommended)
- Should be distinct and expressive
- Support for accent color customization via CSS variables
