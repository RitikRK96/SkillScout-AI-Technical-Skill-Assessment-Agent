import React from "react";
import type { LearningPlan, PrioritySkillPlan } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ExternalLink, Calendar } from "lucide-react";

const ResourceCard = ({ resource }: { resource: PrioritySkillPlan["learningPath"][0] }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="capitalize">{resource.resourceType}</Badge>
          <Badge className={
            resource.difficulty === "beginner" ? "bg-green-500" :
            resource.difficulty === "intermediate" ? "bg-amber-500" : "bg-red-500"
          }>{resource.difficulty}</Badge>
        </div>
        <h4 className="font-semibold text-lg leading-tight mb-1">{resource.resourceTitle}</h4>
        <div className="text-sm text-gray-500 mb-3">{resource.provider}</div>
        <p className="text-sm text-gray-700 flex-1 mb-4">{resource.whyRecommended}</p>
        <div className="flex justify-between items-center mt-auto pt-4 border-t">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" /> {resource.estimatedHours}h
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Open <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export const LearningPlanView = ({ plan }: { plan: LearningPlan }) => {
  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{plan.estimatedWeeksToReady}</div>
              <div className="text-sm text-gray-500">Weeks to Ready</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{plan.totalLearningHours}</div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{plan.quickWins.length}</div>
              <div className="text-sm text-gray-500">Quick Wins</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Wins */}
      {plan.quickWins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">⚡</span> Quick Wins
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {plan.quickWins.map((win, idx) => (
              <Badge key={idx} className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 text-sm whitespace-nowrap">
                {win}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Priority Plans */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold">Your Priority Focus Areas</h3>
        {plan.prioritySkillPlans.map((skillPlan, idx) => (
          <Card key={idx} className="border-t-4 border-t-indigo-500">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{skillPlan.skillName}</CardTitle>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Level: <strong className="text-gray-900">{skillPlan.currentLevel} → {skillPlan.targetLevel}</strong></span>
                    <span>•</span>
                    <span>{skillPlan.estimatedWeeks} weeks</span>
                    <span>•</span>
                    <span>{skillPlan.weeklyHoursRequired}h / week</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Adjacent Skills Leverage */}
              {skillPlan.adjacentSkillsToLeverage.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 flex gap-3">
                  <div className="text-indigo-500 mt-1">💡</div>
                  <div>
                    <strong className="text-indigo-900 block mb-1">Leverage Your Existing Skills</strong>
                    <p className="text-sm text-indigo-800">
                      You can learn this faster by drawing parallels to your experience with:{" "}
                      {skillPlan.adjacentSkillsToLeverage.map((s, i) => (
                        <strong key={i}>{s}{i < skillPlan.adjacentSkillsToLeverage.length - 1 ? ", " : ""}</strong>
                      ))}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Curated Resources</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skillPlan.learningPath.map((resource, i) => (
                    <ResourceCard key={i} resource={resource} />
                  ))}
                </div>
              </div>

              {/* Week by Week */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Milestones</h4>
                <div className="space-y-4">
                  {skillPlan.weekByWeekMilestones.map((ms, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-16 pt-1 text-center font-bold text-gray-400 shrink-0">
                        Wk {ms.week}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="font-semibold mb-2 text-indigo-900">{ms.goal}</div>
                        <ul className="space-y-1 text-sm text-gray-600 list-disc pl-5">
                          {ms.activities.map((act, j) => (
                            <li key={j}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
