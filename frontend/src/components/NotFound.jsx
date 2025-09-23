import { Home, ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Main Error Display */}
        <div className="relative mb-8">
          <div className="text-[12rem] md:text-[16rem] font-bold text-blue-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600 text-white p-6 rounded-full shadow-lg transform -rotate-12 hover:rotate-0 transition-transform duration-300">
              <Search size={48} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-blue-700 text-lg mb-6 leading-relaxed">
            The page you're looking for seems to have wandered off into the
            digital void. Don't worry though, we'll help you find your way back!
          </p>

          {/* Suggestions */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">
              What you can do:
            </h3>
            <ul className="text-blue-600 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Check the URL for typos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Use the navigation menu to browse our site
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Go back to the homepage and start fresh
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Home
                size={20}
                className="group-hover:rotate-12 transition-transform duration-200"
              />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="group bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform duration-200"
              />
              Go Back
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-blue-500 text-sm">
          <p>
            Still having trouble?{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Contact our support team
            </a>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-50 animate-pulse hidden md:block"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-300 rounded-full opacity-30 animate-bounce hidden md:block"></div>
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-blue-400 rounded-full opacity-20 animate-ping hidden lg:block"></div>
      </div>
    </div>
  );
};

export default NotFound;
