# BodyLog V1 Open Questions

## Product

- What basic visual direction should be used before frontend screens are implemented?
- Should the first CSV import support only the canonical format or include mappings from the current spreadsheet export?

## Technical

- Should `USER_HEIGHT_M` start as an environment variable or a versioned constant?
- What exact stable-value tolerance should weekly direction use beyond rounded displayed difference?
- Should frontend and backend remain in one package initially or move to a workspace structure during the project base task?

## Deployment

- Which Cloudflare Pages project name should be used for the frontend deployment?
- Which production frontend origin should be allowed by the Worker CORS/session configuration?
