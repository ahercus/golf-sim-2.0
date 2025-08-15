# Golf Sim (Next.js + TypeScript)

## Scripts

- dev: `npm run dev` (http://localhost:3000)
- build: `npm run build`
- start: `npm run start`

## Env

- Client: `NEXT_PUBLIC_MAPBOX_TOKEN`
- Server: `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`

## Notes

- OpenAI calls are proxied via `/api/openai/*` routes; no client secrets.
- UI built with Tailwind + shadcn-style primitives under `components/ui`.
- Domain utilities in `features/golf/lib/*`; state in `features/golf/state`.


