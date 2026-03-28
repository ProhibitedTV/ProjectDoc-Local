import { createRootRoute, createRoute, createRouter, useParams } from "@tanstack/react-router";

import { AppShell } from "./app-shell";
import { AdminPage } from "./pages/admin-page";
import { DashboardPage } from "./pages/dashboard-page";
import { DocumentDetailPage } from "./pages/document-detail-page";
import { DocumentsPage } from "./pages/documents-page";
import { FeaturePage } from "./pages/feature-page";
import { ReviewDetailPageContent } from "./pages/review-detail-page";
import { ReviewQueuePage } from "./pages/review-queue-page";
import { SearchPage } from "./pages/search-page";
import { UploadPage } from "./pages/upload-page";

const rootRoute = createRootRoute({
  component: AppShell
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents",
  component: DocumentsPage
});

function DocumentDetailRouteComponent() {
  const { documentId } = useParams({ from: "/documents/$documentId" });
  return <DocumentDetailPage documentId={documentId} />;
}

const documentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents/$documentId",
  component: DocumentDetailRouteComponent
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: () => (
    <FeaturePage
      title="Projects"
      summary="Expose project context so teams can filter documents and exports by job."
      nextStep="Define project CRUD APIs and project-document associations."
    />
  )
});

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: ReviewQueuePage
});

function ReviewDetailRouteComponent() {
  const { reviewTaskId } = useParams({ from: "/review/$reviewTaskId" });
  return <ReviewDetailPageContent reviewTaskId={reviewTaskId} />;
}

const reviewDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review/$reviewTaskId",
  component: ReviewDetailRouteComponent
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  uploadRoute,
  documentsRoute,
  documentDetailRoute,
  projectsRoute,
  reviewRoute,
  reviewDetailRoute,
  searchRoute,
  adminRoute
]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
