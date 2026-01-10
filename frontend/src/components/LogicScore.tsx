import React from 'react';

interface LogicScoreProps {
    score: number | null; // Score from 0 to 100, or null if no score yet
}

const LogicScore: React.FC<LogicScoreProps> = ({ score }) => {
    if (score === null) {
        return (
            <div className="flex flex-col items-center justify-center p-4">
                <p className="text-gray-400">Score N/A</p>
                <p className="text-sm text-gray-500 mt-1">Stakes Meter</p>
            </div>
        );
    }

    const clampedScore = Math.max(0, Math.min(100, score));

    let colorClass = 'text-gray-400'; // Default color
    if (clampedScore >= 80) {
        colorClass = 'text-green-500';
    } else if (clampedScore >= 50) {
        colorClass = 'text-yellow-500';
    } else {
        colorClass = 'text-red-500';
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className={`text-4xl font-bold ${colorClass}`}>
                {clampedScore}
            </div>
            <p className="text-sm text-gray-400 mt-1">Stakes Meter</p>
        </div>
    );
};

export default LogicScore;