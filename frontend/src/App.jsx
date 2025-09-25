import {
  createBrowserRouter,
  RouterProvider,
  useParams,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";
import TermsConditions from "./components/TermsCon";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/cart/Cart";
import NotFound from "./components/NotFound";
import ProductPageResult from "./components/ProductSearchResult";
import OrderHistory from "./components/OrderHistory";
import EditProfile from "./components/EditProfile";

// Mock category and other pages
const CategoryPage = () => {
  const { categoryName } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kategori: {categoryName}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Explore products in the {categoryName} category
          </p>
          <div className="bg-white rounded-lg shadow-md p-12">
            <p className="text-gray-500 text-xl">
              Coming soon - Products will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("q");

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hasil Pencarian
          </h1>
          <p className="text-lg text-gray-600 mb-8">Hasil untuk: "{query}"</p>
          <div className="bg-white rounded-lg shadow-md p-12">
            <p className="text-gray-500 text-xl">
              Coming soon - Search results will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "category/:categoryName", element: <CategoryPage /> },
      { path: "search", element: <ProductPageResult /> },
      { path: "cart", element: <Cart /> },
      { path: "terms-conditions", element: <TermsConditions /> },
      { path: "p/:productname", element: <ProductDetail /> },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "signin", element: <Login /> },
      { path: "signup", element: <Register /> },
    ],
  },
  {
    path: "/user",
    element: <Layout />,
    children: [
      { path: "orders", element: <OrderHistory /> },
      { path: "profile", element: <EditProfile /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
