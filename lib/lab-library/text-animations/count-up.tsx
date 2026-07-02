'use client';

import React from 'react';
import CountUp from 'react-countup';

/** CountUpText — numero che si conta allo scroll. Props: end, duration?, prefix?, suffix?. */
export interface CountUpTextProps { end: number; duration?: number; prefix?: string; suffix?: string; decimals?: number; className?: string; }

export function CountUpText({ end, duration = 1.8, prefix = '', suffix = '', decimals = 0, className }: CountUpTextProps) {
  return (
    <span className={className}>
      <CountUp end={end} duration={duration} prefix={prefix} suffix={suffix} decimals={decimals} separator="." enableScrollSpy scrollSpyOnce />
    </span>
  );
}

export default CountUpText;
