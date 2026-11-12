import { createBrowserRouter } from 'react-router';
import { AdminLayout } from './admin/AdminLayout';
import { LoginPage } from './admin/LoginPage';
import { ProductFormPage } from './admin/ProductFormPage';
import { ProductsListPage } from './admin/ProductsListPage';
import { SalesPage } from './admin/SalesPage';
import { CatalogPage } from './pages/CatalogPage';
import { ContactPage } from './pages/ContactPage';
import { CustomPage } from './pages/CustomPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';
import { Layout } from './routes/Layout';

// Rutas Fase 1 (plan, seccion 9).
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
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'productos', element: <ProductsListPage /> },
      { path: 'productos/nuevo', element: <ProductFormPage /> },
      { path: 'productos/:id', element: <ProductFormPage /> },
      { path: 'ventas', element: <SalesPage /> },
    ],
  },
]);
