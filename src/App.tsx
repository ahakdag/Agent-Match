/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Zap, BarChart3, ArrowRight, ArrowLeft, ExternalLink, AlertTriangle, CheckCircle2, Plus, X, Bookmark, Save, User, LogOut, LayoutDashboard, Settings, Send, Globe, Award, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AgentCard from './components/AgentCard';
import RadarChart from './components/RadarChart';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import { Agent } from './types';
import { supabase } from './services/supabase';
import { trackEvent, trackPageView } from './services/analytics';

type View = 'home' | 'search' | 'profile' | 'compare' | 'dashboard' | 'admin' | 'submit';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [compareList, setCompareList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Auth & User State
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);

  // Submission Form State
  const [submission, setSubmission] = useState({
    name: '',
    vendor: '',
    tagline: '',
    external_url: '',
    category_tags: '',
    submitter_email: ''
  });

  useEffect(() => {
    // Track page view
    trackPageView(view);
  }, [view]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        setIsAdmin(session.user.email === 'ahmet@onabu.io');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        setIsAdmin(session.user.email === 'ahmet@onabu.io');
        trackEvent('user_login', { method: session.user.app_metadata.provider });
      } else {
        setWatchlist([]);
        setSavedSearches([]);
        setIsAdmin(false);
        trackEvent('user_logout');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    // Fetch watchlist
    const { data: watchlistData } = await supabase
      .from('saved_agents')
      .select('agent_id')
      .eq('user_id', userId);
    
    if (watchlistData) setWatchlist(watchlistData.map(d => d.agent_id));

    // Fetch saved searches
    const { data: searchesData } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId);
    
    if (searchesData) setSavedSearches(searchesData);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setView('search');
    trackEvent('search_performed', { query });
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to mock data if API fails
      setResults([
        {
          id: '1',
          name: 'SupportBot AI',
          vendor: 'AutoFlow Systems',
          tagline: 'Automate 80% of your customer support tickets with high accuracy.',
          description: 'SupportBot AI uses advanced LLMs to understand and resolve customer queries across email, chat, and social media.',
          category_tags: ['Customer Support', 'NLP'],
          industry_tags: ['E-commerce', 'SaaS'],
          business_size_fit: ['smb', 'midmarket'],
          capabilities: ['Email Automation', 'Sentiment Analysis', 'Multi-language Support'],
          weaknesses: ['Complex technical troubleshooting', 'Voice support'],
          pricing_tier: 'freemium',
          pricing_notes: 'Free up to 100 tickets/mo, then $0.50 per ticket.',
          integration_types: ['Zendesk', 'Intercom', 'API'],
          score_accuracy: 9.2,
          score_latency: 8.5,
          score_reliability: 9.8,
          score_ease_of_use: 7.5,
          score_cost_efficiency: 8.8,
          last_tested_at: '2026-03-01',
          test_version: 'v2.4.1',
          external_url: 'https://example.com',
          status: 'active',
          match_explanation: 'Strong match for your request to automate customer support emails.',
          final_score: 0.89
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async (agentId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (watchlist.includes(agentId)) {
      const { error } = await supabase
        .from('saved_agents')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', agentId);
      
      if (!error) {
        setWatchlist(watchlist.filter(id => id !== agentId));
        trackEvent('watchlist_remove', { agentId });
      }
    } else {
      const { error } = await supabase
        .from('saved_agents')
        .insert({ user_id: user.id, agent_id: agentId });
      
      if (!error) {
        setWatchlist([...watchlist, agentId]);
        trackEvent('watchlist_add', { agentId });
      }
    }
  };

  const handleSaveSearch = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const { error } = await supabase
      .from('saved_searches')
      .insert({ user_id: user.id, query, filters: {} });
    
    if (!error) {
      alert('Search saved to your dashboard!');
      trackEvent('search_saved', { query });
      fetchUserData(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  const toggleCompare = (agent: Agent) => {
    if (compareList.find(a => a.id === agent.id)) {
      setCompareList(compareList.filter(a => a.id !== agent.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 agents at a time.');
        return;
      }
      setCompareList([...compareList, agent]);
    }
  };

  const handleSubmitAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submission,
          category_tags: submission.category_tags.split(',').map(t => t.trim())
        }),
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      trackEvent('agent_submitted', { name: submission.name });
      alert('Agent submitted successfully! Our team will review it.');
      setSubmission({
        name: '',
        vendor: '',
        tagline: '',
        external_url: '',
        category_tags: '',
        submitter_email: ''
      });
      setView('home');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <div className="flex flex-col">
      <section className="py-20 px-4 border-b border-line">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl mb-6 leading-none">
              The Search Engine for <span className="italic">AI Agents</span>
            </h1>
            <p className="text-lg md:text-xl opacity-70 mb-12 max-w-2xl mx-auto">
              Describe what you need to automate. We match you with the best agents from our curated, independently tested database.
            </p>
          </motion.div>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 opacity-40" />
            </div>
            <input
              type="text"
              placeholder="I want to automate customer support emails..."
              className="w-full bg-white border-2 border-line py-4 pl-12 pr-4 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-ink text-bg px-6 font-mono uppercase text-sm hover:bg-accent hover:text-ink transition-all flex items-center gap-2"
            >
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Invoice Processing', 'Lead Generation', 'Customer Support', 'Data Extraction'].map((tag) => (
              <button
                key={tag}
                onClick={() => { setQuery(`I want to automate ${tag.toLowerCase()}`); }}
                className="text-[10px] uppercase tracking-widest border border-line/30 px-3 py-1 hover:border-line transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-bg border-2 border-line flex items-center justify-center mb-6 group-hover:bg-accent transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl mb-3 font-bold">Independently Tested</h3>
            <p className="text-sm opacity-60">Every agent is put through our rigorous testing suite to verify performance claims.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-bg border-2 border-line flex items-center justify-center mb-6 group-hover:bg-accent transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-xl mb-3 font-bold">Multi-Dimensional Scoring</h3>
            <p className="text-sm opacity-60">We rank agents on accuracy, latency, reliability, ease of use, and cost efficiency.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-bg border-2 border-line flex items-center justify-center mb-6 group-hover:bg-accent transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl mb-3 font-bold">Semantic Matching</h3>
            <p className="text-sm opacity-60">Our AI understands your business needs and matches you with the perfect automation partner.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 border-t border-line bg-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">150+</div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Curated Agents</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">12k+</div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Tests Performed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">45</div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">98%</div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Match Accuracy</div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <button 
            onClick={() => setView('home')}
            className="text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100 mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Search
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl">Results for: <span className="italic">"{query}"</span></h2>
            <button 
              onClick={handleSaveSearch}
              className="text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100 hover:text-accent"
            >
              <Save className="w-3 h-3" /> Save Search
            </button>
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">
          {results.length} Agents Matched
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-line border-t-accent animate-spin"></div>
          <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Analyzing Intent & Ranking Agents...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onClick={() => {
                setSelectedAgent(agent);
                setView('profile');
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    if (!selectedAgent) return null;
    const agent = selectedAgent;

    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <button 
          onClick={() => setView('search')}
          className="text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100 mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Results
        </button>

        <div className="grid lg:grid-cols-[1fr_350px] gap-12">
          {/* Main Content */}
          <div>
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-ink flex items-center justify-center">
                    <span className="text-bg font-mono font-bold text-2xl">{agent.name[0]}</span>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl leading-none">{agent.name}</h1>
                    <p className="text-xs font-mono uppercase tracking-widest opacity-50 mt-2">By {agent.vendor}</p>
                  </div>
                </div>
                <p className="text-xl opacity-80 italic">{agent.tagline}</p>
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleWatchlist(agent.id)}
                    className={`p-2 border-2 border-line transition-all ${
                      watchlist.includes(agent.id) ? 'bg-accent text-ink' : 'bg-white text-ink hover:bg-bg'
                    }`}
                    title={watchlist.includes(agent.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    <Bookmark className={`w-5 h-5 ${watchlist.includes(agent.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={() => toggleCompare(agent)}
                    className={`px-4 py-2 border-2 border-line font-mono uppercase text-xs transition-all flex items-center gap-2 ${
                      compareList.find(a => a.id === agent.id) ? 'bg-accent text-ink' : 'bg-white text-ink hover:bg-bg'
                    }`}
                  >
                    {compareList.find(a => a.id === agent.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {compareList.find(a => a.id === agent.id) ? 'Added' : 'Compare'}
                  </button>
                </div>
                <a 
                  href={agent.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-ink text-bg px-6 py-3 font-mono uppercase text-sm hover:bg-accent hover:text-ink transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,255,0,1)]"
                >
                  Visit Agent <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Description</h3>
                  <p className="text-sm leading-relaxed opacity-80">{agent.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((cap: string) => (
                      <span key={cap} className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-white border border-line px-3 py-1">
                        <CheckCircle2 className="w-3 h-3 text-accent" /> {cap}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest border-b border-line pb-2 mb-4 text-red-600">Known Weaknesses</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.weaknesses.map((weak: string) => (
                      <span key={weak} className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-red-50 border border-red-200 text-red-700 px-3 py-1">
                        <AlertTriangle className="w-3 h-3" /> {weak}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-line p-8">
                <h3 className="text-sm font-mono uppercase tracking-widest text-center mb-8">Independent Test Scores</h3>
                <RadarChart scores={{
                  accuracy: agent.score_accuracy,
                  latency: agent.score_latency,
                  reliability: agent.score_reliability,
                  ease_of_use: agent.score_ease_of_use,
                  cost_efficiency: agent.score_cost_efficiency
                }} />
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest opacity-50">
                    <span>Last Tested</span>
                    <span>{agent.last_tested_at}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest opacity-50">
                    <span>Test Version</span>
                    <span>{agent.test_version}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-bg p-6 border-2 border-line">
              <h3 className="text-xs font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Pricing</h3>
              <div className="mb-4">
                <span className="text-2xl font-mono uppercase font-bold">{agent.pricing_tier}</span>
              </div>
              <p className="text-xs opacity-70">{agent.pricing_notes}</p>
            </div>

            <div className="bg-bg p-6 border-2 border-line">
              <h3 className="text-xs font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Integrations</h3>
              <div className="flex flex-wrap gap-2">
                {agent.integration_types.map((type: string) => (
                  <span key={type} className="text-[9px] uppercase tracking-widest border border-line/30 px-2 py-1">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-bg p-6 border-2 border-line">
              <h3 className="text-xs font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Business Fit</h3>
              <div className="flex flex-wrap gap-2">
                {agent.business_size_fit.map((size: string) => (
                  <span key={size} className="text-[9px] uppercase tracking-widest bg-ink text-bg px-2 py-1">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompare = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <button 
            onClick={() => setView('search')}
            className="text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100 mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Results
          </button>
          <h2 className="text-3xl">Comparison View</h2>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">
          {compareList.length} Agents Selected
        </div>
      </div>

      {compareList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-line/20">
          <p className="font-mono text-xs uppercase tracking-widest opacity-40">No agents selected for comparison.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-line">
            <thead>
              <tr className="bg-bg">
                <th className="border-2 border-line p-4 text-left font-mono text-xs uppercase tracking-widest w-48">Feature</th>
                {compareList.map(agent => (
                  <th key={agent.id} className="border-2 border-line p-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold uppercase">{agent.name}</span>
                      <button onClick={() => toggleCompare(agent)} className="hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-2 border-line p-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Tagline</td>
                {compareList.map(agent => (
                  <td key={agent.id} className="border-2 border-line p-4 text-sm italic">{agent.tagline}</td>
                ))}
              </tr>
              <tr>
                <td className="border-2 border-line p-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Accuracy</td>
                {compareList.map(agent => (
                  <td key={agent.id} className="border-2 border-line p-4 font-mono font-bold text-lg">{agent.score_accuracy}/10</td>
                ))}
              </tr>
              <tr>
                <td className="border-2 border-line p-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Latency</td>
                {compareList.map(agent => (
                  <td key={agent.id} className="border-2 border-line p-4 font-mono font-bold text-lg">{agent.score_latency}/10</td>
                ))}
              </tr>
              <tr>
                <td className="border-2 border-line p-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Pricing</td>
                {compareList.map(agent => (
                  <td key={agent.id} className="border-2 border-line p-4 font-mono uppercase text-xs">{agent.pricing_tier}</td>
                ))}
              </tr>
              <tr>
                <td className="border-2 border-line p-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Weaknesses</td>
                {compareList.map(agent => (
                  <td key={agent.id} className="border-2 border-line p-4">
                    <ul className="space-y-1">
                      {agent.weaknesses.map(w => (
                        <li key={w} className="text-[10px] text-red-600 uppercase tracking-tight">• {w}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-4xl mb-12">Your Dashboard</h2>
      
      <div className="grid md:grid-cols-[300px_1fr] gap-12">
        <div className="space-y-8">
          <div className="bg-white border-2 border-line p-6">
            <h3 className="text-xs font-mono uppercase tracking-widest border-b border-line pb-2 mb-4">Saved Searches</h3>
            <div className="space-y-4">
              {savedSearches.length === 0 ? (
                <p className="text-[10px] opacity-40 italic">No saved searches yet.</p>
              ) : (
                savedSearches.map((s: any) => (
                  <button 
                    key={s.id}
                    onClick={() => { setQuery(s.query); handleSearch(); }}
                    className="w-full text-left p-3 border border-line/10 hover:border-line transition-colors flex items-center justify-between group"
                  >
                    <span className="text-xs font-mono truncate mr-2">{s.query}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl mb-6 flex items-center gap-2">
            <Bookmark className="w-5 h-5" /> Watchlist ({watchlist.length})
          </h3>
          {watchlist.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-line/20">
              <p className="font-mono text-xs uppercase tracking-widest opacity-40">Your watchlist is empty.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Note: In a real app, we'd fetch the full agent objects for these IDs */}
              <p className="col-span-full text-xs font-mono opacity-50 italic">Showing agents saved to your profile...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSubmit = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => setView('home')}
        className="text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100 mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </button>
      
      <h2 className="text-4xl mb-4">Submit an Agent</h2>
      <p className="text-xs font-mono uppercase tracking-widest opacity-50 mb-12">Help us build the most comprehensive AI agent database.</p>

      <form onSubmit={handleSubmitAgent} className="space-y-8 bg-white border-2 border-line p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">Agent Name *</label>
            <input 
              type="text" 
              required
              className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={submission.name}
              onChange={(e) => setSubmission({...submission, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">Vendor Name</label>
            <input 
              type="text" 
              className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={submission.vendor}
              onChange={(e) => setSubmission({...submission, vendor: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">Product URL *</label>
          <input 
            type="url" 
            required
            className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="https://agent-website.com"
            value={submission.external_url}
            onChange={(e) => setSubmission({...submission, external_url: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">One-line Tagline</label>
          <input 
            type="text" 
            className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Automate your customer support with AI..."
            value={submission.tagline}
            onChange={(e) => setSubmission({...submission, tagline: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">Categories (comma separated)</label>
          <input 
            type="text" 
            className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Customer Support, NLP, Automation"
            value={submission.category_tags}
            onChange={(e) => setSubmission({...submission, category_tags: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-60">Your Email *</label>
          <input 
            type="email" 
            required
            className="w-full bg-bg border-2 border-line py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={submission.submitter_email}
            onChange={(e) => setSubmission({...submission, submitter_email: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-bg py-4 font-mono uppercase text-sm hover:bg-accent hover:text-ink transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Agent for Review'} <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {/* Navigation */}
      <nav className="border-b border-line bg-bg/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView('home')}
          >
            <div className="w-8 h-8 bg-ink flex items-center justify-center">
              <span className="text-bg font-mono font-bold">A</span>
            </div>
            <span className="font-mono font-bold text-xl tracking-tighter">AGENTMATCH</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest">
            <button 
              onClick={() => setView('compare')}
              className={`hover:text-accent transition-colors flex items-center gap-2 ${view === 'compare' ? 'text-accent' : ''}`}
            >
              Compare {compareList.length > 0 && <span className="bg-accent text-ink px-1.5 py-0.5 text-[8px] font-bold">{compareList.length}</span>}
            </button>
            
            <button 
              onClick={() => setView('submit')}
              className={`hover:text-accent transition-colors ${view === 'submit' ? 'text-accent' : ''}`}
            >
              Submit Agent
            </button>

            {isAdmin && (
              <button 
                onClick={() => setView('admin')}
                className={`hover:text-accent transition-colors flex items-center gap-2 ${view === 'admin' ? 'text-accent' : ''}`}
              >
                <Settings className="w-4 h-4" /> Admin
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('dashboard')}
                  className={`hover:text-accent transition-colors flex items-center gap-2 ${view === 'dashboard' ? 'text-accent' : ''}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-line/20">
                  <div className="w-6 h-6 bg-accent flex items-center justify-center rounded-full">
                    <User className="w-3 h-3 text-ink" />
                  </div>
                  <button onClick={handleLogout} className="hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-ink text-bg px-4 py-2 hover:bg-accent hover:text-ink transition-all"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'home' && renderHome()}
            {view === 'search' && renderSearch()}
            {view === 'profile' && renderProfile()}
            {view === 'compare' && renderCompare()}
            {view === 'dashboard' && renderDashboard()}
            {view === 'admin' && <AdminDashboard />}
            {view === 'submit' && renderSubmit()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 bg-ink text-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-bg flex items-center justify-center">
              <span className="text-ink font-mono font-bold text-xs">A</span>
            </div>
            <span className="font-mono font-bold tracking-tighter">AGENTMATCH</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest opacity-60">
            <a href="#" className="hover:text-accent">About</a>
            <a href="#" className="hover:text-accent">Submit Agent</a>
            <a href="#" className="hover:text-accent">Privacy</a>
            <a href="#" className="hover:text-accent">Terms</a>
          </div>
          <div className="text-[10px] font-mono opacity-40">
            © 2026 AGENTMATCH. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
