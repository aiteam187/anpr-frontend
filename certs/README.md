# Dev TLS certificate

`dev-cert.pem` / `dev-key.pem` are a self-signed certificate for the Vite dev
server (see `vite.config.ts`), generated with Subject Alternative Names for
`localhost`, `127.0.0.1`, and the LAN IP the dashboard is actually opened
from — `@vitejs/plugin-basic-ssl`'s auto-generated cert only covers
`localhost`, which causes a hostname-mismatch certificate error (and a
service worker registration failure — see the Push Notifications toggle)
when the dev server is reached via its LAN IP instead.

Not committed to git (see `.gitignore`) — regenerate locally with:

```sh
openssl req -x509 -newkey rsa:2048 -keyout dev-key.pem -out dev-cert.pem \
  -days 825 -nodes -config san.cnf -extensions v3_req
```

If the dev server's LAN IP changes, edit `san.cnf`'s `[alt_names]` section
to match, then regenerate.

The first time you open the dashboard over HTTPS with this cert, the browser
will still show a self-signed-certificate warning once — click through it
(same as before). What this fixes is the *service worker* registration,
which needs the certificate's hostname to actually match the URL you're
using, not just any accepted self-signed cert.
