import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  Download,
  FileText,
  Loader2,
  BarChart2,
  PieChart as PieChartIcon,
  Table,
} from 'lucide-react';
import {
  fetchCategories,
  fetchReports,
  generateReport,
} from '../api';

const GenerateReports = () => {
  const [selectedReport, setSelectedReport] = useState('monthly');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const reportTypes = [
    {
      id: 'monthly',
      name: 'Monthly Summary',
      description: 'Detailed overview of monthly income and expenses',
      icon: BarChart2,
    },
    {
      id: 'category',
      name: 'Category Analysis',
      description: 'Breakdown of spending by category',
      icon: PieChartIcon,
    },
    {
      id: 'transactions',
      name: 'Transaction History',
      description: 'Detailed list of all transactions',
      icon: Table,
    },
  ];

  useEffect(() => {
    loadCategories();
    loadRecentReports();
  }, []);

const loadCategories = async () => {
  try {
    const categoriesData = await fetchCategories();
    setCategories(categoriesData.map((cat: any) => cat.name || cat));
  } catch (err) {
    console.error('Failed to load categories', err);
  }
};

const loadRecentReports = async () => {
  try {
    const reportsData = await fetchReports();
    setRecentReports(reportsData);
  } catch (err) {
    console.error('Failed to load recent reports', err);
  }
};


  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerateReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select a date range');
      return;
    }

    // Validate date range
    if (new Date(dateRange.end) < new Date(dateRange.start)) {
      alert('End date must be greater than or equal to start date');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await generateReport({
        reportName: `${selectedReport} report ${dateRange.start} to ${dateRange.end}`,
        reportType: selectedReport,
        startDate: dateRange.start,
        endDate: dateRange.end,
        categories: selectedCategories,
      });

      const fileUrl = res.fileUrl; // Directly from .data in api.js
      const downloadUrl = `http://localhost:5000${fileUrl}`;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'report.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      await loadRecentReports();
    } catch (err) {
      console.error('Failed to generate report', err);
      alert('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Financial Reports</h1>
            <p className="text-primary-600 mt-1">Generate and analyze your financial reports</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-6">Generate New Report</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`p-4 rounded-lg border-2 text-left ${
                    selectedReport === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      selectedReport === type.id ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  />
                  <h3 className="font-medium text-primary-900 mt-2">{type.name}</h3>
                  <p className="text-sm text-primary-500 mt-1">{type.description}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  // Reset end date if it becomes invalid
                  if (dateRange.end && new Date(dateRange.end) < new Date(e.target.value)) {
                    setDateRange({ start: e.target.value, end: '' });
                  }
                }}
                max={dateRange.end || undefined}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  if (new Date(e.target.value) < new Date(dateRange.start)) {
                    alert('End date must be greater than or equal to start date');
                    return;
                  }
                  setDateRange({ ...dateRange, end: e.target.value });
                }}
                min={dateRange.start || undefined}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategories.includes(cat)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-primary-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-primary-900">Recent Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Generated Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report._id} className="hover:bg-primary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {report.status || 'completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`http://localhost:5000${report.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-900"
                        download
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateReports;
