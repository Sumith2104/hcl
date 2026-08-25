'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Layers, 
  Zap, 
  Code, 
  Video, 
  Bookmark, 
  X,
  Compass,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Roadmap, RoadmapItem } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { GraphNodeTree } from '@/app/api/roadmaps/graph-tree/route';

interface ConnectionLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  level: number;
}

interface RoadmapGraph2DProps {
  roadmap: Roadmap | null;
  onItemSelect?: (item: RoadmapItem) => void;
}

export function RoadmapGraph2D({ roadmap }: RoadmapGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});

  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<GraphNodeTree | null>(null);
  const [lines, setLines] = useState<ConnectionLine[]>([]);

  // Set of all expanded node IDs
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<GraphNodeTree | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());

  // Fetch dynamic AI graph tree from API
  const fetchGraphTree = async () => {
    try {
      setLoading(true);
      const goal = roadmap?.target_role || roadmap?.target_goal || '';
      const url = goal 
        ? `/api/roadmaps/graph-tree?goal=${encodeURIComponent(goal)}`
        : `/api/roadmaps/graph-tree`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.tree) {
        setTreeData(data.tree);

        // Expand root and all top-level strategy branches by default
        const initialExpanded = new Set<string>([data.tree.id]);
        if (data.tree.children) {
          data.tree.children.forEach((c: GraphNodeTree, idx: number) => {
            initialExpanded.add(c.id);
            if (c.children && c.children[0]) {
              initialExpanded.add(c.children[0].id);
            }
          });
        }
        setExpandedNodes(initialExpanded);
      }
    } catch (err) {
      console.error('Error fetching graph tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphTree();
  }, [roadmap?.id, roadmap?.target_role, roadmap?.target_goal]);

  // Recalculate connecting SVG Bézier lines for all visible parent-child pairs recursively
  const calculateConnectingLines = useCallback(() => {
    if (!contentWrapperRef.current || !treeData) return;

    const wrapperRect = contentWrapperRef.current.getBoundingClientRect();
    const newLines: ConnectionLine[] = [];

    const traverse = (parent: GraphNodeTree) => {
      if (!expandedNodes.has(parent.id) || !parent.children || parent.children.length === 0) return;

      const parentEl = nodeRefs.current[parent.id];
      if (!parentEl) return;

      const parentRect = parentEl.getBoundingClientRect();
      const fromX = (parentRect.right - wrapperRect.left) / zoom;
      const fromY = (parentRect.top + parentRect.height / 2 - wrapperRect.top) / zoom;

      parent.children.forEach((child) => {
        const childEl = nodeRefs.current[child.id];
        if (!childEl) return;

        const childRect = childEl.getBoundingClientRect();
        const toX = (childRect.left - wrapperRect.left) / zoom;
        const toY = (childRect.top + childRect.height / 2 - wrapperRect.top) / zoom;

        newLines.push({
          id: `${parent.id}->${child.id}`,
          fromX,
          fromY,
          toX,
          toY,
          level: parent.level ?? 0
        });

        traverse(child);
      });
    };

    traverse(treeData);
    setLines(newLines);
  }, [treeData, expandedNodes, zoom]);

  // Trigger recalculation on DOM layout shift, expansion, zoom, or window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateConnectingLines();
    }, 60);
    return () => clearTimeout(timer);
  }, [treeData, expandedNodes, zoom, isFullscreen, calculateConnectingLines]);

  useEffect(() => {
    window.addEventListener('resize', calculateConnectingLines);
    return () => window.removeEventListener('resize', calculateConnectingLines);
  }, [calculateConnectingLines]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!treeData) return;
    const all = new Set<string>();
    const traverse = (node: GraphNodeTree) => {
      all.add(node.id);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(treeData);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    if (!treeData) return;
    setExpandedNodes(new Set([treeData.id]));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen error:', err);
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
      }
      return next;
    });
  };

  /**
   * Recursive Node Renderer supporting N arbitrary levels of branching
   */
  const renderRecursiveNode = (node: GraphNodeTree) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isCompleted = completedNodeIds.has(node.id);
    const level = node.level ?? 0;

    // Node Styling by Recursive Level
    // Level 0: Black Objective Pill
    // Level 1: Yellow Strategy Pill
    // Level 2: Purple Tactic Pill
    // Level 3+: Green KPI / Resource Pill
    let nodeCardClasses = '';
    let badgeText = '';

    if (level === 0) {
      nodeCardClasses = cn(
        "px-6 py-4 rounded-full bg-[#1e232a] text-white shadow-xl cursor-pointer transition-all duration-200 hover:scale-105 select-none flex items-center gap-3 border-2 border-neutral-700",
        isExpanded ? "ring-4 ring-neutral-900/20" : ""
      );
      badgeText = 'Objective';
    } else if (level === 1) {
      nodeCardClasses = cn(
        "w-60 px-4 py-3 rounded-2xl bg-[#facc15] text-[#1e1b4b] font-bold text-xs shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.03] select-none flex items-center justify-between border-2 border-[#eab308]",
        isExpanded ? "ring-4 ring-amber-300/50 shadow-lg" : "",
        isCompleted ? "bg-emerald-300 border-emerald-500" : ""
      );
      badgeText = 'Strategy Pillar';
    } else if (level === 2) {
      nodeCardClasses = cn(
        "w-64 px-4 py-3 rounded-2xl bg-[#818cf8] text-white font-semibold text-xs shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.03] select-none flex items-center justify-between border-2 border-[#6366f1]",
        isExpanded ? "ring-4 ring-indigo-300/50 shadow-lg" : "",
        isCompleted ? "bg-emerald-600 border-emerald-500" : ""
      );
      badgeText = 'Tactic';
    } else {
      nodeCardClasses = cn(
        "w-72 px-3.5 py-2.5 rounded-2xl bg-[#4ade80] text-[#064e3b] font-bold text-[11px] shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none flex items-center justify-between border-2 border-[#22c55e]",
        isCompleted ? "bg-emerald-200 border-emerald-400" : ""
      );
      badgeText = 'KPI / Resource';
    }

    return (
      <div key={node.id} className="flex items-center gap-12 sm:gap-16 relative">
        {/* Node Card Element */}
        <div
          ref={el => { nodeRefs.current[node.id] = el; }}
          onClick={() => {
            if (hasChildren) toggleExpand(node.id);
            setSelectedNode(node);
          }}
          className={nodeCardClasses}
        >
          {level === 0 ? (
            <>
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold tracking-wider leading-none">
                  {badgeText}
                </span>
                <span className="text-sm font-bold tracking-tight text-white block mt-0.5">
                  {node.label}
                </span>
              </div>
            </>
          ) : level === 1 ? (
            <>
              <div className="overflow-hidden">
                <span className="text-[9px] font-mono uppercase font-bold text-amber-900/70 block leading-none mb-0.5">
                  {badgeText}
                </span>
                <span className="truncate block font-extrabold text-neutral-950">
                  {node.label}
                </span>
              </div>
              <div className="w-5 h-5 rounded-full bg-amber-300/80 text-amber-950 flex items-center justify-center text-[10px] shrink-0 font-mono font-bold">
                {node.children?.length || 0}
              </div>
            </>
          ) : level === 2 ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  onClick={(e) => toggleComplete(node.id, e)}
                  className="text-white/70 hover:text-white transition-colors shrink-0"
                  title={isCompleted ? "Mark Incomplete" : "Mark Mastered"}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white fill-white/20" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-mono uppercase font-bold text-indigo-100/70 block leading-none mb-0.5">
                    {badgeText}
                  </span>
                  <span className="truncate block text-white font-bold">
                    {node.label}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-indigo-900/30 px-1.5 py-0.5 rounded-md text-indigo-100 shrink-0">
                {node.children?.length || 0}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {node.resourceType === 'book' ? <BookOpen className="w-3.5 h-3.5" /> :
                   node.resourceType === 'video' ? <Video className="w-3.5 h-3.5" /> :
                   <Code className="w-3.5 h-3.5" />}
                </div>
                <div className="overflow-hidden">
                  <span className="truncate block font-extrabold text-neutral-900 leading-tight">
                    {node.label}
                  </span>
                  {node.author && (
                    <span className="text-[9px] font-mono text-emerald-800/80 truncate block">
                      {node.author}
                    </span>
                  )}
                </div>
              </div>

              {node.url && (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="p-1 rounded-md text-emerald-900 hover:bg-emerald-300/60 transition-colors shrink-0"
                  title="Open Resource URL"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}
        </div>

        {/* RECURSIVE CHILD BRANCHES (Supporting arbitrary N children at depth level + 1) */}
        {isExpanded && hasChildren && (
          <div className="flex flex-col gap-6 shrink-0 relative">
            {node.children!.map((childNode) => renderRecursiveNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  if (loading && !treeData) {
    return (
      <div className="py-24 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-neutral-800 animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-mono">Generating AI 2D Visual Branching Graph...</p>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="p-12 text-center text-xs text-neutral-400">
        No graph tree data available.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "space-y-4 transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-[#f1f3f5] p-6 overflow-auto flex flex-col justify-between" : ""
      )}
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 border border-neutral-200/80 shadow-xs shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
              2D Visual Knowledge Mindmap (N-Branch AI Connected)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
              AI Synchronized
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Interactive Tree: Branches connect dynamically from your Onboarding Goal ➔ Strategy (Yellow) ➔ Tactic (Purple) ➔ Books & KPIs (Green).
          </p>
        </div>

        {/* Action Buttons, Zoom & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
              className="p-1.5 rounded-lg hover:bg-neutral-200/70 text-neutral-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2 text-neutral-800 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.6, prev + 0.1))}
              className="p-1.5 rounded-lg hover:bg-neutral-200/70 text-neutral-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              if (expandedNodes.size > 2) collapseAll();
              else expandAll();
            }}
            className="btn-outline !py-2 !px-3 !text-xs inline-flex items-center gap-1.5 bg-white"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{expandedNodes.size > 2 ? 'Collapse Tree' : 'Expand All'}</span>
          </button>

          {/* Fullscreen Mode Button */}
          <button
            onClick={toggleFullscreen}
            className="btn-black !py-2 !px-3 !text-xs inline-flex items-center gap-1.5 shadow-xs"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main 2D Tree Canvas with SVG Connecting Bézier Curves */}
      <div 
        className={cn(
          "relative w-full rounded-2xl bg-[#f4f5f7] border border-neutral-300/80 p-8 sm:p-14 overflow-x-auto shadow-inner flex items-center justify-start transition-all",
          isFullscreen ? "flex-1 min-h-[calc(100vh-140px)]" : "min-h-[640px]"
        )}
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '30px 30px'
        }}
      >
        <div 
          ref={contentWrapperRef}
          className="relative transition-transform duration-200 ease-out origin-left py-10 pl-4 pr-20"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* SVG Canvas for Smooth Curved Bézier Connecting Lines */}
          <svg 
            className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="lineGradYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e232a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="lineGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="lineGradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {lines.map((line) => {
              // Calculate smooth cubic Bézier S-curve control points
              const dx = line.toX - line.fromX;
              const cx1 = line.fromX + dx * 0.5;
              const cy1 = line.fromY;
              const cx2 = line.fromX + dx * 0.5;
              const cy2 = line.toY;
              const pathData = `M ${line.fromX} ${line.fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${line.toX} ${line.toY}`;

              const strokeColor = 
                line.level === 0 ? 'url(#lineGradYellow)' :
                line.level === 1 ? 'url(#lineGradPurple)' :
                'url(#lineGradGreen)';

              return (
                <g key={line.id}>
                  {/* Outer glow shadow */}
                  <path
                    d={pathData}
                    stroke="#94a3b8"
                    strokeWidth="3.5"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Crisp main Bézier curve */}
                  <path
                    d={pathData}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              );
            })}
          </svg>

          {/* Recursive Node Hierarchy Render */}
          <div className="relative z-10">
            {renderRecursiveNode(treeData)}
          </div>
        </div>
      </div>

      {/* Side Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white border-l border-neutral-200 shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
              selectedNode.level === 0 ? "bg-neutral-900 text-white" :
              selectedNode.level === 1 ? "bg-amber-100 text-amber-900" :
              selectedNode.level === 2 ? "bg-indigo-100 text-indigo-900" :
              "bg-emerald-100 text-emerald-900"
            )}>
              {selectedNode.type.toUpperCase()} Node Details
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              {selectedNode.label}
            </h3>
            {selectedNode.description && (
              <p className="text-xs text-neutral-600 leading-relaxed">
                {selectedNode.description}
              </p>
            )}
          </div>

          {selectedNode.complexity && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                Complexity Specifications
              </span>
              <p className="text-xs font-mono font-semibold text-neutral-900">
                {selectedNode.complexity}
              </p>
            </div>
          )}

          {/* If KPI Resource, show direct launch button */}
          {selectedNode.url && (
            <div className="pt-2">
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-black !py-2.5 inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Launch Link / Textbook</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* If Strategy / Tactic, show children list */}
          {selectedNode.children && selectedNode.children.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                Direct Child Branches ({selectedNode.children.length})
              </h4>
              <div className="space-y-1.5">
                {selectedNode.children.map(child => (
                  <div
                    key={child.id}
                    onClick={() => setSelectedNode(child)}
                    className="p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold text-neutral-900">{child.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
