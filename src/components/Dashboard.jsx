import ImageSlider from "./ImageSlider";
import { mockImages } from "../utils/mockImages";
import { CategoryGrid } from "./CategoryGrid";
import TrendingProducts from "./TrendingProducts";
import NewProduct from "./NewProduct";
import mockProducts from "../utils/mockDataProduct";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-12">
      {/* Image Slider */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImageSlider images={mockImages} autoSlideInterval={4000} />
      </div>

      {/* Featured Categories */}
      <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {/* Logo kategori */}
          <img
            src="/assets/kategori_logo.png"
            alt="Kategori Logo"
            className="w-10 h-10"
          />
          <h2 className="text-2xl font-extrabold text-gray-900">
            Kategori Belanja
          </h2>
        </div>
        <CategoryGrid />
        <TrendingProducts />
        <NewProduct products={mockProducts} />
      </section>
    </div>
  );
};

export default Dashboard;
