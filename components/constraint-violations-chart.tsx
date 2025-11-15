"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ViolationData {
  type: string;
  count: number;
}

interface ConstraintViolationsChartProps {
  violations: ViolationData[];
  fitnessScore?: number | null;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'];

export default function ConstraintViolationsChart({ violations, fitnessScore }: ConstraintViolationsChartProps) {
  if (violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-semibold text-green-600 mb-2">No Violations!</p>
        <p className="text-sm">This timetable has no soft constraint violations</p>
        {fitnessScore !== null && fitnessScore !== undefined && (
          <p className="text-sm mt-2">Fitness Score: {fitnessScore.toFixed(2)}</p>
        )}
      </div>
    );
  }

  // Format data for chart
  const chartData = violations.map(v => ({
    name: v.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: v.count,
  }));

  const totalViolations = violations.reduce((sum, v) => sum + v.count, 0);

  return (
    <div className="w-full">
      {fitnessScore !== null && fitnessScore !== undefined && (
        <div className="mb-4 text-center">
          <div className="text-sm text-gray-600">Fitness Score</div>
          <div className="text-3xl font-bold text-blue-600">{fitnessScore.toFixed(2)}</div>
        </div>
      )}
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-gray-600">
                        Count: {data.value}
                      </p>
                      <p className="text-sm text-gray-600">
                        Percentage: {((data.value as number / totalViolations) * 100).toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Total Violations: {totalViolations}
      </div>
    </div>
  );
}
