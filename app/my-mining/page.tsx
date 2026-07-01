"use client";

import { ActiveMining, EarningsByCommodity } from "@/app/page";
import { PayoutHistory } from "@/components/PayoutHistory";

export default function MyMiningPage() {
  return (
    <>
      <div className="two-col">
        <ActiveMining />
        <EarningsByCommodity />
      </div>
      <PayoutHistory title="Session History" countNoun="session" />
    </>
  );
}
