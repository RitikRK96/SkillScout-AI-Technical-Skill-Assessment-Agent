import { useAssessmentStore } from "../../store/useAssessmentStore";
import { CheckCircle2, Circle, Radio } from "lucide-react";

export const SkillProgressBar = () => {
  const { session } = useAssessmentStore();
  if (!session) return null;

  const { skillsToAssess, currentSkillIndex } = session;
  const progress = ((currentSkillIndex) / skillsToAssess.length) * 100;

  return (
    <div className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-20">
      <div className="w-[80%] mx-auto py-4">
        {/* Top row: Title + Step Counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">SS</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">SkillScout Assessment</h2>
              <p className="text-xs text-gray-500">
                Skill {Math.min(currentSkillIndex + 1, skillsToAssess.length)} of {skillsToAssess.length}
                {" · "}
                <span className="font-semibold text-indigo-600">{skillsToAssess[currentSkillIndex]}</span>
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {Math.round(progress)}% Complete
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>

        {/* Skill pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {skillsToAssess.map((skill, idx) => {
            const isCompleted = idx < currentSkillIndex;
            const isCurrent = idx === currentSkillIndex;

            return (
              <div
                key={idx}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                  transition-all duration-300 border
                  ${isCurrent
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-100"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-400 border-gray-100"
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : isCurrent ? (
                  <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-300" />
                )}
                {skill}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
