import ImageSlider from "./ImageSlider";
import { mockImages } from "../utils/mockImages";
import { CategoryGrid } from "./CategoryGrid";
import TrendingProducts from "./TrendingProducts";
import NewProduct from "./NewProduct";
import {mockProducts} from "../utils/mockDataProduct";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-12">
      {/* Image Slider */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImageSlider images={mockImages} autoSlideInterval={4000} />
      </div>

      {/* Featured Categories */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryGrid />
      </div>

      {/* Trending Products */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingProducts />
      </div>

      {/* New Products */}
      <div className="mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewProduct products={mockProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
