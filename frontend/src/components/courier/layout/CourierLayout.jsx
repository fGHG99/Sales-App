import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import CourierNavbar from "../pages/CourierNavbar";

/**
 * Courier Layout Component
 * Separates navigation from main content rendering
 */
const CourierLayout = () => {
  return (
    <>
      {/* Courier Navigation */}
      <CourierNavbar />

      {/* Courier page content */}
      <main className="min-h-screen bg-gray-50">
        <ScrollRestoration />
        <Outlet />
      </main>
    </>
  );
};

export default CourierLayout;
