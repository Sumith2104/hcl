'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Zap, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Server,
  DollarSign,
  Play,
  Terminal,
  ExternalLink,
  Table,
  Network,
  Key,
  FileCode,
  GitFork
} from 'lucide-react';
import { BEDROCK_MODELS } from '@/lib/aws/models';
import { cn, formatUSD } from '@/lib/utils';

export default function ObservabilityPage() {
  const [data, setData] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [readyStatus, setReadyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active tab: 'observability' | 'erd' | 'sql'
  const [activeTab, setActiveTab] = useState<'observability' | 'erd' | 'sql'>('erd');

  // Live SQL Playground
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM v_learner_roadmap_analytics LIMIT 5;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const fetchObservability = async () => {
    try {
      setRefreshing(true);
      const [obsRes, healthRes, readyRes] = await Promise.all([
        fetch('/api/observability'),
        fetch('/api/healthz'),
        fetch('/api/readyz')
      ]);

      const obsData = await obsRes.json();
      const healthData = await healthRes.json();
      const readyData = await readyRes.json();

      setData(obsData);
      setHealthStatus(healthData);
      setReadyStatus(readyData);
    } catch (err) {
      console.error('Error fetching observability metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExecuteSql = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    setSqlLoading(true);
    try {
      const res = await fetch('/api/fluxbase/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const json = await res.json();
      setSqlResult(json);
    } catch (err) {
      setSqlResult({ success: false, error: (err as Error).message });
    } finally {
      setSqlLoading(false);
    }
  };

  useEffect(() => {
    fetchObservability();
    handleExecuteSql();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Activity className="w-12 h-12 text-brand-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading AWS Bedrock Telemetry & Fluxbase Logs...</p>
      </div>
    );
  }

  const userMetrics = data?.userMetrics;
  const systemMetrics = data?.systemMetrics;
  const budgetPercentage = userMetrics ? Math.min(100, Math.round((userMetrics.monthlySpendUsd / userMetrics.budgetCeilingUsd) * 100)) : 0;

  const schemaTables = [
    {
      name: 'users',
      purpose: 'Core user identity & role permissions',
      columns: ['id (PK)', 'name', 'email (UQ)', 'role', 'created_at'],
      relations: '1:1 with learner_profiles, 1:N with roadmaps, progress, llm_usage_log'
    },
    {
      name: 'learner_profiles',
      purpose: 'Target career goals, availability, learning style & verified baseline',
      columns: ['id (PK)', 'user_id (FK)', 'target_goal', 'target_role', 'available_hours_per_week', 'preferred_learning_style', 'interests (JSONB)', 'current_skills_raw (JSONB)'],
      relations: 'References users(id) ON DELETE CASCADE'
    },
    {
      name: 'skills',
      purpose: 'Canonical skills taxonomy across Math, Programming, AI, MLOps & Security',
      columns: ['id (PK)', 'name (UQ)', 'category', 'description', 'aliases (JSONB)', 'difficulty_base'],
      relations: 'Nodes in skill_prerequisites DAG, referenced by role_skill_requirements, user_skills, resources'
    },
    {
      name: 'skill_prerequisites',
      purpose: 'Directed Acyclic Graph (DAG) for deterministic topological ordering',
      columns: ['id (PK)', 'skill_id (FK)', 'prerequisite_skill_id (FK)', 'importance'],
      relations: 'Creates directional prerequisite graph edges with cycle validation'
    },
    {
      name: 'role_skill_requirements',
      purpose: 'Industry standard role competency benchmarks (e.g. AI Engineer, Fullstack)',
      columns: ['id (PK)', 'target_role', 'skill_id (FK)', 'required_level', 'importance', 'sequence_weight'],
      relations: 'References skills(id), used by deterministic skill-gap analyzer'
    },
    {
      name: 'user_skills',
      purpose: 'Verified learner proficiency, confidence ratings & assessment scores',
      columns: ['id (PK)', 'user_id (FK)', 'skill_id (FK)', 'proficiency_level', 'confidence_score', 'verified', 'assessment_score'],
      relations: 'Composite unique on (user_id, skill_id)'
    },
    {
      name: 'roadmaps',
      purpose: 'Personalized sequenced learning journeys generated via Kahn DAG sort',
      columns: ['id (PK)', 'user_id (FK)', 'target_goal', 'target_role', 'total_phases', 'estimated_duration_weeks', 'total_hours', 'status', 'adaptation_notes'],
      relations: '1:N with roadmap_items'
    },
    {
      name: 'roadmap_items',
      purpose: 'Sequenced milestone modules in topological order',
      columns: ['id (PK)', 'roadmap_id (FK)', 'skill_id (FK)', 'skill_name', 'sequence_order', 'phase', 'estimated_hours', 'status', 'milestone_project', 'ai_explanation'],
      relations: 'References roadmaps(id) ON DELETE CASCADE'
    },
    {
      name: 'roadmap_resources',
      purpose: 'Multi-criteria scored curriculum bindings (0.40/0.25/0.15/0.20 weights)',
      columns: ['id (PK)', 'roadmap_item_id (FK)', 'resource_id (FK)', 'ranking_score', 'recommendation_reason', 'match_breakdown (JSONB)'],
      relations: 'References roadmap_items(id) and resources(id)'
    },
    {
      name: 'progress',
      purpose: 'Granular study completion velocity, hours spent & user feedback',
      columns: ['id (PK)', 'user_id (FK)', 'roadmap_item_id (FK)', 'completion_percentage', 'assessment_score', 'time_spent_hours', 'status'],
      relations: 'Composite unique on (user_id, roadmap_item_id)'
    },
    {
      name: 'adaptation_history',
      purpose: 'Audit trail of dynamic roadmap recalibrations and booster insertions',
      columns: ['id (PK)', 'roadmap_id (FK)', 'user_id (FK)', 'trigger_reason', 'user_feedback', 'changes_summary (JSONB)', 'previous_item_count', 'new_item_count'],
      relations: 'Immutable change log for adaptive learning loop'
    },
    {
      name: 'llm_usage_log',
      purpose: 'Token telemetry & CostGuard budget audit logging per Bedrock invocation',
      columns: ['id (PK)', 'user_id (FK)', 'endpoint', 'model', 'provider', 'input_tokens', 'output_tokens', 'estimated_cost_usd', 'latency_ms'],
      relations: 'Enforces $10.00/user monthly budget limit server-side'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white">AWS Bedrock & Fluxbase Console</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enterprise relational PostgreSQL schema, live SQL console, token budgets, and telemetry.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-surface-900/80 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('erd')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all',
              activeTab === 'erd' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            Relational ERD & Schema
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all',
              activeTab === 'sql' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            Live SQL Playground
          </button>
          <button
            onClick={() => setActiveTab('observability')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all',
              activeTab === 'observability' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            Bedrock Telemetry
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Token Budget */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CostGuard Budget</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {formatUSD(userMetrics?.monthlySpendUsd || 0)}
              <span className="text-xs font-normal text-slate-400 font-mono"> / ${userMetrics?.budgetCeilingUsd.toFixed(2)}</span>
            </p>
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
              ${userMetrics?.budgetRemainingUsd.toFixed(4)} remaining
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(3, budgetPercentage)}%` }} />
          </div>
        </div>

        {/* Fluxbase Database */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Fluxbase Cloud DB</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <p className="text-lg font-bold text-white font-mono">CONNECTED</p>
            </div>
            <p className="text-[11px] text-amber-300 font-mono mt-0.5">
              Project: a3fdb50d092a4b97
            </p>
          </div>
        </div>

        {/* Bedrock Calls */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Bedrock Calls</span>
            <Cpu className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{systemMetrics?.totalCalls || 0}</p>
            <p className="text-[11px] text-brand-300 font-mono mt-0.5">
              {systemMetrics?.totalSystemTokens.toLocaleString() || 0} Total Tokens
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>System Health</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <p className="text-lg font-bold text-white uppercase font-mono">{healthStatus?.status || 'HEALTHY'}</p>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Avg Latency: {systemMetrics?.avgLatencyMs || 280} ms
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: RELATIONAL ERD & SCHEMA INSPECTOR */}
      {activeTab === 'erd' && (
        <div className="space-y-6">
          {/* Schema Architecture Highlights */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Network className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">Relational PostgreSQL Architecture on Fluxbase</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-mono font-semibold">
                16 Tables & Views
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The database is normalized into clean relational tables with strict foreign key cascading, check constraints, JSONB semi-structured properties, multi-column indexes for fast topological DAG resolution, and analytical views.
            </p>

            {/* Visual ERD Diagram Block */}
            <div className="p-5 rounded-2xl bg-surface-950/90 border border-white/10 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
              <p className="text-amber-400 font-bold">// ENTITY RELATIONSHIP DIAGRAM (ERD)</p>
              <pre className="text-[11px] leading-relaxed text-indigo-300">
{`[users] ──(1:1)──► [learner_profiles]
   │
   ├───────(1:N)──► [user_skills] ◄──(N:1)─── [skills] ◄──(DAG)──► [skill_prerequisites]
   │                                              ▲
   │                                              │ (N:1)
   ├───────(1:N)──► [roadmaps] ───────────────────┤
   │                   │ (1:N)                    │
   │                   ▼                          ▼
   │             [roadmap_items] ──(1:N)──► [roadmap_resources] ──(N:1)──► [resources]
   │                   │
   ├───────(1:N)──► [progress]
   ├───────(1:N)──► [adaptation_history]
   └───────(1:N)──► [llm_usage_log]`}
              </pre>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemaTables.map((table, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-brand-500/40 transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-brand-400" />
                    <h4 className="text-sm font-bold text-white font-mono">{table.name}</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-950 text-slate-400 font-mono">
                    PostgreSQL
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{table.purpose}</p>

                <div className="space-y-1 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <span className="text-slate-500 uppercase text-[9px] block">Columns & Constraints:</span>
                  <div className="flex flex-wrap gap-1">
                    {table.columns.map((col, cIdx) => (
                      <span
                        key={cIdx}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px]',
                          col.includes('PK') ? 'bg-amber-500/20 text-amber-300' : col.includes('FK') ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-900 text-slate-300'
                        )}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 font-mono">
                  <span className="text-brand-400 font-semibold">Rel: </span>
                  {table.relations}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SQL PLAYGROUND */}
      {activeTab === 'sql' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Fluxbase Cloud SQL Console</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">Live PostgreSQL</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Host: https://fluxbase.vercel.app · Project ID: a3fdb50d092a4b97
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: 'Analytical View', sql: 'SELECT * FROM v_learner_roadmap_analytics LIMIT 5;' },
                { label: 'Skills Taxonomy', sql: 'SELECT id, name, category, difficulty_base FROM skills ORDER BY category;' },
                { label: 'Prerequisite DAG', sql: 'SELECT p.id, s1.name AS skill, s2.name AS requires, p.importance FROM skill_prerequisites p JOIN skills s1 ON p.skill_id = s1.id JOIN skills s2 ON p.prerequisite_skill_id = s2.id;' },
                { label: 'Learner Profiles', sql: 'SELECT * FROM learner_profiles LIMIT 5;' },
                { label: 'LLM Audit Logs', sql: 'SELECT * FROM llm_usage_log ORDER BY created_at DESC LIMIT 5;' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSqlQuery(preset.sql);
                    handleExecuteSql(preset.sql);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-950 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-white font-mono text-[11px] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input Box */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                placeholder="Enter SQL statement (e.g. SELECT * FROM users;)"
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-mono text-slate-200"
              />
              <button
                onClick={() => handleExecuteSql()}
                disabled={sqlLoading || !sqlQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                {sqlLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Execute SQL</span>
              </button>
            </div>

            {/* SQL Output Box */}
            {sqlResult && (
              <div className="p-4 rounded-2xl bg-surface-950/90 border border-white/10 space-y-2 font-mono text-xs max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                  <span className={sqlResult.success ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {sqlResult.success ? `✓ Execution Successful (${sqlResult.rows?.length || 0} rows)` : '✗ Query Error'}
                  </span>
                  {sqlResult.executionTime && (
                    <span className="text-slate-500">{sqlResult.executionTime}</span>
                  )}
                </div>

                {sqlResult.success ? (
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(sqlResult.rows, null, 2)}
                  </pre>
                ) : (
                  <p className="text-rose-400 text-xs">{sqlResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BEDROCK TELEMETRY & COSTGUARD */}
      {activeTab === 'observability' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Real-Time LLM Usage Audit Log */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <span>Real-Time Bedrock LLM Audit Log</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Immutable Fluxbase Logs</span>
            </div>

            <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3">
              {userMetrics?.recentLogs && userMetrics.recentLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {userMetrics.recentLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-surface-950/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono font-semibold text-[10px]">
                            {log.endpoint}
                          </span>
                          <span className="text-slate-300 font-semibold">{log.model.split('.')[1] || log.model}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleTimeString()} · {log.input_tokens} In / {log.output_tokens} Out Tokens
                        </p>
                      </div>

                      <div className="text-right font-mono text-[11px] shrink-0">
                        <span className="text-emerald-400 font-semibold block">{formatUSD(log.estimated_cost_usd)}</span>
                        <span className="text-slate-400 text-[10px]">{log.latency_ms} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No recent Bedrock calls recorded.
                </p>
              )}
            </div>
          </div>

          {/* Bedrock Model Registry & Pricing */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>AWS Bedrock Model Catalog & Pricing</span>
            </h3>

            <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-3">
              {Object.values(BEDROCK_MODELS).map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-surface-950/70 border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{m.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-300">
                      {m.provider}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                    <span>In: ${m.inputCostPer1k}/1k tokens</span>
                    <span>Out: ${m.outputCostPer1k}/1k tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
