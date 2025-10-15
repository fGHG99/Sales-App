import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Search, Filter, Download, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import Pagination from "../../Pagination";
import {
  getAuditLogs,
  getAuditStats,
  exportAuditLogs,
  formatAuditLog,
  getActionBadgeColor,
  formatValue,
} from "../../../services/auditService";

export default function AuditLog() {
  // API state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30"); // days

  // UI state
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const itemsPerPage = 10;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build filters
      const filters = {
        limit: itemsPerPage,
        page: currentPage,
      };

      // Add filters if not 'all'
      if (actionFilter !== "all") {
        filters.action = actionFilter;
      }
      if (entityFilter !== "all") {
        filters.entity = entityFilter;
      }
      if (dateRange !== "all") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        filters.startDate = startDate.toISOString();
        filters.endDate = endDate.toISOString();
      }

      const response = await getAuditLogs(filters);

      if (response.success) {
        const formattedLogs = response.data.auditLogs.map(formatAuditLog);

        // Filter by search term on frontend (since backend doesn't support text search)
        const filteredLogs = searchTerm
          ? formattedLogs.filter(
              (log) =>
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : formattedLogs;

        setAuditLogs(filteredLogs);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || "Failed to load audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [
    actionFilter,
    entityFilter,
    dateRange,
    currentPage,
    itemsPerPage,
    searchTerm,
  ]);

  const fetchAuditStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await getAuditStats(parseInt(dateRange));

      if (response.success) {
        setAuditStats(response.data);
      } else {
        console.error("Failed to fetch audit stats:", response.error);
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [dateRange]);

  // Fetch audit logs and stats on component mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchAuditLogs();
      await fetchAuditStats();
    };
    fetchData();
  }, [fetchAuditLogs, fetchAuditStats]);

  // Fetch audit logs when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAuditLogs();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchAuditLogs]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const exportLogs = () => {
    try {
      exportAuditLogs(auditLogs);
    } catch (error) {
      console.error("Error exporting logs:", error);
      alert("Failed to export logs. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Log</h2>
          <p className="text-slate-600">Monitor and track system activities</p>
        </div>
        <Button onClick={exportLogs} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Order">Order</SelectItem>
                <SelectItem value="Store">Store</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Cart">Cart</SelectItem>
                <SelectItem value="Address">Address</SelectItem>
                <SelectItem value="Dispute">Dispute</SelectItem>
                <SelectItem value="DeliveryFeeSettings">
                  Delivery Fee
                </SelectItem>
                <SelectItem value="Report">Report</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-slate-600">
              <Filter className="w-4 h-4 mr-2" />
              {isLoading
                ? "Loading..."
                : `${pagination?.totalRecords || 0} logs`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={fetchAuditLogs}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>
            Detailed record of all system activities and changes | Showing{" "}
            {pagination?.totalRecords || 0} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading audit logs...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.entity}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.entityId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.user}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                              <DialogDescription>
                                Detailed information for log entry #{log.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-slate-700 mb-2">
                                      Basic Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Log ID:
                                        </span>
                                        <span className="font-mono">
                                          {selectedLog.id}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Timestamp:
                                        </span>
                                        <span className="font-mono">
                                          {selectedLog.timestamp}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Action:
                                        </span>
                                        <Badge
                                          className={getActionBadgeColor(
                                            selectedLog.action
                                          )}
                                        >
                                          {selectedLog.action}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Entity:
                                        </span>
                                        <span>{selectedLog.entity}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Entity ID:
                                        </span>
                                        <span className="font-mono">
                                          {selectedLog.entityId}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          User:
                                        </span>
                                        <Badge variant="outline">
                                          {selectedLog.user}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-slate-700 mb-2">
                                      Change Details
                                    </h4>
                                    <div className="space-y-3">
                                      {selectedLog.oldValues && (
                                        <div>
                                          <span className="text-sm text-slate-500">
                                            Old Value:
                                          </span>
                                          <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32">
                                            {formatValue(selectedLog.oldValues)}
                                          </pre>
                                        </div>
                                      )}
                                      {selectedLog.newValues && (
                                        <div>
                                          <span className="text-sm text-slate-500">
                                            New Value:
                                          </span>
                                          <pre className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs overflow-auto max-h-32">
                                            {formatValue(selectedLog.newValues)}
                                          </pre>
                                        </div>
                                      )}
                                      {!selectedLog.oldValues &&
                                        !selectedLog.newValues && (
                                          <div className="text-sm text-slate-500 italic">
                                            No change data available for this
                                            action
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No audit logs found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!isLoading && pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.currentPage || 1}
                totalPages={pagination.totalPages || 1}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {isLoadingStats
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          : auditStats && auditStats.actions
          ? ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"].map(
              (action) => {
                const count = auditStats.actions[action] || 0;
                return (
                  <Card key={action}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-slate-800">
                        {count}
                      </div>
                      <div className="text-sm text-slate-600">{action}</div>
                    </CardContent>
                  </Card>
                );
              }
            )
          : Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">-</div>
                  <div className="text-sm text-slate-600">Loading...</div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
