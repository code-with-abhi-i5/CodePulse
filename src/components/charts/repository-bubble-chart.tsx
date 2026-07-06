"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Code2, Star, GitFork, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryBubbleChartProps {
  repos: any[];
}

// Repurposing this component into a "Top Repositories" showcase
export function RepositoryBubbleChart({ repos }: RepositoryBubbleChartProps) {
  // Get top 4 repos sorted by stars (then forks)
  const topRepos = useMemo(() => {
    return [...repos]
      .sort((a, b) => {
        const scoreA = (a.stars || 0) * 2 + (a.forks || 0);
        const scoreB = (b.stars || 0) * 2 + (b.forks || 0);
        return scoreB - scoreA;
      })
      .slice(0, 4);
  }, [repos]);

  if (topRepos.length === 0) {
    return (
      <div className="glass-card rounded-[32px] p-8 border border-white/5 h-full flex flex-col items-center justify-center">
        <Code2 className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
        <p className="text-muted-foreground">No repositories found.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[32px] p-8 border border-white/5 h-full flex flex-col relative overflow-hidden group">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-1000" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/20">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            Top Repositories
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your most impactful projects based on community engagement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 flex-1">
        {topRepos.map((repo, idx) => (
          <motion.a
            key={repo.id}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
            className="group/card relative rounded-2xl p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Hover Gradient based on language color */}
            <div 
              className="absolute inset-0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${repo.languageColor || '#888'} 0%, transparent 100%)`
              }}
            />
            
            <div className="mb-4 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-bold text-lg text-slate-200 group-hover/card:text-white transition-colors truncate" title={repo.name}>
                  {repo.name}
                </h4>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover/card:text-white opacity-0 group-hover/card:opacity-100 transition-all -translate-x-2 group-hover/card:translate-x-0" />
              </div>
              
              {repo.description && (
                <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shadow-sm" 
                  style={{ 
                    backgroundColor: repo.languageColor || '#888',
                    boxShadow: `0 0 8px ${repo.languageColor || '#888'}`
                  }} 
                />
                <span className="text-xs font-medium text-slate-300">{repo.language || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold",
                  repo.stars > 0 ? "text-amber-400" : "text-slate-500"
                )}>
                  <Star className="w-3.5 h-3.5" />
                  {repo.stars || 0}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold",
                  repo.forks > 0 ? "text-emerald-400" : "text-slate-500"
                )}>
                  <GitFork className="w-3.5 h-3.5" />
                  {repo.forks || 0}
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
