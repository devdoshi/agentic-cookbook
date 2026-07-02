import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231f2937'/%3E%3Cpath d='M8 10h16v3H8zm0 5h10v3H8zm0 5h16v3H8z' fill='%23f9fafb'/%3E%3C/svg%3E"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown route error';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Route Error</title>
      </head>
      <body>
        <main
          style={{
            margin: '2rem auto',
            maxWidth: '56rem',
            fontFamily: 'sans-serif',
          }}
        >
          <h1>Route Error</h1>
          <p>{message}</p>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
