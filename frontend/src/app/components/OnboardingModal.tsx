"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserPreferences, UserPriority } from "@/types/college";

const onboardingKey = "onboarding_done";
const preferencesKey = "user_preferences";

type StreamInterest = UserPreferences["streamInterest"];
type ExamGiven = UserPreferences["examGiven"];

type OnboardingModalProps = {
  onPreferencesSaved?: (preferences: UserPreferences | null) => void;
};

const streams: StreamInterest[] = [
  "Engineering",
  "Medical",
  "Commerce",
  "Law",
];
const exams: ExamGiven[] = ["JEE", "CUET", "NEET", "State"];
const priorities: UserPriority[] = ["Fees", "Placement", "Location"];

function RadioCards<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: TValue[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = option === value;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="rounded-lg border bg-white p-4 text-left text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            style={
              isSelected
                ? {
                    borderColor: "#006AFF",
                    backgroundColor: "rgba(0, 106, 255, 0.06)",
                  }
                : undefined
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingModal({
  onPreferencesSaved,
}: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [streamInterest, setStreamInterest] =
    useState<StreamInterest>("Engineering");
  const [examGiven, setExamGiven] = useState<ExamGiven>("JEE");
  const [priority, setPriority] = useState<UserPriority>("Placement");

  useEffect(() => {
    if (window.localStorage.getItem(onboardingKey) !== "true") {
      setIsOpen(true);
    }
  }, []);

  function completeOnboarding() {
    const preferences: UserPreferences = {
      streamInterest,
      examGiven,
      priority,
    };

    window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    window.localStorage.setItem(onboardingKey, "true");
    onPreferencesSaved?.(preferences);
    setIsOpen(false);
  }

  function skipOnboarding() {
    window.localStorage.setItem(onboardingKey, "true");
    onPreferencesSaved?.(null);
    setIsOpen(false);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setIsOpen(true);
          return;
        }

        skipOnboarding();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Personalize CollegeHunt</DialogTitle>
          <DialogDescription>
            Step {step} of 3. Skip to continue without personalized ordering.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-4">
            <h2 className="text-base font-bold text-gray-900">
              What stream are you interested in?
            </h2>
            <RadioCards
              options={streams}
              value={streamInterest}
              onChange={setStreamInterest}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <h2 className="text-base font-bold text-gray-900">
              Which exam have you given?
            </h2>
            <RadioCards options={exams} value={examGiven} onChange={setExamGiven} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <h2 className="text-base font-bold text-gray-900">
              What matters most right now?
            </h2>
            <RadioCards
              options={priorities}
              value={priority}
              onChange={setPriority}
            />
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={skipOnboarding}>
            Skip personalization
          </Button>
          <div className="flex gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => current - 1)}
              >
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((current) => current + 1)}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={completeOnboarding}>
                Save preferences
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
