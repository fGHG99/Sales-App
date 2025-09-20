const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 199.99,
    rating: 4.8,
    reviews: 324,
    category: "electronics",
    img: "/assets/20130807_1.jpg",
    inStock: true,
    description:
      "Experience superior sound quality with our premium wireless headphones. Featuring advanced noise cancellation technology, these headphones deliver crystal-clear audio whether you're listening to music, taking calls, or watching movies. The ergonomic design ensures comfortable wearing for extended periods, while the long-lasting battery provides up to 30 hours of continuous playback. Perfect for audiophiles and casual listeners alike.",
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Bluetooth 5.0 connectivity",
      "Quick charge technology",
      "Comfortable over-ear design",
    ],
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 299.99,
    rating: 4.6,
    reviews: 187,
    category: "wearables",
    img: "/assets/20130807_1.jpg",

    inStock: true,
    description:
      "Track your fitness goals with this advanced smart watch. Monitor heart rate, sleep patterns, and daily activities with precision. The bright AMOLED display is easy to read in any lighting condition, and the water-resistant design makes it perfect for swimming and outdoor activities. Stay connected with smart notifications and built-in GPS for accurate workout tracking.",
    features: [
      "Heart rate monitoring",
      "GPS tracking",
      "Water resistant up to 50m",
      "7-day battery life",
      "Sleep tracking",
      "Multiple sport modes",
    ],
  },
  {
    id: 3,
    name: "Professional Camera Lens",
    price: 899.99,
    rating: 4.9,
    reviews: 92,
    category: "photography",
    img: "/assets/20130807_1.jpg",

    inStock: false,
    description:
      "Capture stunning photos with this professional-grade camera lens. Designed for serious photographers, this lens offers exceptional img quality with sharp focus and beautiful bokeh effects. The weather-sealed construction ensures reliable performance in challenging conditions, while the fast autofocus system helps you never miss the perfect shot.",
    features: [
      "Weather-sealed construction",
      "Fast autofocus system",
      "Superior img stabilization",
      "Professional-grade optics",
      "Compatible with multiple camera brands",
    ],
  },
  {
    id: 4,
    name: "Ergonomic Office Chair",
    price: 449.99,
    rating: 4.5,
    reviews: 203,
    category: "furniture",
    img: "/assets/20130807_1.jpg",

    inStock: true,
    description:
      "Transform your workspace with this ergonomic office chair designed for maximum comfort and productivity. Featuring adjustable lumbar support, breathable mesh backing, and premium cushioning, this chair reduces strain during long work sessions. The robust construction and smooth-rolling casters ensure durability and mobility in any office environment.",
    features: [
      "Adjustable lumbar support",
      "Breathable mesh design",
      "360-degree swivel",
      "Height adjustable",
      "Premium cushioning",
      "Smooth-rolling casters",
    ],
  },
  {
    id: 5,
    name: "Portable Bluetooth Speaker",
    price: 79.99,
    rating: 4.4,
    reviews: 156,
    category: "electronics",
    img: "/assets/20130807_1.jpg",

    inStock: true,
    description:
      "Take your music anywhere with this compact yet powerful Bluetooth speaker. Despite its small size, it delivers rich, room-filling sound with deep bass and clear highs. The rugged, waterproof design makes it perfect for outdoor adventures, pool parties, or beach trips. Connect multiple devices and enjoy up to 12 hours of continuous playback.",
    features: [
      "Waterproof design (IPX7)",
      "12-hour battery life",
      "360-degree sound",
      "Compact and portable",
      "Multi-device connectivity",
      "Built-in microphone for calls",
    ],
  },
];

export const getProductBySlug = (slug) => {
    const productName = slug.replace(/-/g, ' ');
    return mockProducts.find(product => 
        product.name.toLowerCase() === productName.toLowerCase()
    );
};

export default mockProducts;
