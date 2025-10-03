import React, { useState } from 'react';
import { Download, FileText, Calendar, Store, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { mockStores, mockSalesData } from '../mock/MockData';

const GlobalReports = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'sales',
    storeFilter: 'all',
    dateFrom: '',
    dateTo: '',
    format: 'excel'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'sales', label: 'Sales Report', description: 'Revenue and transaction data' },
    { value: 'inventory', label: 'Inventory Report', description: 'Stock levels and product data' },
    { value: 'orders', label: 'Orders Report', description: 'Order history and status' },
    { value: 'customers', label: 'Customer Report', description: 'User activity and demographics' },
    { value: 'performance', label: 'Store Performance', description: 'Store-wise metrics and KPIs' }
  ];

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)', description: 'Spreadsheet format with charts' },
    { value: 'csv', label: 'CSV (.csv)', description: 'Comma-separated values' },
    { value: 'pdf', label: 'PDF (.pdf)', description: 'Formatted report document' }
  ];

  const storeOptions = [
    { value: 'all', label: 'All Stores' },
    ...mockStores.map(store => ({ value: store.id, label: store.label }))
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const filename = `${reportConfig.reportType}_report_${Date.now()}.${reportConfig.format === 'excel' ? 'xlsx' : reportConfig.format}`;
      
      // In a real app, this would trigger an actual download
      console.log('Generating report with config:', reportConfig);
      console.log('Report would be saved as:', filename);
      
      // Simulate download
      alert(`Report "${filename}" has been generated and downloaded!`);
      setIsGenerating(false);
    }, 2000);
  };

  const getPreviewData = () => {
    switch (reportConfig.reportType) {
      case 'sales':
        return {
          totalRecords: mockSalesData.daily.length,
          sampleData: [
            ['Date', 'Store', 'Revenue', 'Orders', 'Items Sold'],
            ['2024-09-15', 'Jakarta Central Store', 'IDR 15,750,000', '45', '180'],
            ['2024-09-15', 'Surabaya Mall Store', 'IDR 12,300,000', '32', '128'],
            ['...', '...', '...', '...', '...']
          ]
        };
      case 'inventory':
        return {
          totalRecords: 450,
          sampleData: [
            ['Product ID', 'Name', 'Category', 'Stock', 'Value'],
            ['PRD_001', 'Beras Premium 5kg', 'Makanan Pokok', '150', 'IDR 11,250,000'],
            ['PRD_002', 'Susu UHT 1L', 'Minuman', '85', 'IDR 1,530,000'],
            ['...', '...', '...', '...', '...']
          ]
        };
      default:
        return {
          totalRecords: 0,
          sampleData: []
        };
    }
  };

  const previewData = getPreviewData();
  const isConfigValid = reportConfig.reportType && reportConfig.storeFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Global Reports</h3>
        <p className="text-gray-600">Generate and export comprehensive business reports</p>
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
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={reportConfig.reportType} 
                  onValueChange={(value) => setReportConfig({...reportConfig, reportType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Store Filter */}
              <div>
                <Label htmlFor="storeFilter">Store Selection</Label>
                <Select 
                  value={reportConfig.storeFilter} 
                  onValueChange={(value) => setReportConfig({...reportConfig, storeFilter: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stores" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={reportConfig.dateFrom}
                    onChange={(e) => setReportConfig({...reportConfig, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={reportConfig.dateTo}
                    onChange={(e) => setReportConfig({...reportConfig, dateTo: e.target.value})}
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select 
                  value={reportConfig.format} 
                  onValueChange={(value) => setReportConfig({...reportConfig, format: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-sm text-gray-500">{format.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={!isConfigValid || isGenerating}
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

          {/* Data Preview */}
          {reportConfig.reportType && (
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
          )}
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
                <Badge>{mockStores.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Stores</span>
                <Badge variant="success">
                  {mockStores.filter(s => s.status === 'active').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Report Period</span>
                <span className="text-sm font-medium">
                  {reportConfig.dateFrom && reportConfig.dateTo 
                    ? `${reportConfig.dateFrom} to ${reportConfig.dateTo}`
                    : 'All time'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Sales Report</p>
                    <p className="text-gray-600">Generated today</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Inventory Report</p>
                    <p className="text-gray-600">Generated yesterday</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Performance Report</p>
                    <p className="text-gray-600">Generated 2 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Export Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-medium text-blue-800">Excel Format</p>
                  <p className="text-blue-600">Includes charts and formatted data</p>
                </div>
                
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-800">CSV Format</p>
                  <p className="text-green-600">Best for data analysis and import</p>
                </div>
                
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <p className="font-medium text-purple-800">PDF Format</p>
                  <p className="text-purple-600">Professional presentation format</p>
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