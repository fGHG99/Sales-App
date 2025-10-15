import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Calendar,
  Store,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getStores,
  generateReport,
  downloadFile,
  extractFilename,
} from "../../../services/superAdminReportService";

const GlobalReports = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: "sales",
    storeFilter: "all",
    dateFrom: "",
    dateTo: "",
    format: "excel",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const debouncedStoreSearch = useDebounce(storeSearchTerm, 300);

  // Date range state
  const [dateRange, setDateRange] = useState("week"); // week, month, all, custom

  // API state
  const [stores, setStores] = useState([]);
  const [totalStores, setTotalStores] = useState(0);
  const [activeStores, setActiveStores] = useState(0);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState(null);

  const reportTypes = [
    {
      value: "sales",
      label: "Sales Report",
      description: "Revenue and transaction data",
    },
  ];

  const formatOptions = [
    {
      value: "excel",
      label: "Excel (.xlsx)",
      description: "Spreadsheet format with charts",
    },
    {
      value: "csv",
      label: "CSV (.csv)",
      description: "Comma-separated values",
    },
  ];

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Update date range when dateRange changes
  useEffect(() => {
    const updateDateRange = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      let startDate, endDate;

      switch (dateRange) {
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 6);
          startDate = weekAgo.toISOString().split("T")[0];
          endDate = todayStr;
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setDate(today.getDate() - 29);
          startDate = monthAgo.toISOString().split("T")[0];
          endDate = todayStr;
          break;
        case "all":
          // Get the earliest store creation date from API
          try {
            const response = await getStores();
            if (response.success && response.data.stores.length > 0) {
              // Find the earliest store creation date
              const earliestStore = response.data.stores.reduce(
                (earliest, store) => {
                  if (
                    !earliest ||
                    new Date(store.createdAt) < new Date(earliest.createdAt)
                  ) {
                    return store;
                  }
                  return earliest;
                }
              );

              if (earliestStore && earliestStore.createdAt) {
                startDate = new Date(earliestStore.createdAt)
                  .toISOString()
                  .split("T")[0];
              } else {
                // Fallback to 1 year ago if no valid date found
                const yearAgo = new Date(today);
                yearAgo.setFullYear(today.getFullYear() - 1);
                startDate = yearAgo.toISOString().split("T")[0];
              }
            } else {
              // Fallback to 1 year ago if no stores found
              const yearAgo = new Date(today);
              yearAgo.setFullYear(today.getFullYear() - 1);
              startDate = yearAgo.toISOString().split("T")[0];
            }
          } catch (error) {
            console.error("Error fetching stores for all time range:", error);
            // Fallback to 1 year ago on error
            const yearAgo = new Date(today);
            yearAgo.setFullYear(today.getFullYear() - 1);
            startDate = yearAgo.toISOString().split("T")[0];
          }
          endDate = todayStr;
          break;
        case "custom":
          // Keep existing custom dates
          return;
        default:
          startDate = todayStr;
          endDate = todayStr;
      }

      setReportConfig((prev) => ({
        ...prev,
        dateFrom: startDate,
        dateTo: endDate,
      }));
    };

    updateDateRange();
  }, [dateRange]);

  const fetchStores = async () => {
    try {
      setIsLoadingStores(true);
      setStoresError(null);

      const response = await getStores();

      if (response.success && response.data) {
        setStores(response.data.stores);
        setTotalStores(response.data.totalStores);
        setActiveStores(response.data.activeStores);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
      setStoresError("Failed to load stores data");
    } finally {
      setIsLoadingStores(false);
    }
  };

  const storeOptions = [
    { value: "all", label: "All Stores" },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];

  // Filter stores based on search term
  const filteredStoreOptions = storeOptions.filter((option) =>
    option.label.toLowerCase().includes(debouncedStoreSearch.toLowerCase())
  );

  // Handle store dropdown open/close
  const handleStoreDropdownOpenChange = (open) => {
    setIsStoreDropdownOpen(open);
    if (!open) {
      // Clear search term when dropdown closes
      setStoreSearchTerm("");
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDateRange("custom"); // Switch to custom when user manually changes dates
    setReportConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      const response = await generateReport(reportConfig);

      // Create blob from response
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      const fallbackFilename = `${
        reportConfig.reportType
      }_report_${Date.now()}.${
        reportConfig.format === "excel" ? "xlsx" : "csv"
      }`;
      const filename = extractFilename(contentDisposition, fallbackFilename);

      // Trigger download
      downloadFile(blob, filename);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfigValid =
    reportConfig.reportType &&
    reportConfig.storeFilter &&
    reportConfig.dateFrom &&
    reportConfig.dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Global Reports</h3>
        <p className="text-gray-600">
          Generate and export comprehensive business reports
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportConfig.reportType}
                  onValueChange={(value) =>
                    setReportConfig({ ...reportConfig, reportType: value })
                  }
                >
                  <SelectTrigger className="px-6 py-6">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Store Filter */}
              <div className="space-y-2">
                <Label htmlFor="storeFilter">Store Selection</Label>
                <Select
                  value={reportConfig.storeFilter}
                  onValueChange={(value) =>
                    setReportConfig({ ...reportConfig, storeFilter: value })
                  }
                  open={isStoreDropdownOpen}
                  onOpenChange={handleStoreDropdownOpenChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search stores..."
                          value={storeSearchTerm}
                          onChange={(e) => setStoreSearchTerm(e.target.value)}
                          className="pl-10"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingStores ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Loading stores...
                        </div>
                      ) : storesError ? (
                        <div className="p-2 text-sm text-red-500 text-center">
                          Error loading stores
                        </div>
                      ) : filteredStoreOptions.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          No stores found
                        </div>
                      ) : (
                        filteredStoreOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Selection */}
              <div className="space-y-3">
                <Label>Date Range</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "week", label: "Last 7 Days" },
                    { value: "month", label: "Last 30 Days" },
                    { value: "all", label: "All Time" },
                    { value: "custom", label: "Custom Range" },
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={
                        dateRange === range.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setDateRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={reportConfig.dateFrom}
                    onChange={(e) =>
                      handleCustomDateChange("dateFrom", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={reportConfig.dateTo}
                    onChange={(e) =>
                      handleCustomDateChange("dateTo", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label htmlFor="format">Export Format</Label>
                <Select
                  value={reportConfig.format}
                  onValueChange={(value) =>
                    setReportConfig({ ...reportConfig, format: value })
                  }
                >
                  <SelectTrigger className="px-6 py-6">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{format.label}</div>
                          <div className="text-sm text-gray-500">
                            {format.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Error Message */}
              {storesError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{storesError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStores}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Generate Button */}
              <div className="pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={
                    !isConfigValid ||
                    isGenerating ||
                    isLoadingStores ||
                    storesError
                  }
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate & Download Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview - Commented out */}
          {/* {reportConfig.reportType && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  Preview of data that will be included in your report
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {previewData.totalRecords} total records
                    </Badge>
                    <Badge variant="secondary">
                      {reportTypes.find(t => t.value === reportConfig.reportType)?.label}
                    </Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <tbody>
                        {previewData.sampleData.map((row, index) => (
                          <tr key={index} className={index === 0 ? 'bg-gray-50 font-medium' : ''}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border px-2 py-1">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>

        {/* Report Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Stores</span>
                <Badge>{isLoadingStores ? "..." : totalStores}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Stores</span>
                <Badge variant="success">
                  {isLoadingStores ? "..." : activeStores}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Report Period</span>
                <span className="text-sm font-medium">
                  {reportConfig.dateFrom && reportConfig.dateTo
                    ? `${reportConfig.dateFrom} to ${reportConfig.dateTo}`
                    : "Select date range"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Report Type</span>
                <Badge variant="secondary">Sales Report</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Export Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Report Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-medium text-blue-800">Excel Format</p>
                  <p className="text-blue-600">
                    Includes store info, date range, and detailed sales data
                  </p>
                </div>

                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-800">CSV Format</p>
                  <p className="text-green-600">
                    Clean data format for analysis and import
                  </p>
                </div>

                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <p className="font-medium text-purple-800">Report Includes</p>
                  <p className="text-purple-600">
                    Store name, period, export date, revenue summary, and
                    detailed order items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GlobalReports;
