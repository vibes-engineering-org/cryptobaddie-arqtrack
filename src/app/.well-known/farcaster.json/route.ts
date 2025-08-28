import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
      payload:
        "eyJkb21haW4iOiJjcnlwdG9iYWRkaWUtYXJxdHJhY2sudmVyY2VsLmFwcCJ9",
      signature:
        "MHgwOGI5ZDcxMTkyZGIxMjE0ZDk4ODZmNWQ0YmYwYjAwMDE0YWI1Mzk1OWZlYzE0MTA1OTBmOGM3ZThhN2VhZTIzNDE2OWRjZWQ4ZjZhOGRjYmU4ZmM5OWFiZjBlNDFhOWFlNDRmZjE2NGRhYWRjNjgxMWE4OWJkMmQ5YzNhMzQ1MzFj",
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "Open",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#555555",
      webhookUrl: `${appUrl}/api/webhook`,
      primaryCategory: "social",
    },
  };

  return Response.json(config);
}
