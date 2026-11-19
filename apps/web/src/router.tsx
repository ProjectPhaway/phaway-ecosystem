import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { CatalogPage } from './pages/CatalogPage';
import { ContactPage } from './pages/ContactPage';
import { CustomPage } from './pages/CustomPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';
import { Layout } from './routes/Layout';
import { AdminStubPage } from './admin/AdminStubPage';

// Admin lazy-loaded: el publico no descarga el panel. Vite les asigna chunks
// "admin-*" y los pide solo cuando el usuario navega a /admin/...
const AdminShell = lazy(() => import('./admin/AdminShell').then((m) => ({ default: m.AdminShell })));
const LoginPage = lazy(() => import('./admin/LoginPage').then((m) => ({ default: m.LoginPage })));
const InicioPage = lazy(() => import('./admin/InicioPage').then((m) => ({ default: m.InicioPage })));
const ProductsListPage = lazy(() => import('./admin/ProductsListPage').then((m) => ({ default: m.ProductsListPage })));
const ProductFormPage = lazy(() => import('./admin/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const OrdersPage = lazy(() => import('./admin/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const NewOrderPage = lazy(() => import('./admin/NewOrderPage').then((m) => ({ default: m.NewOrderPage })));
const OrderDetailPage = lazy(() => import('./admin/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const SizeGuidePage = lazy(() => import('./admin/SizeGuidePage').then((m) => ({ default: m.SizeGuidePage })));
const PerfilPage = lazy(() => import('./admin/PerfilPage').then((m) => ({ default: m.PerfilPage })));
const ForgotPasswordPage = lazy(() => import('./admin/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./admin/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const ActivateAccountPage = lazy(() => import('./admin/ActivateAccountPage').then((m) => ({ default: m.ActivateAccountPage })));
const UsersPage = lazy(() => import('./admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const CustomersPage = lazy(() => import('./admin/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CouponsPage = lazy(() => import('./admin/CouponsPage').then((m) => ({ default: m.CouponsPage })));

// El fallback de Suspense se define en main.tsx alrededor del RouterProvider.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'liquidacion', element: <CatalogPage key="sale" onSale /> },
      { path: 'producto/:slug', element: <ProductPage /> },
      { path: 'personalizados', element: <CustomPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/admin', element: <LoginPage /> },
  { path: '/admin/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/admin/reset-password', element: <ResetPasswordPage /> },
  { path: '/admin/activar', element: <ActivateAccountPage /> },
  {
    path: '/admin',
    element: <AdminShell />,
    children: [
      { path: 'inicio', element: <InicioPage /> },
      { path: 'productos', element: <ProductsListPage /> },
      { path: 'productos/nuevo', element: <ProductFormPage /> },
      { path: 'productos/:id', element: <ProductFormPage /> },
      {
        path: 'categorias',
        element: (
          <AdminStubPage
            title="Categorias"
            description="Reordenar y editar las categorias del catalogo."
          />
        ),
      },
      { path: 'guia-tallas', element: <SizeGuidePage /> },
      { path: 'ventas', element: <OrdersPage /> },
      { path: 'ventas/nuevo', element: <NewOrderPage /> },
      { path: 'ventas/:id', element: <OrderDetailPage /> },
      { path: 'cupones', element: <CouponsPage /> },
      { path: 'clientes', element: <CustomersPage /> },
      { path: 'usuarios', element: <UsersPage /> },
      { path: 'perfil', element: <PerfilPage /> },
    ],
  },
]);
