import React, { useState } from 'react';
import { Search, Calendar, User, Activity, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { mockAuditLogs } from '../mock/MockData';

const AuditLog = () => {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'CREATE', label: 'Create Operations' },
    { value: 'UPDATE', label: 'Update Operations' },
    { value: 'DELETE', label: 'Delete Operations' },
    { value: 'LOGIN', label: 'Login Activities' },
    { value: 'SYSTEM', label: 'System Changes' }
  ];

  const adminOptions = [
    { value: 'all', label: 'All Admins' },
    { value: 'superadmin_001', label: 'Super Admin' },
    { value: 'admin_001', label: 'Ahmad Rizki' },
    { value: 'admin_002', label: 'Siti Nurhaliza' },
    { value: 'admin_003', label: 'Budi Santoso' }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
    const matchesAdmin = adminFilter === 'all' || log.adminId === adminFilter;
    
    return matchesSearch && matchesAction && matchesDate && matchesAdmin;
  });

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  const getActionBadge = (action) => {
    const badgeVariants = {
      'CREATE': 'success',
      'UPDATE': 'default',
      'DELETE': 'destructive',
      'LOGIN': 'secondary',
      'SYSTEM': 'default'
    };
    
    const actionType = action.split('_')[0];
    return <Badge variant={badgeVariants[actionType] || 'default'}>{action}</Badge>;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getActivityIcon = (action) => {
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('LOGIN')) return '🔐';
    return '⚡';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Audit Log</h3>
        <p className="text-gray-600">Track all administrative actions and system changes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action-filter">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="admin-filter">Admin</Label>
              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin" />
                </SelectTrigger>
                <SelectContent>
                  {adminOptions.map((admin) => (
                    <SelectItem key={admin.value} value={admin.value}>
                      {admin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredLogs.length}</span> audit logs
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">
                      <span className="text-lg" title={log.action}>
                        {getActivityIcon(log.action)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.adminName}</p>
                        <p className="text-xs text-gray-500">{log.adminId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate" title={log.description}>
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {log.ipAddress}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">➕</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Create Actions</p>
                <p className="font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">✏️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Update Actions</p>
                <p className="font-bold">28</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🗑️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delete Actions</p>
                <p className="font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔐</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Login Activities</p>
                <p className="font-bold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Log ID</Label>
                  <p className="text-sm text-gray-600">{selectedLog.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action Type</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Admin</Label>
                  <p className="text-sm text-gray-600">{selectedLog.adminName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Admin ID</Label>
                  <p className="text-sm text-gray-600">{selectedLog.adminId}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600">{selectedLog.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-gray-600">{formatDateTime(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedLog.ipAddress}</p>
                </div>
              </div>
              <Button onClick={() => setIsDetailsModalOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLog;