export default function NotFoundMaptiler() {
  return (
    <div className="w-full h-screen bg-red-50 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-800 mb-4">
          MapTiler API Key Required
      </h2>
      <p className="text-red-600 mb-4">
        Please add your MapTiler API key to your .env file:
      </p>
      <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left">
        VITE_MAPTILER_API_KEY=your_actual_api_key_here
      </div>
      <p className="text-sm text-gray-600 mt-4">
        Get your free API key at{" "}
        <a
          href="https://cloud.maptiler.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          cloud.maptiler.com
        </a>
      </p>
    </div>
  </div>
)}

