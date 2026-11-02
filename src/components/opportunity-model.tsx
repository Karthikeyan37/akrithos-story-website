"use client";

import { useState } from "react";

export function OpportunityModel() {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyValue, setHourlyValue] = useState(40);
  const [reduciblePercent, setReduciblePercent] = useState(30);

  const hoursSavedMonthly = Math.round(hoursPerWeek * 4.3 * (reduciblePercent / 100));
  const dollarsSavedMonthly = Math.round(hoursSavedMonthly * hourlyValue);

  return (
    <div className="rounded-feature border border-stone-100 bg-paper p-5 sm:p-7">
      <p className="font-mono text-overline uppercase text-terracotta">Opportunity Model</p>
      <p className="mt-3 text-h3 font-semibold">Build a scenario from your own assumptions.</p>
      <p className="mt-2 text-label text-stone-600">
        Every input below is yours to set. Nothing here is a forecast or an Akrithos client benchmark.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex justify-between text-label">
            <label htmlFor="hours">Hours/week your team spends on this workflow</label>
            <span className="font-mono text-terracotta">{hoursPerWeek}h</span>
          </div>
          <input
            id="hours"
            type="range"
            min={1}
            max={40}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="mt-2 w-full accent-terracotta"
          />
        </div>

        <div>
          <div className="flex justify-between text-label">
            <label htmlFor="rate">Loaded value of that time, per hour</label>
            <span className="font-mono text-terracotta">${hourlyValue}</span>
          </div>
          <input
            id="rate"
            type="range"
            min={15}
            max={200}
            step={5}
            value={hourlyValue}
            onChange={(e) => setHourlyValue(Number(e.target.value))}
            className="mt-2 w-full accent-terracotta"
          />
        </div>

        <div>
          <div className="flex justify-between text-label">
            <label htmlFor="percent">Your own estimate: % of this that could be reduced</label>
            <span className="font-mono text-terracotta">{reduciblePercent}%</span>
          </div>
          <input
            id="percent"
            type="range"
            min={0}
            max={100}
            step={5}
            value={reduciblePercent}
            onChange={(e) => setReduciblePercent(Number(e.target.value))}
            className="mt-2 w-full accent-terracotta"
          />
        </div>
      </div>

      <div className="mt-6 rounded-card bg-stone-50 p-5 font-mono text-label">
        <p className="text-stone-600">
          Scenario time: <span className="text-ink">{hoursSavedMonthly} hrs/month</span>
        </p>
        <p className="mt-1 text-stone-600">
          Scenario value: <span className="text-terracotta">${dollarsSavedMonthly.toLocaleString()}/month</span>
        </p>
      </div>
      <p className="mt-3 text-label text-stone-400">
        Scenario based entirely on your assumptions above — not a forecast or Akrithos client benchmark.
        Validate it in the Diagnostic before treating it as real.
      </p>
    </div>
  );
}
