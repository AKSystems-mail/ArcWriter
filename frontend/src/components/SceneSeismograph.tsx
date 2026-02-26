import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertTriangle } from 'lucide-react';

interface SceneSeismographProps {
    tensionPeaks?: (number | string)[];
    tensionCurve?: number[]; // New: line-by-line values
    totalLines?: number;
}

interface Milestone {
    index?: number;
    page?: number;
    label: string;
    description?: string;
}

interface SceneSeismographProps {
    tensionCurve?: number[];
    milestones?: Milestone[];
    labelType?: 'Line' | 'Page';
}

const SceneSeismograph: React.FC<SceneSeismographProps> = ({ tensionCurve = [], milestones = [], labelType = 'Line' }) => {
    const data = useMemo(() => {
        if (!tensionCurve || tensionCurve.length === 0) {
            return Array.from({ length: 10 }, (_, i) => ({
                x: i,
                tension: 50
            }));
        }

        return tensionCurve.map((val, idx) => {
            const milestone = milestones.find(m => (m.index === idx || m.page === (idx + 1)));
            return {
                x: idx,
                tension: val * 10,
                label: milestone?.label || null,
                desc: milestone?.description || null
            };
        });
    }, [tensionCurve, milestones]);

    const isFlatline = !tensionCurve || tensionCurve.length === 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="bg-black border border-white/10 p-4 shadow-2xl rounded-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{labelType} {point.x + (labelType === 'Page' ? 1 : 0)}</span>
                        <div className="h-px w-4 bg-gray-800" />
                        <span className="text-[10px] font-black text-arc-teal tracking-widest">{Math.round(payload[0].value)}% TENSION</span>
                    </div>
                    {point.label && (
                        <div className="mt-3 animate-fade-in">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight mb-1">{point.label}</p>
                            {point.desc && <p className="text-[10px] text-gray-500 font-light italic leading-relaxed">{point.desc}</p>}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-black border border-white/5 p-6 shadow-inner relative group">
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis dataKey="x" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(45, 212, 191, 0.1)', strokeWidth: 20 }} />
                        <Line
                            type="monotone"
                            dataKey="tension"
                            stroke="#2DD4BF"
                            strokeWidth={2}
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                if (payload.label) {
                                    return (
                                        <g key={`dot-${payload.x}`}>
                                            <circle cx={cx} cy={cy} r={4} fill="#2DD4BF" className="animate-pulse" />
                                            <circle cx={cx} cy={cy} r={8} stroke="#2DD4BF" strokeWidth={1} fill="transparent" opacity={0.3} />
                                        </g>
                                    );
                                }
                                return null;
                            }}
                            activeDot={{ r: 6, fill: '#fff', stroke: '#2DD4BF', strokeWidth: 2 }}
                        />
                        {/* Milestone Indicators */}
                        {data.filter(d => d.label).map((m, i) => (
                            <ReferenceLine key={i} x={m.x} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-arc-teal opacity-50" />
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em] italic">Atmospheric Analysis Active</span>
                </div>
                <div className="flex gap-4 text-[8px] font-black text-gray-800 uppercase tracking-widest">
                    <span>{labelType === 'Line' ? 'Start' : 'Page 01'}</span>
                    <div className="w-8 h-px bg-gray-900 self-center" />
                    <span>{labelType === 'Line' ? 'End' : 'Page 10'}</span>
                </div>
            </div>
        </div>
    );
};

export default SceneSeismograph;
