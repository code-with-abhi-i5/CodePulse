"use client";

import React, { useMemo, useState } from "react";
import { Flag, Shield, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface HexTerritoryItem {
  nodeKey: string;
  name: string;
  region: string;
  topicTag: string;
  hexQ: number;
  hexR: number;
  ownerGuildName?: string | null;
  conquestPoints: number;
  bannerColor?: string;
}

export const DEFAULT_CONQUEST_NODES: HexTerritoryItem[] = [
  { nodeKey: "ts-citadel", name: "TypeScript Citadel", region: "Frontend Core", topicTag: "typescript", hexQ: 0, hexR: 0, ownerGuildName: "WCE Compilers", conquestPoints: 420, bannerColor: "#38BDF8" },
  { nodeKey: "rust-frontier", name: "Rust Frontier", region: "Systems Frontier", topicTag: "rust", hexQ: 1, hexR: 0, ownerGuildName: "ZeroCopy Guild", conquestPoints: 390, bannerColor: "#F97316" },
  { nodeKey: "postgres-bastion", name: "Postgres Bastion", region: "Data Stronghold", topicTag: "postgres", hexQ: 0, hexR: 1, ownerGuildName: "QueryForge", conquestPoints: 340, bannerColor: "#34D399" },
  { nodeKey: "go-foundry", name: "Go Concurrency Foundry", region: "Systems Frontier", topicTag: "go", hexQ: 2, hexR: 0, ownerGuildName: "Goroutine Clan", conquestPoints: 310, bannerColor: "#22D3EE" },
  { nodeKey: "react-spire", name: "React UI Spire", region: "Frontend Core", topicTag: "react", hexQ: -1, hexR: 1, ownerGuildName: "WCE Compilers", conquestPoints: 295, bannerColor: "#38BDF8" },
  { nodeKey: "next-harbor", name: "Next.js Edge Harbor", region: "Frontend Core", topicTag: "nextjs", hexQ: -1, hexR: 0, ownerGuildName: null, conquestPoints: 120, bannerColor: "#A1A1AA" },
  { nodeKey: "prisma-vault", name: "Prisma Schema Vault", region: "Data Stronghold", topicTag: "prisma", hexQ: 1, hexR: 1, ownerGuildName: "QueryForge", conquestPoints: 260, bannerColor: "#34D399" },
  { nodeKey: "redis-outpost", name: "Redis Cache Outpost", region: "Data Stronghold", topicTag: "redis", hexQ: -2, hexR: 1, ownerGuildName: null, conquestPoints: 90, bannerColor: "#A1A1AA" },
  { nodeKey: "llm-sanctum", name: "LLM Inference Sanctum", region: "AI Citadel", topicTag: "ai", hexQ: 0, hexR: -1, ownerGuildName: "Neural Vanguard", conquestPoints: 480, bannerColor: "#C084FC" },
  { nodeKey: "rag-observatory", name: "Vector RAG Observatory", region: "AI Citadel", topicTag: "rag", hexQ: 1, hexR: -1, ownerGuildName: "Neural Vanguard", conquestPoints: 410, bannerColor: "#C084FC" },
  { nodeKey: "docker-dockyard", name: "Docker Container Dockyard", region: "Cloud & Infra", topicTag: "docker", hexQ: 2, hexR: -1, ownerGuildName: null, conquestPoints: 140, bannerColor: "#A1A1AA" },
  { nodeKey: "k8s-skybridge", name: "Kubernetes Skybridge", region: "Cloud & Infra", topicTag: "kubernetes", hexQ: -1, hexR: -1, ownerGuildName: null, conquestPoints: 110, bannerColor: "#A1A1AA" },
  { nodeKey: "wasm-atelier", name: "WebAssembly Atelier", region: "Systems Frontier", topicTag: "wasm", hexQ: 2, hexR: -2, ownerGuildName: "ZeroCopy Guild", conquestPoints: 225, bannerColor: "#F97316" },
  { nodeKey: "graphql-gate", name: "GraphQL Federation Gate", region: "API Ridge", topicTag: "graphql", hexQ: -2, hexR: 0, ownerGuildName: null, conquestPoints: 80, bannerColor: "#A1A1AA" },
  { nodeKey: "grpc-beacon", name: "gRPC Mesh Beacon", region: "API Ridge", topicTag: "grpc", hexQ: -2, hexR: 2, ownerGuildName: null, conquestPoints: 75, bannerColor: "#A1A1AA" },
  { nodeKey: "sec-palisade", name: "Zero-Trust Security Palisade", region: "Cloud & Infra", topicTag: "security", hexQ: 1, hexR: -2, ownerGuildName: null, conquestPoints: 155, bannerColor: "#A1A1AA" },
];

function hexToPixel(q: number, r: number, radius = 48): { cx: number; cy: number } {
  const cx = 420 + radius * Math.sqrt(3) * (q + r / 2);
  const cy = 260 + radius * 1.5 * r;
  return { cx, cy };
}

function hexagonPoints(cx: number, cy: number, radius = 44): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = ((60 * i - 30) * Math.PI) / 180;
    const x = cx + radius * Math.cos(angleRad);
    const y = cy + radius * Math.sin(angleRad);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

export interface GuildConquestMapPageProps {
  nodes?: HexTerritoryItem[];
}

export const GuildConquestMapPage: React.FC<GuildConquestMapPageProps> = ({
  nodes = DEFAULT_CONQUEST_NODES,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>(nodes[0]?.nodeKey ?? "");

  const selectedNode = useMemo(
    () => nodes.find((n) => n.nodeKey === selectedNodeKey) ?? nodes[0],
    [nodes, selectedNodeKey],
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Guild & Clan Warfare — Hexagonal Territory Conquest Map
            </h1>
            <p className="text-xs text-zinc-400">
              {nodes.length} Regional Tech Nodes · Click hexagons to inspect clan banners & drag/zoom to explore
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="map-zoom-in"
              onClick={() => setZoom((z) => Math.min(2, Number((z + 0.2).toFixed(2))))}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
            >
              <ZoomIn className="h-3.5 w-3.5" /> Zoom In
            </button>
            <button
              type="button"
              data-testid="map-zoom-out"
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
            >
              <ZoomOut className="h-3.5 w-3.5" /> Zoom Out
            </button>
            <button
              type="button"
              data-testid="map-reset-view"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 lg:col-span-2">
            <div
              data-testid="hex-map-viewport"
              data-zoom={zoom}
              data-pan={`${pan.x},${pan.y}`}
              className="mb-2 flex items-center justify-between text-[11px] font-mono text-zinc-400"
            >
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <span>Pan Offset: ({pan.x}px, {pan.y}px)</span>
            </div>

            <svg
              data-testid="hex-conquest-svg"
              viewBox="0 0 840 520"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="h-[440px] w-full cursor-grab rounded-xl bg-zinc-950 active:cursor-grabbing"
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {nodes.map((node) => {
                  const { cx, cy } = hexToPixel(node.hexQ, node.hexR, 46);
                  const isSelected = selectedNode?.nodeKey === node.nodeKey;
                  const strokeColor = node.ownerGuildName
                    ? node.bannerColor ?? "#38BDF8"
                    : "#3F3F46";

                  return (
                    <g
                      key={node.nodeKey}
                      data-testid={`hex-node-${node.nodeKey}`}
                      onClick={() => setSelectedNodeKey(node.nodeKey)}
                      className="cursor-pointer"
                    >
                      <polygon
                        points={hexagonPoints(cx, cy, 42)}
                        fill={node.ownerGuildName ? "#18181B" : "#111114"}
                        stroke={isSelected ? "#FFFFFF" : strokeColor}
                        strokeWidth={isSelected ? 3.5 : node.ownerGuildName ? 2.5 : 1.5}
                      />
                      {node.ownerGuildName && (
                        <circle cx={cx + 22} cy={cy - 22} r={6} fill={strokeColor} />
                      )}
                      <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        fill="#F4F4F5"
                        fontSize="9"
                        fontWeight="700"
                      >
                        {node.name.split(" ")[0]}
                      </text>
                      <text
                        x={cx}
                        y={cy + 10}
                        textAnchor="middle"
                        fill="#A1A1AA"
                        fontSize="8"
                      >
                        {node.conquestPoints} pts
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {selectedNode && (
            <div
              data-testid="selected-territory-panel"
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                    {selectedNode.region}
                  </span>
                  <span className="font-mono text-xs text-cyan-400">
                    #{selectedNode.topicTag}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">{selectedNode.name}</h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Conquest Score: <strong className="text-white">{selectedNode.conquestPoints} pts</strong>
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <Flag className="h-4 w-4 animate-pulse" />
                    <span>
                      Clan Banner:{" "}
                      {selectedNode.ownerGuildName
                        ? `${selectedNode.ownerGuildName} (Claimed)`
                        : "Unclaimed Frontier"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Battle victories & merged topic PRs capture this hex</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
                Weekly season resets distribute clan trophies & treasury coins.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuildConquestMapPage;
