import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertTriangle } from 'lucide-react';

interface SceneSeismographProps {
    tensionPeaks?: (number | string)[];
    totalLines?: number;
}

const SceneSeismograph: React.FC<SceneSeismographProps> = ({ tensionPeaks = [], totalLines = 50 }) => {
    // Process data: transform tensionPeaks (list of line numbers) into graph data
    const data = useMemo(() => {
        // If no peaks, return flatline
        if (!tensionPeaks || tensionPeaks.length === 0) {
            return Array.from({ length: 10 }, (_, i) => ({
                line: i * (totalLines / 10),
                tension: 50 // Flatline
            }));
        }

        // Create data points
        // We'll create a point for every peak, and some intermediate points
        let points = [];

        // Sort peaks just in case
        // We need to parse them first to sort numbers
        const parsedPeaks = tensionPeaks.map(p => {
            if (typeof p === 'number') return p;
            const match = String(p).match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        }).sort((a, b) => a - b);

        // Generate a baseline curve with spikes at peaks
        const numPoints = 20;
        const step = totalLines / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const lineNum = Math.floor(i * step);
            let tension = 30 + Math.random() * 20; // Base tension noise

            // Check proximity to a peak
            // If close to a peak, spike tension
            for (let peakLine of parsedPeaks) {
                if (Math.abs(lineNum - peakLine) < (totalLines / 10)) {
                    tension = 80 + Math.random() * 15; // Spike
                }
            }

            points.push({
                line: lineNum,
                tension: Math.min(100, Math.max(0, tension))
            });
        }

        return points;
    }, [tensionPeaks, totalLines]);

    const isFlatline = !tensionPeaks || tensionPeaks.length === 0;

    return (
        <div className="w-full bg-gray-900/50 rounded-xl p-4 border border-gray-700 mt-4">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="text-arc-teal w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Emotional Graph</h3>
            </div>

            <div className="h-40 w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis
                            dataKey="line"
                            hide
                            domain={[0, 'dataMax']}
                        />
                        <YAxis
                            hide
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6', fontSize: '12px' }}
                            itemStyle={{ color: '#F3F4F6' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: number | undefined) => [value !== undefined ? `${Math.round(value)}%` : '', 'Tension']}
                        />
                        <Line
                            type="monotone"
                            dataKey="tension"
                            stroke={isFlatline ? "#EF4444" : "#2DD4BF"} // Red if flat, Teal if good
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#fff' }}
                        />
                        {isFlatline && (
                            <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {isFlatline && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-red-200 font-bold">Flatline Detected: No Push/Pull found. Consider shifting the power dynamic.</p>
                    </div>
                </div>
            )}

            {!isFlatline && (
                <div className="flex justify-between text-[10px] text-gray-500 px-1">
                    <span>Start</span>
                    <span>End</span>
                </div>
            )}
        </div>
    );
};

export default SceneSeismograph;
