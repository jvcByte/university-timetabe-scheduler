"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface InstructorLoadData {
  instructorId: number;
  instructorName: string;
  department: string;
  teachingLoad: number;
  assignedHours: number;
  loadPercentage: number;
  assignmentCount: number;
}

interface InstructorLoadChartProps {
  data: InstructorLoadData[];
}

export default function InstructorLoadChart({ data }: InstructorLoadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No instructor load data available
      </div>
    );
  }

  // Sort by load percentage descending
  const sortedData = [...data].sort((a, b) => b.loadPercentage - a.loadPercentage);

  // Format data for chart
  const chartData = sortedData.map(instructor => ({
    name: instructor.instructorName,
    loadPercentage: instructor.loadPercentage,
    assignedHours: instructor.assignedHours,
    maxLoad: instructor.teachingLoad,
    department: instructor.department,
  }));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Load (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-gray-600">
                      Department: {data.department}
                    </p>
                    <p className="text-sm text-gray-600">
                      Load: {data.loadPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Assigned: {data.assignedHours}h / {data.maxLoad}h
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <ReferenceLine 
            y={100} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            label={{ value: 'Max Load', position: 'right' }}
          />
          <Bar 
            dataKey="loadPercentage" 
            fill="#22c55e" 
            name="Load (%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
