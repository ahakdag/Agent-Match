import React from 'react';
import { ShieldCheck, Zap, BarChart3, ExternalLink, ArrowRight } from 'lucide-react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent & { match_explanation?: string; final_score?: number };
  onClick: () => void;
  key?: string | number;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border-2 border-line p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink flex items-center justify-center">
            <span className="text-bg font-mono font-bold">{agent.name[0]}</span>
          </div>
          <div>
            <h3 className="font-mono font-bold text-lg leading-none">{agent.name}</h3>
            <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">{agent.vendor}</p>
          </div>
        </div>
        <div className="bg-accent text-ink px-2 py-1 text-[10px] font-mono font-bold border border-line">
          SCORE: {agent.final_score ? (agent.final_score * 10).toFixed(1) : 'N/A'}
        </div>
      </div>

      <p className="text-sm mb-4 line-clamp-2 opacity-80">{agent.tagline}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span key={cap} className="text-[9px] uppercase tracking-wider bg-bg px-2 py-0.5 border border-line/20">
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="text-[9px] opacity-40">+{agent.capabilities.length - 3} more</span>
        )}
      </div>

      {agent.match_explanation && (
        <div className="mt-auto pt-4 border-t border-line/10">
          <p className="text-[10px] italic opacity-60">
            <span className="font-bold uppercase not-italic mr-1">Why matched:</span>
            {agent.match_explanation}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">
          {agent.pricing_tier}
        </span>
        <button className="text-xs font-mono uppercase tracking-widest flex items-center gap-1 group-hover:text-accent transition-colors">
          View Profile <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
