# Design QA: Futuristic pathology login

## Visual target

- Reference: `codex-clipboard-f2291b25-787f-40d1-9600-04fd86f66b6c.png`, concept 03.
- Target traits: dark diagnostic workspace, animated microscope scanner on the left, compact login form on the right, cyan technical accents, floating pathology data panels.

## Comparison

- Desktop 1440 x 900: two-panel composition, hierarchy, dark palette, microscope focal point and login placement match the selected concept.
- Mobile 390 x 844: diagnostic scene condenses above the form; all primary fields and actions remain readable without horizontal overflow.
- Real atlas images load in both floating microscopy panels. Motion is applied to scanner rings, scan line, data cards and metric bars, with `prefers-reduced-motion` support.
- Existing Supabase login and registration behavior is preserved.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the source concept contains more decorative HUD panels; the implementation intentionally keeps four panels to preserve form focus and mobile clarity.

## Verification

- Production build: passed.
- Desktop overflow: none.
- Mobile overflow: none.
- Browser console errors: none.
- Registration state: passed.

Final result: passed
