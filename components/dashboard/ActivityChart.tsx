'use client'

import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts'

export type ActivityChartData = { label: string; total: number; approved: number; pending: number; rejected: number }[]

export default function ActivityChart({ data }: { data: ActivityChartData }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={32} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          labelStyle={{ fontWeight: 600, color: '#0f172a' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="total" stroke="#475569" strokeWidth={2} dot={{ fill: '#475569', r: 3 }} name="Total" />
        <Line type="monotone" dataKey="approved" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} name="Approved" />
        <Line type="monotone" dataKey="pending" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 3 }} name="Pending" />
        <Line type="monotone" dataKey="rejected" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 3 }} name="Rejected" />
      </LineChart>
    </ResponsiveContainer>
  )
}
