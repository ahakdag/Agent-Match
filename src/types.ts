export interface Agent {
  id: string;
  name: string;
  vendor: string;
  tagline: string;
  description: string;
  category_tags: string[];
  industry_tags: string[];
  business_size_fit: ('solo' | 'smb' | 'midmarket' | 'enterprise')[];
  capabilities: string[];
  weaknesses: string[]; // Mandatory
  pricing_tier: 'free' | 'freemium' | 'paid' | 'enterprise';
  pricing_notes: string;
  integration_types: string[];
  score_accuracy: number;
  score_latency: number;
  score_reliability: number;
  score_ease_of_use: number;
  score_cost_efficiency: number;
  last_tested_at: string;
  test_version: string;
  external_url: string;
  status: 'active' | 'deprecated' | 'under_review';
}

export interface SearchResult extends Agent {
  match_explanation: string;
  similarity_score: number;
}
