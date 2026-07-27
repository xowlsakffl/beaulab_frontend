"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Star } from "@beaulab/ui-admin";

import {
  formatHospitalEvaluationAverageRating,
  formatHospitalEvaluationDetailRating,
  type HospitalEvaluationAssessment,
  type HospitalEvaluationDetailResponse,
} from "@/lib/hospital-evaluation/detail";

export function ReportedEvaluationRatingScoreCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
  const ratings = detail.ratings ?? {};
  const rows = [
    { label: "직원 친절도", value: ratings.staff_kindness },
    { label: "수술 만족도", value: ratings.surgery_satisfaction },
    { label: "병원시설", value: ratings.facility },
    { label: "사후관리", value: ratings.aftercare },
    { label: "비용", value: ratings.cost },
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>평가점수</CardTitle>
          <span className="text-sm font-semibold text-gray-900">
            {formatHospitalEvaluationAverageRating(ratings.average)}점
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="font-medium text-gray-700">{row.label}</span>
            <ReportedEvaluationStarRating value={Number(row.value ?? 0)} />
            <span className="text-right font-semibold text-gray-700">
              {formatHospitalEvaluationDetailRating(row.value)}점
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReportedEvaluationAssessmentCard({ assessment }: { assessment?: HospitalEvaluationAssessment | null }) {
  const rows = [
    {
      label: "과잉진료",
      value: normalizeEvaluationAssessmentBoolean(assessment?.overtreatment?.value),
      options: [
        { value: true, label: "있음" },
        { value: false, label: "없음" },
      ],
    },
    {
      label: "대기시간",
      value: normalizeEvaluationAssessmentBoolean(assessment?.waiting_time?.value),
      options: [
        { value: true, label: "길었음" },
        { value: false, label: "짧았음" },
      ],
    },
    {
      label: "지정의사",
      value: normalizeEvaluationAssessmentBoolean(assessment?.doctor_consultation?.value),
      options: [
        { value: false, label: "상담안함" },
        { value: true, label: "상담함" },
      ],
    },
    {
      label: "지인에게",
      value: normalizeEvaluationAssessmentBoolean(assessment?.recommendation?.value),
      options: [
        { value: false, label: "비추천" },
        { value: true, label: "추천" },
      ],
    },
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>평가 항목</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">{row.label}</span>
            <div className="grid grid-cols-2 gap-2">
              {row.options.map((option) => (
                <span
                  key={option.label}
                  className={[
                    "inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1",
                    option.value === row.value
                      ? "bg-brand-500 text-white ring-brand-500"
                      : "bg-white text-gray-600 ring-gray-200",
                  ].join(" ")}
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReportedEvaluationStarRating({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={[
            "size-5",
            index < normalizedValue ? "fill-brand-500 text-brand-500" : "fill-gray-200 text-gray-300",
          ].join(" ")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function normalizeEvaluationAssessmentBoolean(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;

  return false;
}
