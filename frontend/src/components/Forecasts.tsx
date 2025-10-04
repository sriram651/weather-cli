import React from 'react';
import ForecastCard from './ForecastCard';
import { DailyForecastResp } from '@/types/responses';

export function ForecastGrid({ data, unit = 'C' }: { data: DailyForecastResp; unit?: 'C' | 'F' }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {data.forecast.map((day, index) => (
                <ForecastCard key={index} forecast={day} unit={unit} />
            ))}
        </div>
    );
}
