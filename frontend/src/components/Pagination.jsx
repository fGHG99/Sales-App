import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage: externalCurrentPage = 1,
  totalPages = 5,
  onPageChange,
}) {
  const [currentPage, setCurrentPage] = useState(externalCurrentPage);

  // Sync internal state with external prop
  useEffect(() => {
    setCurrentPage(externalCurrentPage);
  }, [externalCurrentPage]);

  const handleClick = (page) => {
    setCurrentPage(page);
    if (onPageChange) onPageChange(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handleClick(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handleClick(currentPage + 1);
    }
  };

  // Generate page numbers with ellipsis for better UX
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 6) {
      // Show all pages if 6 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // For more than 6 pages: [current] [current+1] [...] [last]
      // Show current page
      pages.push(currentPage);

      // Show next page if not at end
      if (currentPage < totalPages) {
        pages.push(currentPage + 1);
      }

      // Show ellipsis if not near the end
      if (currentPage + 1 < totalPages) {
        pages.push("...");
      }

      // Always show last page if not already shown
      if (currentPage < totalPages && currentPage + 1 < totalPages) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`flex items-center px-3 py-2 rounded-md border transition-colors ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => (
        <React.Fragment key={`${page}-${index}`}>
          {page === "..." ? (
            <span className="px-3 py-2 text-gray-400">...</span>
          ) : (
            <button
              onClick={() => handleClick(page)}
              className={`px-3 py-2 rounded-md border transition-colors min-w-[40px] ${
                currentPage === page
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`flex items-center px-3 py-2 rounded-md border transition-colors ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
        }`}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
}
