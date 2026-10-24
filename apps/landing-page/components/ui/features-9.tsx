"use client";

import { Activity, Map as MapIcon, MessageCircle } from "lucide-react";
import DottedMap from "dotted-map";
import { Area, AreaChart, CartesianGrid } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 bg-background px-4 py-16 md:py-32">
      <div className="mx-auto grid max-w-5xl border md:grid-cols-2">
        <div>
          <div className="p-6 sm:p-12">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapIcon className="size-4" />
              Pros across all nine provinces
            </span>

            <p className="mt-8 text-2xl font-semibold">
              Hire verified pros nearby or work fully remote.
            </p>
          </div>

          <div aria-hidden className="relative">
            <div className="absolute inset-0 z-10 m-auto size-fit">
              <div className="relative z-[1] flex size-fit w-fit items-center gap-2 rounded-lg border bg-background px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                <span className="text-lg">🇿🇦</span> New proposal from a photographer in Durban
              </div>
              <div className="absolute inset-2 -bottom-2 mx-auto rounded-lg border bg-background px-3 py-4 text-xs font-medium shadow-md shadow-black/5"></div>
            </div>

            <div className="relative overflow-hidden">
              <div className="absolute inset-0 z-1 bg-radial from-transparent to-background to-75%"></div>
              <WorldMap />
            </div>
          </div>
        </div>
        <div className="overflow-hidden border-t bg-secondary p-6 sm:p-12 md:border-0 md:border-l">
          <div className="relative z-10">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="size-4" />
              Chat
            </span>

            <p className="my-8 text-2xl font-semibold">
              Built-in messaging to keep every gig on track.
            </p>
          </div>
          <div aria-hidden className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full border">
                  <span className="size-3 rounded-full bg-primary" />
                </span>
                <span className="text-xs text-muted-foreground">Sat 22 Feb</span>
              </div>
              <div className="mt-1.5 w-3/5 rounded-lg border bg-background p-3 text-xs">
                I just viewed your proposal. Have you shot weddings this size before?
              </div>
            </div>

            <div>
              <div className="mb-1 ml-auto w-3/5 rounded-lg bg-primary p-3 text-xs text-primary-foreground">
              Hi John! I&apos;ve covered 40+ weddings this year, 150 guests and up. I&apos;ll send my full gallery and a timeline for your day.
              </div>
              <span className="block text-right text-xs text-muted-foreground">Now</span>
            </div>
          </div>
        </div>
        <div className="col-span-full border-y p-12">
          <p className="text-center text-4xl font-semibold lg:text-7xl">
            Pay only for <span className="text-primary">approved work</span>
          </p>
        </div>
        <div className="relative col-span-full">
          <div className="absolute z-10 max-w-lg px-6 pt-6 pr-12 md:px-12 md:pt-12">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Activity className="size-4" />
              Escrow activity
            </span>

            <p className="my-8 text-2xl font-semibold">
              Follow every milestone in real time.{" "}
              <span className="text-muted-foreground">
                See what&apos;s funded, what&apos;s approved and what&apos;s been paid out.
              </span>
            </p>
          </div>
          <MonitoringChart />
        </div>
      </div>
    </section>
  );
}

const map = new DottedMap({ height: 55, grid: "diagonal" });

const points = map.getPoints();

const svgOptions = {
  backgroundColor: "var(--color-background)",
  color: "currentColor",
  radius: 0.15,
};

const WorldMap = () => {
  const viewBox = `0 0 120 60`;
  return (
    <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }}>
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={svgOptions.radius}
          fill={svgOptions.color}
        />
      ))}
    </svg>
  );
};

const chartConfig = {
  funded: {
    label: "Funded",
    color: "#ee6c2b",
  },
  released: {
    label: "Released",
    color: "#f6a77d",
  },
} satisfies ChartConfig;

const chartData = [
  { month: "January", funded: 56, released: 224 },
  { month: "February", funded: 56, released: 224 },
  { month: "March", funded: 126, released: 252 },
  { month: "April", funded: 205, released: 410 },
  { month: "May", funded: 200, released: 126 },
  { month: "June", funded: 400, released: 800 },
];

const MonitoringChart = () => {
  return (
    <ChartContainer className="aspect-auto h-120 md:h-96" config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 0,
        }}
      >
        <defs>
          <linearGradient id="fillFunded" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-funded)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-funded)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillReleased" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-released)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-released)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          strokeWidth={2}
          dataKey="released"
          type="stepBefore"
          fill="url(#fillReleased)"
          fillOpacity={0.1}
          stroke="var(--color-released)"
          stackId="a"
        />
        <Area
          strokeWidth={2}
          dataKey="funded"
          type="stepBefore"
          fill="url(#fillFunded)"
          fillOpacity={0.1}
          stroke="var(--color-funded)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
};
