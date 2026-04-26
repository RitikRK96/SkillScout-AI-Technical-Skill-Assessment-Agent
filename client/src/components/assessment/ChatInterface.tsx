import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import { useSSE } from "../../hooks/useSSE";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { SkillProgressBar } from "./SkillProgressBar";

// ─── Speech Helpers ──────────────────────────────────────────────
const speak = (text: string, onEnd?: () => void) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  // Pick a good English female voice if available
  const voices = window.speechSynthesis.getVoices();
  const femaleNames = ["Female", "Samantha", "Zira", "Victoria", "Karen", "Tessa", "Google UK English Female", "Google US English"];
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && femaleNames.some(name => v.name.includes(name))
  ) || voices.find(
    (v) => v.lang.startsWith("en") && v.name.includes("Google")
  ) || voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
};

const stopSpeaking = () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
};

// SpeechRecognition API (webkit-prefixed in Chrome)
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const ChatInterface = () => {
  const { session, streamingText, addMessage } = useAssessmentStore();
  const { send, streaming } = useSSE(session?._id || null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Speech state
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenIdxRef = useRef<number>(-1);

  // Load voices (they load async in some browsers)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", () => {
      window.speechSynthesis.getVoices();
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.conversationHistory, streamingText]);

  // Auto-start skill opener
  useEffect(() => {
    if (session && session.status === "assessing" && !streaming) {
      const currentSkill = session.skillsToAssess[session.currentSkillIndex];
      const historyForSkill = session.conversationHistory.filter(
        (m) => m.skillBeingAssessed === currentSkill
      );
      if (historyForSkill.length === 0) {
        send("START_SKILL");
      }
    }
  }, [session?.currentSkillIndex, session?.status]);

  // Auto-speak new agent messages when autoSpeak is on
  useEffect(() => {
    if (!autoSpeak || !session) return;
    const msgs = session.conversationHistory;
    const lastIdx = msgs.length - 1;
    if (lastIdx >= 0 && msgs[lastIdx].role === "agent" && lastIdx > lastSpokenIdxRef.current) {
      lastSpokenIdxRef.current = lastIdx;
      setSpeakingIdx(lastIdx);
      speak(msgs[lastIdx].content, () => setSpeakingIdx(null));
    }
  }, [session?.conversationHistory.length, autoSpeak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSpeak = (text: string, idx: number) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
    } else {
      setSpeakingIdx(idx);
      speak(text, () => setSpeakingIdx(null));
    }
  };

  const toggleListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    // Capture whatever is currently typed so we don't overwrite it
    const baseText = input;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      const space = baseText && !baseText.endsWith(" ") && transcript ? " " : "";
      setInput(baseText + space + transcript);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  }, [listening, input]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    // Stop listening if active
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
    addMessage({
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      skillBeingAssessed: session?.skillsToAssess[session?.currentSkillIndex || 0],
    });
    send(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!session) return null;

  const currentSkillMessages = session.conversationHistory;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      <SkillProgressBar />
      
      {/* Chat Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-[80%] mx-auto py-6 space-y-5">
          {currentSkillMessages.map((msg, idx) => {
            const isAgent = msg.role === "agent";
            
            const prevMsg = idx > 0 ? currentSkillMessages[idx - 1] : null;
            const showDivider = prevMsg && prevMsg.skillBeingAssessed !== msg.skillBeingAssessed && prevMsg.skillBeingAssessed;

            return (
              <React.Fragment key={idx}>
                {showDivider && (
                  <div className="flex items-center gap-3 my-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span> {prevMsg.skillBeingAssessed} complete · Now assessing {msg.skillBeingAssessed}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                  </div>
                )}
                <div className={`flex gap-3 ${isAgent ? "justify-start" : "justify-end"}`}>
                  {/* Agent Avatar */}
                  {isAgent && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-1 shadow-md shadow-indigo-200/50">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] px-4 py-3 ${
                      isAgent
                        ? "bg-white border border-gray-200/80 text-gray-800 rounded-2xl rounded-tl-md shadow-sm"
                        : "bg-indigo-600 text-white rounded-2xl rounded-tr-md shadow-md shadow-indigo-200/40"
                    }`}
                  >
                    {isAgent && (
                      <div className="text-[11px] font-bold text-indigo-500 mb-1.5 uppercase tracking-wider">SkillScout</div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
                    <div className={`flex items-center gap-2 mt-2 ${isAgent ? "text-gray-400" : "text-indigo-200"}`}>
                      <span className="text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* TTS button on agent messages */}
                      {isAgent && (
                        <button
                          onClick={() => handleSpeak(msg.content, idx)}
                          className={`p-1 rounded-md transition-colors ${
                            speakingIdx === idx
                              ? "bg-indigo-100 text-indigo-600"
                              : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          }`}
                          title={speakingIdx === idx ? "Stop speaking" : "Read aloud"}
                        >
                          {speakingIdx === idx ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {!isAgent && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mt-1 shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          
          {/* Streaming Message */}
          {streamingText && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-1 shadow-md shadow-indigo-200/50">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="max-w-[70%] px-4 py-3 bg-white border border-gray-200/80 text-gray-800 rounded-2xl rounded-tl-md shadow-sm">
                <div className="text-[11px] font-bold text-indigo-500 mb-1.5 uppercase tracking-wider">SkillScout</div>
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 rounded-sm animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator when waiting */}
          {streaming && !streamingText && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-1 shadow-md shadow-indigo-200/50">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-5 py-4 bg-white border border-gray-200/80 rounded-2xl rounded-tl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200/60">
        <div className="w-[80%] mx-auto py-4">
          <div className="flex gap-3 items-end">
            {/* Mic Button */}
            <Button
              type="button"
              onClick={toggleListening}
              className={`h-[52px] w-[52px] shrink-0 rounded-xl transition-all ${
                listening
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200/50 animate-pulse"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-sm"
              }`}
              title={listening ? "Stop listening" : "Speak your answer"}
            >
              {listening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listening ? "🎤 Listening... speak now" : "Type your answer here... (Press Enter to send, Shift+Enter for newline)"}
                className={`min-h-[52px] max-h-[200px] resize-none rounded-xl border-gray-200 bg-gray-50/80 pr-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  listening ? "border-red-300 ring-2 ring-red-100 bg-red-50/30" : ""
                }`}
                disabled={streaming}
              />
            </div>

            {/* Send Button */}
            <Button 
              className="h-[52px] w-[52px] shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-xl hover:shadow-indigo-200/60 disabled:opacity-40 disabled:shadow-none"
              onClick={handleSend}
              disabled={!input.trim() || streaming}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (autoSpeak) stopSpeaking();
              }}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                autoSpeak
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              {autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
            </button>
            <p className="text-[11px] text-gray-400">
              {listening ? "🔴 Recording... click mic to stop" : "Use mic to speak or type your answer"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
