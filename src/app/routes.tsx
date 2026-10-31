import { lazy, Suspense } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { PageLoader } from './PageLoader'
import { RouteErrorPage } from './RouteErrorPage'
import { AuthLayout } from './layouts/AuthLayout'
import { MarketingLayout } from './layouts/MarketingLayout'
import { RootLayout } from './layouts/RootLayout'

const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'))
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const TemplateDetailPage = lazy(() => import('@/pages/TemplateDetailPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const CreatePage = lazy(() => import('@/pages/CreatePage'))
const LocalEditorPage = lazy(() => import('@/pages/LocalEditorPage'))
const EmbedEditorPage = lazy(() => import('@/pages/EmbedEditorPage'))
const EmbedStudioPage = lazy(() => import('@/pages/EmbedStudioPage'))
const EmbedTemplatesPage = lazy(() => import('@/pages/EmbedTemplatesPage'))
const DesignEditorPage = lazy(() => import('@/pages/DesignEditorPage'))
const SharedDesignPage = lazy(() => import('@/pages/SharedDesignPage'))
const SiteApp = lazy(() => import('@/site/SiteApp'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
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

const page = (element: React.ReactNode) => <Suspense fallback={<PageLoader />}>{element}</Suspense>


export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          { index: true, element: <Navigate to="/shop" replace /> },
          { path: 'templates', element: <TemplatesPage /> },
          { path: 'templates/:slug', element: <TemplateDetailPage /> },
          { path: 'features', element: <FeaturesPage /> },
          { path: 'faq', element: <FaqPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
        ],
      },
      { path: 'shop/*', element: page(<SiteApp />) },
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
