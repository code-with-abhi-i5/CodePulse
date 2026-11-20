"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Bot, Zap, Code2, Activity, Flame, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { BOT_ARCHETYPES, BotArchetype } from "@/lib/bot-archetypes";

interface BotSelectorProps {
  onSelect: (bot: BotArchetype) => void;
  selectedId?: string;
}

const RESPONSE_SPEED_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  slow: Flame,
  balanced: Zap,
  rapid: Code2,
  "near-instant": Activity,
};

export function BotSelector({ onSelect, selectedId }: BotSelectorProps) {
  const [selected, setSelected] = useState<BotArchetype | undefined>(
    selectedId ? BOT_ARCHETYPES.find((b) => b.id === selectedId) : BOT_ARCHETYPES[0]
  );

  const handleSelect = useCallback(
    (bot: BotArchetype) => {
      setSelected(bot);
      onSelect(bot);
    },
    [onSelect]
  );

  return (
    <section className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Choose Your AI Opponent
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a difficulty tier. Harder bots award bonus XP on victory.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Badge variant="outline" className="h-6 px-3">
            1.0x Easy
          </Badge>
          <Badge variant="outline" className="h-6 px-3">
            1.25x Medium
          </Badge>
          <Badge variant="outline" className="h-6 px-3">
            1.5x Hard
          </Badge>
          <Badge variant="outline" className="h-6 px-3">
            2.0x Legendary
          </Badge>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide sm:overflow-visible">
        {BOT_ARCHETYPES.map((bot) => {
          const isSelected = selected?.id === bot.id;
          const SpeedIcon = RESPONSE_SPEED_ICONS[bot.responseSpeed];
          return (
            <motion.div
              key={bot.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 w-full sm:w-72"
            >
              <BotCard bot={bot} isSelected={isSelected} SpeedIcon={SpeedIcon} onSelect={handleSelect} />
            </motion.div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-muted/50">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Selected:</span>
          <span className={cn("text-sm font-bold", selected.color)}>{selected.name}</span>
          <span className="text-xs text-muted-foreground">({selected.difficulty})</span>
          <span className="text-xs text-muted-foreground ml-2">×{selected.xpMultiplier} XP</span>
        </div>
      )}
    </section>
  );
}

function BotCard({
  bot,
  isSelected,
  SpeedIcon,
  onSelect,
}: {
  bot: BotArchetype;
  isSelected: boolean;
  SpeedIcon: React.ComponentType<LucideProps>;
  onSelect: (bot: BotArchetype) => void;
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer hover:border-primary/50 transition-all",
        isSelected
          ? "border-primary ring-1 ring-primary bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncation">{bot.name}</CardTitle>
          <Badge variant="outline" className={cn("h-5 px-2", bot.color, bot.borderColor)}>
            {bot.difficulty.charAt(0).toUpperCase() + bot.difficulty.slice(1)}
          </Badge>
        </div>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-xs font-bold text-muted-foreground">{bot.tagline}</span>
          <Badge variant="outline" className={cn("h-5 px-2", bot.color, bot.borderColor)}>
            ×{bot.xpMultiplier} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center">
            <Avatar className="size-16 border border-border bg-background">
              <AvatarImage src={bot.avatar} alt={bot.name} />
            </Avatar>
            <span className="mt-2 text-xs font-medium text-foreground">{bot.name}</span>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 border border-border text-xs font-bold leading-none">
            {bot.winRate}%
          </div>
        </div>

        <div className="space-y-2">
          <StatRow label="Win Rate" value={bot.winRate + "%"} icon={<Flame className="w-3 h-3" />} color={bot.color} />
          <StatRow label="Favorite Language" value={bot.favoriteLanguage} icon={<Code2 className="w-3 h-3" />} color={bot.color} />
          <StatRow label="Difficulty" value={bot.difficultyRating + "/10"} icon={<Zap className="w-3 h-3" />} color={bot.color} />
          <StatRow
            label="Response Speed"
            value={bot.responseSpeed.charAt(0).toUpperCase() + bot.responseSpeed.slice(1)}
            icon={<SpeedIcon className="w-3 h-3" />}
            color={bot.color}
          />
        </div>

        <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
          <div className={cn(bot.bgColor, bot.color)} style={{ width: (bot.difficultyRating / 10) * 100 + "%", height: "100%" }} />
        </div>

        <p className="mt-2 text-xs italic text-muted-foreground text-center">
          &quot;{bot.banter[0]}&quot;
        </p>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onSelect(bot)}
          variant={isSelected ? "default" : "outline"}
          className={cn(
            "w-full text-sm font-bold",
            isSelected && "bg-primary text-primary-foreground shadow-sm"
          )}
        >
          {isSelected ? "Selected ✓" : "Select Bot"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatRow({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between text-xs px-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {Icon}
        <span>{label}</span>
      </div>
      <span className={cn(color, "font-medium")}>{value}</span>
    </div>
  );
}
