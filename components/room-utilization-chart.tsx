"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoomUtilizationData {
  roomId: number;
  roomName: string;
  building: string;
  capacity: number;
  type: string;
  assignedSlots: number;
  totalSlots: number;
  utilizationRate: number;
}

interface RoomUtilizationChartProps {
  data: RoomUtilizationData[];
}

export default function RoomUtilizationChart({ data }: RoomUtilizationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No room utilization data available
      </div>
    );
  }

  // Sort by utilization rate descending
  const sortedData = [...data].sort((a, b) => b.utilizationRate - a.utilizationRate);

  // Format data for chart
  const chartData = sortedData.map(room => ({
    name: room.roomName,
    utilization: room.utilizationRate,
    assigned: room.assignedSlots,
    total: room.totalSlots,
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
            label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-gray-600">
                      Utilization: {data.utilization.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Assigned: {data.assigned} / {data.total} slots
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar 
            dataKey="utilization" 
            fill="#9333ea" 
            name="Utilization (%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
