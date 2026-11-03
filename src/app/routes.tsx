import { lazy, Suspense } from 'react'
import { Navigate, useLocation, type RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { PageLoader } from './PageLoader'
import { RouteErrorPage } from './RouteErrorPage'
import { MarketingLayout } from './layouts/MarketingLayout'
import { RootLayout } from './layouts/RootLayout'

const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'))
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'))
const TemplateDetailPage = lazy(() => import('@/pages/TemplateDetailPage'))
const CreatePage = lazy(() => import('@/pages/CreatePage'))
const LocalEditorPage = lazy(() => import('@/pages/LocalEditorPage'))
const EmbedEditorPage = lazy(() => import('@/pages/EmbedEditorPage'))
const EmbedStudioPage = lazy(() => import('@/pages/EmbedStudioPage'))
const EmbedTemplatesPage = lazy(() => import('@/pages/EmbedTemplatesPage'))
const DesignEditorPage = lazy(() => import('@/pages/DesignEditorPage'))
const SharedDesignPage = lazy(() => import('@/pages/SharedDesignPage'))
const SiteApp = lazy(() => import('@/site/SiteApp'))
const DashboardLayout = lazy(() => import('@/features/dashboard/DashboardLayout'))
const DashboardHomePage = lazy(() => import('@/pages/dashboard/HomePage'))
const DesignsPage = lazy(() => import('@/pages/dashboard/DesignsPage'))
const DashboardTemplatesPage = lazy(() => import('@/pages/dashboard/TemplatesPage'))
const BrandPage = lazy(() => import('@/pages/dashboard/BrandPage'))
const UploadsPage = lazy(() => import('@/pages/dashboard/UploadsPage'))
const TrashPage = lazy(() => import('@/pages/dashboard/TrashPage'))
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'))
const StudioIntakePage = lazy(() =>
  import('@/features/studio/components/StudioIntakePage').then((m) => ({ default: m.StudioIntakePage }))
)

function OldShopAddress() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={pathname.replace(/^\/shop/, '') + search + hash} replace />
}

const page = (element: React.ReactNode) => <Suspense fallback={<PageLoader />}>{element}</Suspense>


export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          { path: 'templates', element: <TemplatesPage /> },
          { path: 'templates/:slug', element: <TemplateDetailPage /> },
          { path: 'features', element: <FeaturesPage /> },
        ],
      },
      // there is no account in this site: the old login and sign-up addresses lead to the shop
      ...['login', 'signup', 'forgot-password', 'reset-password', 'verify-email'].map((path) => ({ path, element: <Navigate to="/" replace /> })),
      // the old /shop addresses lead to the same page without it
      { path: 'shop/*', element: <OldShopAddress /> },
      { path: 'shop', element: <Navigate to="/" replace /> },
      // the shop is the site itself: everything not listed here is one of its pages (or its own not-found page)
      { path: '*', element: page(<SiteApp />) },
      { path: 'create', element: page(<CreatePage />) },
      { path: 'local/:localId', element: page(<LocalEditorPage />) },
      { path: 'embed/editor', element: page(<EmbedEditorPage />) },
      { path: 'embed/studio', element: page(<EmbedStudioPage />) },
      { path: 'embed/templates', element: page(<EmbedTemplatesPage />) },
      { path: 's/:token', element: page(<SharedDesignPage />) },
      { element: <RequireAuth keepOpenWhenSessionEnds />, children: [{ path: 'design/:id', element: page(<DesignEditorPage />) }] },
      {
        element: <RequireAuth />,
        children: [
          {
            element: page(<DashboardLayout />),
            children: [
              { path: 'dashboard', element: <DashboardHomePage /> },
              { path: 'studio', element: <Navigate to="/studio/new" replace /> },
              { path: 'studio/new', element: <StudioIntakePage /> },
              { path: 'dashboard/designs', element: <DesignsPage /> },
              { path: 'dashboard/designs/folder/:folderId', element: <DesignsPage /> },
              { path: 'dashboard/starred', element: <DesignsPage starred /> },
              { path: 'dashboard/templates', element: <DashboardTemplatesPage /> },
              { path: 'dashboard/brand', element: <BrandPage /> },
              { path: 'dashboard/uploads', element: <UploadsPage /> },
              { path: 'dashboard/trash', element: <TrashPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: 'dashboard/*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]
