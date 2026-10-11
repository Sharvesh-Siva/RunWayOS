/**
 * RunwayOS — 30-Day Cash-Flow Area Chart
 * Interactive, high-precision SVG area & line visualization.
 * Displays baseline projection, user minimum reserve reference,
 * constraint breach markers, and optional scenario preview comparison.
 */

import React, { useState, useId } from 'react';
import { DayForecast, DecisionOption } from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { AlertTriangle, Eye, Table, LineChart as ChartIcon } from 'lucide-react';

interface CashflowAreaChartProps {
  forecast: DayForecast[];
  previewForecast?: DayForecast[] | null;
  minimumReserve: number;
  simulationDay: number;
  firstBreachDay: number | null;
  onSelectDay?: (day: number) => void;
  previewOption?: DecisionOption | null;
}

export const CashflowAreaChart: React.FC<CashflowAreaChartProps> = ({
  forecast,
  previewForecast,
  minimumReserve,
  simulationDay,
  firstBreachDay,
  onSelectDay,
  previewOption,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [showTableView, setShowTableView] = useState(false);
  const gradientId = useId();
  const previewGradientId = useId();

  // SVG dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Determine scale boundaries
  const allBalances = [
    ...forecast.map((f) => f.closingBalance),
    ...(previewForecast ? previewForecast.map((f) => f.closingBalance) : []),
    minimumReserve,
    0,
  ];
  const minBalance = Math.min(...allBalances);
  const maxBalance = Math.max(...allBalances);

  // Buffer y domain
  const yMin = Math.min(0, Math.floor(minBalance / 1000) * 1000);
  const yMax = Math.max(10000, Math.ceil(maxBalance / 1000) * 1000 + 1000);
  const yRange = yMax - yMin || 1;

  // Coordinate mappers
  const getX = (day: number) => {
    return padding.left + ((day - 1) / 29) * chartWidth;
  };

  const getY = (balance: number) => {
    const normalized = (balance - yMin) / yRange;
    return padding.top + chartHeight - normalized * chartHeight;
  };

  // Build SVG Path strings
  const baselinePoints = forecast.map((f) => ({
    x: getX(f.day),
    y: getY(f.closingBalance),
    day: f.day,
    balance: f.closingBalance,
  }));

  const linePath = baselinePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${getX(30)} ${getY(yMin)} L ${getX(1)} ${getY(yMin)} Z`;

  // Preview path if active
  let previewLinePath = '';
  let previewAreaPath = '';
  if (previewForecast && previewForecast.length === 30) {
    const previewPoints = previewForecast.map((f) => ({
      x: getX(f.day),
      y: getY(f.closingBalance),
    }));
    previewLinePath = previewPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
    previewAreaPath = `${previewLinePath} L ${getX(30)} ${getY(yMin)} L ${getX(1)} ${getY(yMin)} Z`;
  }

  // Reserve line Y coordinate
  const reserveY = getY(minimumReserve);
  const zeroY = getY(0);

  // Y-axis grid ticks (e.g. 5 ticks)
  const yTicks = [
    yMin,
    Math.round(yMin + yRange * 0.25),
    Math.round(yMin + yRange * 0.5),
    Math.round(yMin + yRange * 0.75),
    yMax,
  ];

  const activePoint = hoveredDay
    ? forecast.find((f) => f.day === hoveredDay) || forecast[hoveredDay - 1]
    : null;

  const previewActivePoint = hoveredDay && previewForecast
    ? previewForecast.find((f) => f.day === hoveredDay)
    : null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              30-Day Cash-Flow Trajectory
            </h3>
            {previewOption && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                <Eye className="w-3 h-3 text-purple-400" />
                Previewing: {previewOption.label}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic daily closing balance forecast with protected reserve floor
          </p>
        </div>

        {/* View Toggle & Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-0.5 bg-teal-400 inline-block"></span>
              Current Plan
            </span>
            {previewOption && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-3 h-0.5 bg-purple-400 border-b border-dashed inline-block"></span>
                Proposed Option
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 border-b border-dashed border-amber-400 inline-block"></span>
              ₹{minimumReserve} Reserve Floor
            </span>
          </div>

          <button
            onClick={() => setShowTableView(!showTableView)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-md border border-neutral-700/80 transition-colors"
            title="Toggle Tabular View"
            aria-label="Toggle Tabular View"
          >
            {showTableView ? <ChartIcon className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            <span>{showTableView ? 'Chart View' : 'Table Data'}</span>
          </button>
        </div>
      </div>

      {showTableView ? (
        /* Accessible Tabular Alternative */
        <div className="max-h-72 overflow-y-auto border border-neutral-800 rounded-xl text-xs">
          <table className="w-full text-left font-mono">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] sticky top-0 border-b border-neutral-800">
              <tr>
                <th className="py-2 px-3">Day</th>
                <th className="py-2 px-3 text-right">Inflows</th>
                <th className="py-2 px-3 text-right">Bills Due</th>
                <th className="py-2 px-3 text-right">Living & Savings</th>
                <th className="py-2 px-3 text-right">Closing Balance</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {forecast.map((f) => (
                <tr
                  key={f.day}
                  className={`hover:bg-neutral-800/40 cursor-pointer ${
                    f.day === simulationDay ? 'bg-teal-950/20 font-semibold' : ''
                  }`}
                  onClick={() => onSelectDay?.(f.day)}
                >
                  <td className="py-2 px-3 font-sans">
                    Day {f.day} {f.day === simulationDay ? '(Today)' : ''}
                  </td>
                  <td className="py-2 px-3 text-right text-teal-400 tabular-nums">
                    {f.incomeTotal > 0 ? formatINR(f.incomeTotal) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-red-400 tabular-nums">
                    {f.committedTotal > 0 ? formatINR(f.committedTotal) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-400 tabular-nums">
                    {formatINR(f.discretionaryTotal + f.savingsTotal)}
                  </td>
                  <td className={`py-2 px-3 text-right font-bold tabular-nums ${
                    f.closingBalance < minimumReserve ? 'text-amber-400' : 'text-neutral-100'
                  }`}>
                    {formatINR(f.closingBalance)}
                  </td>
                  <td className="py-2 px-3 text-center font-sans text-[10px]">
                    {f.closingBalance < minimumReserve ? (
                      <span className="text-amber-400 font-semibold">Below Reserve</span>
                    ) : (
                      <span className="text-teal-400">Nominal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive Interactive SVG Area Chart */
        <div className="relative w-full aspect-[800/280] select-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            onMouseLeave={() => setHoveredDay(null)}
          >
            <defs>
              {/* Baseline Area Gradient */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
              </linearGradient>

              {/* Preview Area Gradient */}
              <linearGradient id={previewGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tickVal, i) => {
              const yPos = getY(tickVal);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#262626"
                    strokeDasharray="2,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#737373"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tickVal >= 1000 ? `₹${Math.round(tickVal / 1000)}k` : `₹${tickVal}`}
                  </text>
                </g>
              );
            })}

            {/* Minimum Reserve Reference Line */}
            {reserveY >= padding.top && reserveY <= height - padding.bottom && (
              <g>
                <line
                  x1={padding.left}
                  y1={reserveY}
                  x2={width - padding.right}
                  y2={reserveY}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={width - padding.right + 4}
                  y={reserveY + 3}
                  textAnchor="start"
                  fill="#F59E0B"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Floor ₹{minimumReserve}
                </text>
              </g>
            )}

            {/* Zero balance danger line if visible */}
            {yMin < 0 && (
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="#EF4444"
                strokeWidth="1.5"
              />
            )}

            {/* Current Simulation Day Marker Column */}
            <line
              x1={getX(simulationDay)}
              y1={padding.top}
              x2={getX(simulationDay)}
              y2={height - padding.bottom}
              stroke="#525252"
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* Proposed Scenario Area & Line if Active */}
            {previewAreaPath && (
              <>
                <path d={previewAreaPath} fill={`url(#${previewGradientId})`} />
                <path
                  d={previewLinePath}
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="2"
                  strokeDasharray="5,3"
                />
              </>
            )}

            {/* Baseline Plan Area & Line */}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* First Constraint Breach Marker */}
            {firstBreachDay !== null && (
              <g>
                <circle
                  cx={getX(firstBreachDay)}
                  cy={getY(forecast[firstBreachDay - 1]?.closingBalance || 0)}
                  r="5"
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(firstBreachDay)}
                  cy={getY(forecast[firstBreachDay - 1]?.closingBalance || 0)}
                  r="10"
                  fill="#EF4444"
                  opacity="0.3"
                  className="animate-ping"
                />
              </g>
            )}

            {/* X-Axis Day Labels */}
            {[1, 5, 10, 15, 20, 25, 30].map((d) => (
              <g key={d}>
                <line
                  x1={getX(d)}
                  y1={height - padding.bottom}
                  x2={getX(d)}
                  y2={height - padding.bottom + 4}
                  stroke="#525252"
                  strokeWidth="1"
                />
                <text
                  x={getX(d)}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fill="#A3A3A3"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  D{d}
                </text>
              </g>
            ))}

            {/* Interactive Vertical Hover Bands across all 30 days */}
            {forecast.map((f) => {
              const xPos = getX(f.day);
              const halfBand = chartWidth / 58;

              return (
                <rect
                  key={f.day}
                  x={xPos - halfBand}
                  y={padding.top}
                  width={halfBand * 2}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDay(f.day)}
                  onClick={() => onSelectDay?.(f.day)}
                />
              );
            })}

            {/* Hover Cursor and Point Highlights */}
            {hoveredDay && activePoint && (
              <g pointerEvents="none">
                <line
                  x1={getX(hoveredDay)}
                  y1={padding.top}
                  x2={getX(hoveredDay)}
                  y2={height - padding.bottom}
                  stroke="#14B8A6"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={getX(hoveredDay)}
                  cy={getY(activePoint.closingBalance)}
                  r="5"
                  fill="#14B8A6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                {previewActivePoint && (
                  <circle
                    cx={getX(hoveredDay)}
                    cy={getY(previewActivePoint.closingBalance)}
                    r="4"
                    fill="#C084FC"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredDay && activePoint && (
            <div
              className="absolute z-30 pointer-events-none transform -translate-x-1/2 bg-neutral-950 border border-neutral-700/90 rounded-xl p-3 shadow-xl text-xs w-52 sm:w-60"
              style={{
                left: `${(getX(hoveredDay) / width) * 100}%`,
                top: `${Math.max(10, Math.min(180, getY(activePoint.closingBalance) - 90))}px`,
              }}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800">
                <span className="font-semibold text-white">
                  Day {activePoint.day} {activePoint.day === simulationDay ? '(Current Day)' : ''}
                </span>
                <span className={`font-mono font-bold tabular-nums ${
                  activePoint.closingBalance < minimumReserve ? 'text-amber-400' : 'text-teal-300'
                }`}>
                  {formatINR(activePoint.closingBalance)}
                </span>
              </div>

              {previewActivePoint && (
                <div className="flex justify-between text-[11px] text-purple-300 font-mono pb-1">
                  <span>Proposed Option:</span>
                  <span>{formatINR(previewActivePoint.closingBalance)}</span>
                </div>
              )}

              <div className="space-y-1 text-[11px] text-neutral-400">
                {activePoint.incomeTotal > 0 && (
                  <div className="flex justify-between text-teal-400 font-mono">
                    <span>+ Inflow:</span>
                    <span>{formatINR(activePoint.incomeTotal)}</span>
                  </div>
                )}
                {activePoint.committedTotal > 0 && (
                  <div className="flex justify-between text-red-400 font-mono">
                    <span>- Bills Due:</span>
                    <span>{formatINR(activePoint.committedTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400 font-mono">
                  <span>- Daily Allowance:</span>
                  <span>{formatINR(activePoint.discretionaryTotal + activePoint.savingsTotal)}</span>
                </div>
              </div>

              {activePoint.closingBalance < minimumReserve && (
                <div className="mt-2 pt-1 border-t border-neutral-800 text-[10px] text-amber-300 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Breaches ₹{minimumReserve} reserve</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Axis & Subtitle Footer */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-3 border-t border-neutral-800 mt-2">
        <div className="flex items-center gap-3">
          <span>Horizontal Axis: Day 1 through Day 30</span>
          <span>·</span>
          <span>Vertical Axis: INR Cash Balance</span>
        </div>
        <div>
          <span>Click any day to inspect dated ledger</span>
        </div>
      </div>
    </div>
  );
};
