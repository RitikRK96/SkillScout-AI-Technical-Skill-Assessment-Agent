import React from "react";
import type { SkillScore } from "@shared/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ProficientBar = ({ level, max = 10, colorClass }: { level: number; max?: number; colorClass: string }) => {
  return (
    <div className="flex gap-1 h-3">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${i < level ? colorClass : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
};

export const ScoreCard = ({ score }: { score: SkillScore }) => {
  const [expanded, setExpanded] = useState(false);

  const getAssessedColor = () => {
    if (score.isGap) return "bg-red-500";
    if (score.assessedLevel >= score.requiredLevel) return "bg-green-500";
    return "bg-amber-500";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{score.skillName}</h3>
              <div className="flex gap-2 mt-1">
                {score.isGap && <Badge variant="destructive">Gap Identified</Badge>}
                {!score.isGap && <Badge className="bg-green-500">Meets Requirements</Badge>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{score.assessedLevel}<span className="text-lg text-gray-400">/10</span></div>
              <div className="text-sm text-gray-500">Assessed Level</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4 text-sm">
              <span className="text-gray-500">Required</span>
              <ProficientBar level={score.requiredLevel} colorClass="bg-gray-800" />
              <span className="text-right font-medium">{score.requiredLevel}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4 text-sm">
              <span className="text-gray-500">Claimed</span>
              <ProficientBar level={score.claimedLevel} colorClass="bg-gray-400" />
              <span className="text-right font-medium">{score.claimedLevel}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4 text-sm">
              <span className="font-medium">Assessed</span>
              <ProficientBar level={score.assessedLevel} colorClass={getAssessedColor()} />
              <span className="text-right font-medium">{score.assessedLevel}</span>
            </div>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            {score.assessmentSummary}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
          >
            {expanded ? "Hide Details" : "View Details"}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="bg-gray-50 p-6 border-t grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Strengths
              </h4>
              <ul className="space-y-1 text-gray-600 list-disc pl-5">
                {score.keyStrengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Areas for Growth
              </h4>
              <ul className="space-y-1 text-gray-600 list-disc pl-5">
                {score.keyWeaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
