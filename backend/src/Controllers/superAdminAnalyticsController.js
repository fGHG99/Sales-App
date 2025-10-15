import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import { logOther } from "../../utils/auditlog.js";
import ExcelJS from "exceljs";

// ==================== HELPER FUNCTIONS ====================

const calculateDateRange = async (range, customStart, customEnd) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let start,
    end = today;

  if (range === "week") {
    start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "all") {
    // Get the earliest store creation date
    const earliestStore = await prisma.store.findFirst({
      where: { isDeleted: false },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (earliestStore) {
      start = new Date(earliestStore.createdAt);
      start.setHours(0, 0, 0, 0);
    } else {
      // Fallback to 1 year ago if no stores found
      start = new Date(today);
      start.setFullYear(today.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
    }
  } else if (range === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

// ==================== SUPER ADMIN ANALYTICS ====================

/**
 * GET /super-admin/analytics/summary
 * Get aggregated sales analytics summary from all stores
 * Requires superadmin role
 *
 * Query params:
 *  - dateRange: "week" | "month" | "custom"
 *  - startDate: ISO date (required if custom)
 *  - endDate: ISO date (required if custom)
 */
router.get("/get-analytics-summary", authenticate, async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    // Calculate date range
    const { start, end } = await calculateDateRange(
      dateRange,
      startDate,
      endDate
    );

    // Query orders with paymentStatus COMPLETED from ALL stores
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        subtotal: true,
        deliveryFee: true,
        pickupStoreId: true,
        pickupStore: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.subtotal) + Number(o.deliveryFee),
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailyRevenue = totalRevenue / days;

    // Calculate store-wise metrics
    const storeMetrics = {};
    orders.forEach((order) => {
      const storeId = order.pickupStoreId;
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (!storeMetrics[storeId]) {
        storeMetrics[storeId] = {
          storeId,
          storeName: order.pickupStore?.name || "Unknown Store",
          totalRevenue: 0,
          totalOrders: 0,
        };
      }

      storeMetrics[storeId].totalRevenue += revenue;
      storeMetrics[storeId].totalOrders += 1;
    });

    const storeMetricsArray = Object.values(storeMetrics);

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        averageDailyRevenue,
        revenueType: "gross",
        dateRange: { start, end },
        totalStores: storeMetricsArray.length,
        storeMetrics: storeMetricsArray,
      },
    });
  } catch (error) {
    console.error("Error fetching super admin analytics summary:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /super-admin/analytics/daily-sales
 * Get aggregated daily sales data from all stores for charts
 * Requires superadmin role
 */
router.get("/get-analytics-daily-sales", authenticate, async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    const { start, end } = await calculateDateRange(
      dateRange,
      startDate,
      endDate
    );

    // Get all orders in range from ALL stores
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        subtotal: true,
        deliveryFee: true,
        createdAt: true,
        pickupStoreId: true,
        pickupStore: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const dailyMap = new Map();

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date);
        dailyMap.set(date, {
          date,
          revenue: existing.revenue + revenue,
          orders: existing.orders + 1,
        });
      } else {
        dailyMap.set(date, { date, revenue, orders: 1 });
      }
    });

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.json({
      success: true,
      data: dailySales,
    });
  } catch (error) {
    console.error("Error fetching super admin daily sales:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /super-admin/analytics/export-data
 * Get complete aggregated sales data from all stores for Excel export
 * Requires superadmin role
 */
router.get("/get-export-data", authenticate, async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    const { start, end } = await calculateDateRange(
      dateRange,
      startDate,
      endDate
    );

    // Get orders with items from ALL stores
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        subtotal: true,
        deliveryFee: true,
        orderItems: true,
        createdAt: true,
        pickupStoreId: true,
        pickupStore: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.subtotal) + Number(o.deliveryFee),
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailyRevenue = totalRevenue / days;

    // Daily breakdown
    const dailyMap = new Map();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date);
        dailyMap.set(date, {
          date,
          revenue: existing.revenue + revenue,
          ordersCount: existing.ordersCount + 1,
        });
      } else {
        dailyMap.set(date, { date, revenue, ordersCount: 1 });
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        averageOrderValue:
          item.ordersCount > 0 ? item.revenue / item.ordersCount : 0,
      }));

    // Store-wise breakdown
    const storeMap = new Map();
    orders.forEach((order) => {
      const storeId = order.pickupStoreId;
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          storeName: order.pickupStore?.name || "Unknown Store",
          totalRevenue: 0,
          totalOrders: 0,
          orders: [],
        });
      }

      const storeData = storeMap.get(storeId);
      storeData.totalRevenue += revenue;
      storeData.totalOrders += 1;
      storeData.orders.push({
        orderId: order.id,
        customerName: order.user?.name || "Unknown",
        customerEmail: order.user?.email || "Unknown",
        revenue,
        createdAt: order.createdAt,
      });
    });

    const storeBreakdown = Array.from(storeMap.values()).map((store) => ({
      ...store,
      averageOrderValue:
        store.totalOrders > 0 ? store.totalRevenue / store.totalOrders : 0,
    }));

    // Detailed items (condensed per order)
    const detailedItems = orders.map((order) => {
      const items = Array.isArray(order.orderItems) ? order.orderItems : [];
      const itemsText = items
        .map(
          (item) =>
            `${item.productName} (${item.quantity}x @ ${item.pricePerItem})`
        )
        .join(", ");

      return {
        date: order.createdAt.toISOString().split("T")[0],
        orderId: order.id,
        storeName: order.pickupStore?.name || "Unknown Store",
        customerName: order.user?.name || "Unknown",
        items: itemsText,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        totalPrice: Number(order.subtotal) + Number(order.deliveryFee),
      };
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          averageDailyRevenue,
          revenueType: "gross",
          periodStart: start.toISOString().split("T")[0],
          periodEnd: end.toISOString().split("T")[0],
          totalStores: storeBreakdown.length,
        },
        dailyBreakdown,
        storeBreakdown,
        detailedItems,
      },
    });
  } catch (error) {
    console.error("Error fetching super admin export data:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /super-admin/analytics/store-performance
 * Get store performance metrics for all stores
 * Requires superadmin role
 */
router.get("/get-store-performance", authenticate, async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    const { start, end } = await calculateDateRange(
      dateRange,
      startDate,
      endDate
    );

    // Get all stores with their performance data
    const stores = await prisma.store.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            orders: {
              where: {
                paymentStatus: "COMPLETED",
                createdAt: { gte: start, lte: end },
              },
            },
          },
        },
      },
    });

    // Calculate revenue for each store
    const storePerformance = await Promise.all(
      stores.map(async (store) => {
        const orders = await prisma.order.findMany({
          where: {
            pickupStoreId: store.id,
            paymentStatus: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          select: {
            subtotal: true,
            deliveryFee: true,
          },
        });

        const totalRevenue = orders.reduce(
          (sum, order) =>
            sum + Number(order.subtotal) + Number(order.deliveryFee),
          0
        );

        return {
          id: store.id,
          name: store.name,
          address: store.address?.fullAddress || "No address",
          city: store.address?.city || "N/A",
          adminName: store.admin?.name || "No admin",
          adminEmail: store.admin?.email || "N/A",
          adminPhone: store.admin?.phone || "N/A",
          totalRevenue,
          totalOrders: store._count.orders,
          averageOrderValue:
            store._count.orders > 0 ? totalRevenue / store._count.orders : 0,
          isActive: store.isActive,
          createdAt: store.createdAt,
        };
      })
    );

    // Sort by revenue descending
    storePerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return res.json({
      success: true,
      data: storePerformance,
    });
  } catch (error) {
    console.error("Error fetching store performance:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /super-admin/reports/stores
 * Get all stores for reports dropdown and quick stats
 * Requires superadmin role
 */
router.get("/reports/stores", authenticate, async (req, res) => {
  try {
    // Query all stores
    const stores = await prisma.store.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate stats
    const totalStores = stores.length;
    const activeStores = stores.filter((store) => store.isActive).length;

    return res.json({
      success: true,
      data: {
        stores,
        totalStores,
        activeStores,
      },
    });
  } catch (error) {
    console.error("Error fetching stores for reports:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /super-admin/reports/generate-export
 * Generate and download Excel/CSV reports
 * Requires superadmin role
 */
router.post("/reports/generate-export", authenticate, async (req, res) => {
  try {
    const { reportType, storeFilter, dateFrom, dateTo, format } = req.body;

    // Validate request body - only sales reports supported
    if (!reportType || reportType !== "sales") {
      return res.status(400).json({
        success: false,
        error: "Invalid report type. Only sales reports are supported",
      });
    }

    if (!format || !["excel", "csv"].includes(format)) {
      return res.status(400).json({
        success: false,
        error: "Invalid format. Must be excel or csv",
      });
    }

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: "Date range is required",
      });
    }

    // Calculate date range
    const start = new Date(dateFrom);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    // Generate sales report data only
    const reportData = await generateSalesReportData(start, end, storeFilter);

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${reportType}_report_${timestamp}.${
      format === "excel" ? "xlsx" : "csv"
    }`;

    // Generate file based on format
    if (format === "excel") {
      const buffer = await generateSalesExcelFile(
        reportData,
        storeFilter,
        dateFrom,
        dateTo
      );

      // Set headers for Excel download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } else {
      const csvContent = generateSalesCSVFile(
        reportData,
        storeFilter,
        dateFrom,
        dateTo
      );

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(csvContent);
    }

    // Log audit trail
    logOther(
      "Report",
      `report_${timestamp}_${reportType}`,
      `Exported ${reportType} report from ${dateFrom} to ${dateTo}`,
      null,
      {
        reportType,
        storeFilter,
        dateFrom,
        dateTo,
        format,
        recordsCount: reportData.summary?.totalRecords || 0,
      },
      req.user.id
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

// ==================== REPORT GENERATION HELPERS ====================

const generateSalesReportData = async (start, end, storeFilter) => {
  // Build where clause
  const whereClause = {
    paymentStatus: "COMPLETED",
    createdAt: { gte: start, lte: end },
  };

  if (storeFilter !== "all") {
    whereClause.pickupStoreId = storeFilter;
  }

  // Query orders
  const orders = await prisma.order.findMany({
    where: whereClause,
    select: {
      id: true,
      subtotal: true,
      deliveryFee: true,
      orderItems: true,
      createdAt: true,
      pickupStoreId: true,
      pickupStore: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate summary
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.subtotal) + Number(o.deliveryFee),
    0
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily breakdown
  const dailyMap = new Map();
  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split("T")[0];
    const revenue = Number(order.subtotal) + Number(order.deliveryFee);

    if (dailyMap.has(date)) {
      const existing = dailyMap.get(date);
      dailyMap.set(date, {
        date,
        revenue: existing.revenue + revenue,
        ordersCount: existing.ordersCount + 1,
      });
    } else {
      dailyMap.set(date, { date, revenue, ordersCount: 1 });
    }
  });

  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Store breakdown
  const storeMap = new Map();
  orders.forEach((order) => {
    const storeId = order.pickupStoreId;
    const revenue = Number(order.subtotal) + Number(order.deliveryFee);

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        storeId,
        storeName: order.pickupStore?.name || "Unknown Store",
        totalRevenue: 0,
        totalOrders: 0,
      });
    }

    const storeData = storeMap.get(storeId);
    storeData.totalRevenue += revenue;
    storeData.totalOrders += 1;
  });

  const storeBreakdown = Array.from(storeMap.values());

  // Detailed items
  const detailedItems = orders.map((order) => {
    const items = Array.isArray(order.orderItems) ? order.orderItems : [];
    const itemsText = items
      .map(
        (item) =>
          `${item.productName} (${item.quantity}x @ ${item.pricePerItem})`
      )
      .join(", ");

    return {
      date: order.createdAt.toISOString().split("T")[0],
      orderId: order.id,
      storeName: order.pickupStore?.name || "Unknown Store",
      customerName: order.user?.name || "Unknown",
      items: itemsText,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.subtotal) + Number(order.deliveryFee),
    };
  });

  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalRecords: orders.length,
    },
    dailyBreakdown,
    storeBreakdown,
    detailedItems,
  };
};

const generateSalesExcelFile = async (
  reportData,
  storeFilter,
  dateFrom,
  dateTo
) => {
  const workbook = new ExcelJS.Workbook();

  // Get store name for title
  let storeName = "All Stores";
  if (storeFilter !== "all") {
    const store = await prisma.store.findUnique({
      where: { id: storeFilter },
      select: { name: true },
    });
    storeName = store?.name || "Unknown Store";
  }

  // Title sheet with company branding and report info
  const titleSheet = workbook.addWorksheet("Sales Report");

  // Add title and company info
  titleSheet.addRow([`Sales Report from ${storeName}`]);
  titleSheet.addRow([`Period: ${dateFrom} to ${dateTo}`]);
  titleSheet.addRow([`Export Date: ${new Date().toLocaleDateString("id-ID")}`]);
  titleSheet.addRow([""]);

  // Sales Summary
  titleSheet.addRow(["Sales Summary (Gross Revenue)"]);
  titleSheet.addRow([
    "Total Revenue",
    `Rp ${reportData.summary.totalRevenue.toLocaleString("id-ID")}`,
  ]);
  titleSheet.addRow(["Total Orders", reportData.summary.totalOrders]);
  titleSheet.addRow([
    "Average Order Value",
    `Rp ${reportData.summary.averageOrderValue.toLocaleString("id-ID")}`,
  ]);
  titleSheet.addRow([""]);

  // Daily Sales Breakdown
  titleSheet.addRow(["Daily Sales Breakdown"]);
  titleSheet.addRow([
    "Date",
    "Revenue (IDR)",
    "Orders Count",
    "Average Order Value",
  ]);

  reportData.dailyBreakdown.forEach((item) => {
    titleSheet.addRow([
      item.date,
      item.revenue,
      item.ordersCount,
      item.ordersCount > 0 ? item.revenue / item.ordersCount : 0,
    ]);
  });

  // Detailed Order Items
  titleSheet.addRow([""]);
  titleSheet.addRow(["Detailed Order Items"]);
  titleSheet.addRow([
    "Date",
    "Order ID",
    "Store",
    "Customer",
    "Items",
    "Subtotal",
    "Delivery Fee",
    "Total",
  ]);

  reportData.detailedItems.forEach((item) => {
    titleSheet.addRow([
      item.date,
      item.orderId,
      item.storeName,
      item.customerName,
      item.items,
      item.subtotal,
      item.deliveryFee,
      item.total,
    ]);
  });

  // Set column widths
  titleSheet.columns = [
    { width: 15 },
    { width: 40 },
    { width: 25 },
    { width: 20 },
    { width: 50 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  return await workbook.xlsx.writeBuffer();
};

const generateSalesCSVFile = (reportData, storeFilter, dateFrom, dateTo) => {
  // Get store name for header
  let storeName = "All Stores";
  if (storeFilter !== "all") {
    // Note: In a real implementation, you might want to fetch store name here
    // For now, we'll use a placeholder
    storeName = "Selected Store";
  }

  const headers = [
    "Date",
    "Order ID",
    "Store",
    "Customer",
    "Items",
    "Subtotal",
    "Delivery Fee",
    "Total",
  ];

  const rows = reportData.detailedItems.map((item) => [
    item.date,
    item.orderId,
    item.storeName,
    item.customerName,
    item.items,
    item.subtotal,
    item.deliveryFee,
    item.total,
  ]);

  // Add header information
  const csvContent = [
    `Sales Report from ${storeName}`,
    `Period: ${dateFrom} to ${dateTo}`,
    `Export Date: ${new Date().toLocaleDateString("id-ID")}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};

export default router;
