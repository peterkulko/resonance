import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const isOrgSelectionRoute = createRouteMatcher(["/org-selection(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId } = await auth();

  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (!userId) {
    await auth.protect();
    return NextResponse.next();
  }

  if (isOrgSelectionRoute(request)) {
    return NextResponse.next();
  }

  if (userId && !orgId) {
    const orgSelection = new URL("/org-selection", request.url);
    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
