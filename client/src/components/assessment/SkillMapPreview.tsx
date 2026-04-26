import React, { useState } from "react";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "../../lib/axios";
import toast from "react-hot-toast";

export const SkillMapPreview = () => {
  const { session, setSession } = useAssessmentStore();
  const [loading, setLoading] = useState(false);

  if (!session || !session.parsedJD || !session.parsedResume) return null;

  const { requiredSkills } = session.parsedJD;
  const { claimedSkills } = session.parsedResume;
  const { skillsToAssess } = session;

  const handleStartAssessment = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/assessments/${session._id}/confirm-skills`, {
        skillsToAssess,
      });
      setSession(data);
    } catch (error) {
      toast.error("Failed to start assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Skill Analysis Complete</h2>
        <p className="text-gray-500">Here's what we found in the Job Description and your Resume.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Required Skills */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2">Required by this role</h3>
          <div className="space-y-3">
            {requiredSkills.map((skill, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-lg">{skill.skillName}</div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{skill.category}</Badge>
                      {skill.isNonNegotiable && <Badge variant="destructive">Required</Badge>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{skill.description}</div>
                  <div className="text-sm">
                    Required Level: <span className="font-medium text-indigo-600">{skill.requiredLevel}/10</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Claimed Skills */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2">Found in your resume</h3>
          <div className="space-y-3">
            {claimedSkills.map((skill, idx) => {
              const overlaps = requiredSkills.some(
                (rs) => rs.skillName.toLowerCase() === skill.skillName.toLowerCase()
              );
              return (
                <Card key={idx} className={overlaps ? "border-green-200 bg-green-50/30" : "bg-gray-50"}>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-lg">{skill.skillName}</div>
                      <Badge variant={overlaps ? "default" : "secondary"} className={overlaps ? "bg-green-500" : ""}>
                        {overlaps ? "Matches JD" : "Additional"}
                      </Badge>
                    </div>
                    <div className="text-sm italic text-gray-600">"{skill.evidenceSnippet}"</div>
                    <div className="text-sm flex gap-4">
                      <span>Exp: <span className="font-medium">{skill.yearsExperience}y</span></span>
                      <span>Est. Level: <span className="font-medium text-indigo-600">{skill.claimedLevel}/10</span></span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-indigo-900">Assessment Plan</h3>
        <p className="text-indigo-700 text-sm">We'll assess these skills in the following order:</p>
        <div className="flex flex-wrap gap-2">
          {skillsToAssess.map((skill, idx) => (
            <Badge key={idx} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700">
              {idx + 1}. {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" className="w-64" onClick={handleStartAssessment} disabled={loading}>
          {loading ? "Starting..." : "Start Assessment →"}
        </Button>
      </div>
    </div>
  );
};
