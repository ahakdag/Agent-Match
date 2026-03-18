import React, { useState } from 'react';
import { Upload, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabaseAdmin } from '../services/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'agents' | 'submissions' | 'import'>('agents');
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCsvImport = async () => {
    setLoading(true);
    try {
      // Simple CSV parser (for MVP)
      const rows = csvData.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',');
      const agents = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj: any, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {});
      });

      // Insert into Supabase
      const { error } = await supabaseAdmin.from('agents').insert(agents);
      if (error) throw error;
      
      alert(`Successfully imported ${agents.length} agents!`);
      setCsvData('');
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-4xl mb-8">Admin Control Panel</h2>

      <div className="flex gap-4 mb-8 border-b border-line">
        <button 
          onClick={() => setActiveTab('agents')}
          className={`pb-4 px-4 font-mono text-xs uppercase tracking-widest transition-all ${activeTab === 'agents' ? 'border-b-2 border-accent text-accent' : 'opacity-50'}`}
        >
          Manage Agents
        </button>
        <button 
          onClick={() => setActiveTab('submissions')}
          className={`pb-4 px-4 font-mono text-xs uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'border-b-2 border-accent text-accent' : 'opacity-50'}`}
        >
          Public Submissions
        </button>
        <button 
          onClick={() => setActiveTab('import')}
          className={`pb-4 px-4 font-mono text-xs uppercase tracking-widest transition-all ${activeTab === 'import' ? 'border-b-2 border-accent text-accent' : 'opacity-50'}`}
        >
          Bulk Import (CSV)
        </button>
      </div>

      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-mono opacity-50 uppercase">Total Agents: 150</p>
            <button className="bg-ink text-bg px-4 py-2 font-mono text-xs uppercase flex items-center gap-2 hover:bg-accent hover:text-ink transition-all">
              <Plus className="w-4 h-4" /> Add New Agent
            </button>
          </div>
          <div className="border-2 border-line overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-bg border-b-2 border-line">
                <tr>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Agent Name</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Category</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Status</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Last Tested</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/10">
                <tr className="hover:bg-white transition-colors">
                  <td className="p-4 font-bold">SupportBot AI</td>
                  <td className="p-4 text-xs">Customer Support</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-green-200">Active</span>
                  </td>
                  <td className="p-4 text-xs font-mono">2026-03-01</td>
                  <td className="p-4 flex gap-2">
                    <button className="p-1 hover:text-accent"><Edit className="w-4 h-4" /></button>
                    <button className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white border-2 border-line p-8">
          <h3 className="text-xl mb-4">Bulk CSV Import</h3>
          <p className="text-xs opacity-60 mb-6">Paste your CSV data below. Ensure headers match the agent schema exactly.</p>
          <textarea 
            className="w-full h-64 bg-bg border-2 border-line p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent mb-6"
            placeholder="name,vendor,tagline,description,category_tags,weaknesses..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          ></textarea>
          <button 
            onClick={handleCsvImport}
            disabled={loading || !csvData}
            className="bg-ink text-bg px-8 py-4 font-mono uppercase text-sm hover:bg-accent hover:text-ink transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="text-center py-20 border-2 border-dashed border-line/20">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono text-xs uppercase tracking-widest opacity-40">No pending submissions to review.</p>
        </div>
      )}
    </div>
  );
}
