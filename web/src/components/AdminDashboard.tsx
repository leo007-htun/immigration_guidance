import { useState, useEffect } from 'react';
import { adminApi, DashboardStats, UserListItem, UsageCostData } from '../services/adminApi';
import { documentsApi, DocumentListItem } from '../services/documentsApi';
import { Button } from './ui/button';
import {
  Users, Activity, Clock, CheckCircle, XCircle,
  LogOut, Shield, Upload, FileText, Trash2, RefreshCw, MessageSquare, Brain, Database, DollarSign, Zap
} from 'lucide-react';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [usageCost, setUsageCost] = useState<UsageCostData | null>(null);
  const [usageDays, setUsageDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [indexStatus, setIndexStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersResponse, documentsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        documentsApi.listDocuments()
      ]);

      setStats(statsData);
      setUsers(usersResponse.users || []);
      setDocuments(documentsData);

      // Load usage/cost data separately (non-blocking)
      loadUsageCost(usageDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      if (err instanceof Error && err.message.includes('403')) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsageCost = async (days: number) => {
    try {
      setLoadingUsage(true);
      const usageData = await adminApi.getUsageCost(days);
      setUsageCost(usageData);
    } catch (err) {
      console.error('Failed to load usage/cost data:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleUsageDaysChange = (days: number) => {
    setUsageDays(days);
    loadUsageCost(days);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setUploadStatus('Error: Only PDF files are allowed');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('Uploading...');
      const response = await documentsApi.uploadDocument(file);
      setUploadStatus(`Success: ${response.message}`);

      const documentsData = await documentsApi.listDocuments();
      setDocuments(documentsData);

      e.target.value = '';
      setTimeout(() => setUploadStatus(''), 5000);
    } catch (err) {
      setUploadStatus(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      const response = await documentsApi.deleteDocument(filename);
      setUploadStatus(`Success: ${response.message}`);

      const documentsData = await documentsApi.listDocuments();
      setDocuments(documentsData);

      setTimeout(() => setUploadStatus(''), 5000);
    } catch (err) {
      setUploadStatus(`Error: ${err instanceof Error ? err.message : 'Delete failed'}`);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const handleRebuildIndex = async () => {
    if (!confirm('Rebuild LEANN index? This will process all documents and may take a few minutes.')) return;

    try {
      setRebuilding(true);
      setIndexStatus('Rebuilding index...');
      const response = await documentsApi.rebuildIndex();
      setIndexStatus(`Success: ${response.message}`);
      setTimeout(() => setIndexStatus(''), 5000);
    } catch (err) {
      setIndexStatus(`Error: ${err instanceof Error ? err.message : 'Rebuild failed'}`);
      setTimeout(() => setIndexStatus(''), 5000);
    } finally {
      setRebuilding(false);
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0D9488] mx-auto"></div>
          <p className="mt-6 text-white/80 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] flex items-center justify-center p-4">
        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 max-w-md">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9488] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E3A8A] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0A3D62] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#0D9488] to-[#0A3D62] rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/60 mt-1">Legal Chatbot Management Portal</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

          {/* Total Users */}
          <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.user_stats?.total_users || 0}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-300">{stats?.user_stats?.active_users || 0} active</p>
          </div>

          {/* New Users */}
          <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">New This Week</p>
                <p className="text-2xl font-bold text-white">{stats?.user_stats?.new_users_week || 0}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-300">{stats?.user_stats?.new_users_month || 0} this month</p>
          </div>

          {/* Conversations */}
          <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">Conversations</p>
                <p className="text-2xl font-bold text-white">{stats?.chat_stats?.total_conversations || 0}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-300">{stats?.chat_stats?.chats_today || 0} today</p>
          </div>

          {/* Long-term Memories */}
          <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">LTM</p>
                <p className="text-2xl font-bold text-white">{stats?.memory_stats?.long_term?.total_ltm || 0}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-300">{stats?.memory_stats?.long_term?.user_context_count || 0} contexts</p>
          </div>

          {/* Short-term Memories */}
          <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">STM</p>
                <p className="text-2xl font-bold text-white">{stats?.memory_stats?.short_term?.total_stm || 0}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-300">{stats?.memory_stats?.short_term?.users_with_stm || 0} users</p>
          </div>

        </div>

        {/* OpenAI Usage & Cost Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">OpenAI Usage & Cost</h2>
                <p className="text-sm text-white/60">Token usage and cost tracking</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUsageDaysChange(7)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  usageDays === 7
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => handleUsageDaysChange(30)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  usageDays === 30
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => handleUsageDaysChange(90)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  usageDays === 90
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          {loadingUsage ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0D9488]"></div>
            </div>
          ) : usageCost ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Cost */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-xl">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">Total Cost</p>
                    <p className="text-2xl font-bold text-white">
                      ${usageCost.total_cost_usd.toFixed(4)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-300">
                  {usageCost.start_date} to {usageCost.end_date}
                </p>
              </div>

              {/* Total Tokens */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-xl">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">Total Tokens</p>
                    <p className="text-2xl font-bold text-white">
                      {usageCost.total_tokens.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-300">All token usage</p>
              </div>

              {/* Input Tokens */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-500 rounded-xl">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">Input Tokens</p>
                    <p className="text-2xl font-bold text-white">
                      {usageCost.total_input_tokens.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-purple-300">
                  {((usageCost.total_input_tokens / usageCost.total_tokens) * 100).toFixed(1)}% of total
                </p>
              </div>

              {/* Output Tokens */}
              <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 flex items-center justify-center bg-orange-500 rounded-xl">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">Output Tokens</p>
                    <p className="text-2xl font-bold text-white">
                      {usageCost.total_output_tokens.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-orange-300">
                  {((usageCost.total_output_tokens / usageCost.total_tokens) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">No usage data available</p>
              <p className="text-xs text-white/40 mt-2">Make sure ADMIN_KEY is configured in .env</p>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">All Users</h2>
              <p className="text-sm text-white/60">User management and statistics</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Email</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Status</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">Verified</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">Admin</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">Chats</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">LTM</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">STM</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Created</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{user.email}</td>
                    <td className="py-4 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Activity className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {user.is_email_verified ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {user.is_admin ? (
                        <Shield className="h-5 w-5 text-amber-400 mx-auto" />
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-white/70">{user.chat_count}</td>
                    <td className="py-4 px-4 text-center text-white/70">{user.ltm_count}</td>
                    <td className="py-4 px-4 text-center text-white/70">{user.stm_count}</td>
                    <td className="py-4 px-4 text-white/70 text-sm">{formatDate(user.created_at)}</td>
                    <td className="py-4 px-4 text-white/70 text-sm">{formatDate(user.last_login_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Management Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
                <p className="text-sm text-white/60">Manage LEANN indexed documents</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRebuildIndex}
                disabled={rebuilding}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${rebuilding ? 'animate-spin' : ''}`} />
                {rebuilding ? 'Rebuilding...' : 'Rebuild Index'}
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </div>
              </label>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mb-4 p-4 rounded-xl ${
              uploadStatus.startsWith('Error')
                ? 'bg-red-500/10 border border-red-500/20 text-red-200'
                : uploadStatus.startsWith('Success')
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
            }`}>
              {uploadStatus}
            </div>
          )}

          {indexStatus && (
            <div className={`mb-4 p-4 rounded-xl ${
              indexStatus.startsWith('Error')
                ? 'bg-red-500/10 border border-red-500/20 text-red-200'
                : indexStatus.startsWith('Success')
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
            }`}>
              {indexStatus}
            </div>
          )}

          {/* Documents Table */}
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg mb-2">No documents uploaded yet</p>
              <p className="text-white/40 text-sm">Upload PDF documents to build the LEANN index for chat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Filename</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Size</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-white/80">Uploaded</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.filename} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-red-400" />
                          <span className="text-white font-medium">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70">
                        {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="py-4 px-4 text-white/70 text-sm">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          onClick={() => handleDeleteDocument(doc.filename)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
