# Avatar Assets - Game of Thrones Avatars

This folder contains SVG avatar files for the LifeXP application.

## Current Structure

Game of Thrones character avatars with granular score ranges:
```
assets/avatars/
├── got.0-10.svg       # Theon Greyjoy (0-10%)
├── got.11-20.svg      # Sansa Stark (11-20%)
├── got.21-30.svg      # Tyrion Lannister (21-30%)
├── got.31-40.svg      # Arya Stark (31-40%)
├── got.41-50.svg      # Jon Snow (41-50%)
├── got.51-60.svg      # Brienne of Tarth (51-60%)
├── got.61-70.svg      # Davos Seaworth (61-70%)
├── got.71-80.svg      # Jaime Lannister (71-80%)
├── got.81-90.svg      # Daenerys Targaryen (81-90%)
└── got.91-100.svg     # Dragon of the North (91-100%)
```

## Naming Convention

Files follow the pattern:
```
got.{range}.svg
```

Where `{range}` is the percentage range (e.g., `0-10`, `11-20`).

## Score Mapping

Each character avatar maps to a specific score range representing their character arc:
- 0-10%: Theon Greyjoy (broken - exhausted)
- 11-20%: Sansa Stark (imprisoned - exhausted)
- 21-30%: Tyrion Lannister (exiled - sad)
- 31-40%: Arya Stark (lost - sad)
- 41-50%: Jon Snow (dutiful - neutral)
- 51-60%: Brienne of Tarth (loyal - neutral)
- 61-70%: Davos Seaworth (wise - content)
- 71-80%: Jaime Lannister (redeemed - content)
- 81-90%: Daenerys Targaryen (powerful - happy)
- 91-100%: Dragon of the North (ultimate - epic)

## Integration

The avatar configuration is defined in `lib/avatars/config.ts`:
- `GOT_AVATAR_RANGES`: Array mapping score ranges to SVG files (aliased as `DOG_AVATAR_RANGES` for compatibility)
- `getAvatarByScore(score)`: Function to get the correct avatar for a given score

The `SVGAvatarLoader` component handles loading and rendering the SVG files.

## SVG Requirements

- Viewbox: `0 0 240 240` (recommended)
- Should be distinct and expressive
- Support for accent color customization via CSS variables
