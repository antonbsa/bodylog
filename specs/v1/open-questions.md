# BodyLog V1 Open Questions

## Product

- Should the first CSV import support only the canonical format or include mappings from the current spreadsheet export?
- What warning thresholds should count as absurd but still saveable form values?

## Technical

- Should `USER_HEIGHT_M` start as an environment variable or a versioned constant?
- Should frontend and backend remain in one package initially or move to a workspace structure during the project base task?
- Which component library should be selected during frontend setup or first UI implementation?

## Deployment

- Which Cloudflare Pages project name should be used for the frontend deployment?
- Which production frontend origin should be allowed by the Worker CORS/session configuration?
