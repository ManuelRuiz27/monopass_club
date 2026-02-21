import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export const LiveTicker = () => {
    const [count, setCount] = useState(1420);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev + Math.floor(Math.random() * 3));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="live-ticker">
            <div className="live-ticker__content">
                <span className="live-ticker__item">
                    <Activity size={14} color="var(--acid)" />
                    <strong>LIVE:</strong> {count.toLocaleString()} accesos hoy
                </span>
                <span className="live-ticker__separator">•</span>
                <span className="live-ticker__item">
                    <ShieldCheck size={14} color="var(--acid)" />
                    Cero fugas detectadas
                </span>
                <span className="live-ticker__separator">•</span>
                <span className="live-ticker__item">
                    <Zap size={14} color="var(--acid)" />
                    Tiempo prom. validación: 0.8s
                </span>
            </div>
        </div>
    );
};
