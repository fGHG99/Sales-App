import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockData } from '../data/mockData';
import Pagination from '@/components/Pagination';

export default function AuditLog() {
  const [auditLogs, setAuditLogs] = useState(mockData.auditLog);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const getActionBadgeColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800 border-green-200',
      UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      LOGIN: 'bg-purple-100 text-purple-800 border-purple-200',
      LOGOUT: 'bg-gray-100 text-gray-800 border-gray-200',
      OTHER: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[action] || colors.OTHER;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatValue = (value) => {
    if (value === null) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="Account">Account</SelectItem>
                <SelectItem value="Role">Role</SelectItem>
                <SelectItem value="AccessKey">Access Key</SelectItem>
                <SelectItem value="SystemConfig">System Config</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center text-sm text-slate-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredLogs.length} of {auditLogs.length} logs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>
            Detailed record of all system activities and changes | Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.entity}</TableCell>
                  <TableCell className="font-mono text-sm">{log.entityId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.user}
                    </Badge>
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
                                <h4 className="font-medium text-slate-700 mb-2">Basic Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Log ID:</span>
                                    <span className="font-mono">{selectedLog.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Timestamp:</span>
                                    <span className="font-mono">{selectedLog.timestamp}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Action:</span>
                                    <Badge className={getActionBadgeColor(selectedLog.action)}>
                                      {selectedLog.action}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Entity:</span>
                                    <span>{selectedLog.entity}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Entity ID:</span>
                                    <span className="font-mono">{selectedLog.entityId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">User:</span>
                                    <Badge variant="outline">
                                      {selectedLog.user}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-slate-700 mb-2">Change Details</h4>
                                <div className="space-y-3">
                                  {selectedLog.oldValue && (
                                    <div>
                                      <span className="text-sm text-slate-500">Old Value:</span>
                                      <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32">
                                        {formatValue(selectedLog.oldValue)}
                                      </pre>
                                    </div>
                                  )}
                                  {selectedLog.newValue && (
                                    <div>
                                      <span className="text-sm text-slate-500">New Value:</span>
                                      <pre className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs overflow-auto max-h-32">
                                        {formatValue(selectedLog.newValue)}
                                      </pre>
                                    </div>
                                  )}
                                  {!selectedLog.oldValue && !selectedLog.newValue && (
                                    <div className="text-sm text-slate-500 italic">
                                      No change data available for this action
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
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No audit logs found matching your criteria
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > itemsPerPage && (
            <Pagination 
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'].map((action) => {
          const count = auditLogs.filter(log => log.action === action).length;
          return (
            <Card key={action}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{count}</div>
                <div className="text-sm text-slate-600">{action}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

