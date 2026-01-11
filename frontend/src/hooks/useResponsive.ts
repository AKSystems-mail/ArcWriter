import { useState, useEffect } from 'react';

interface ResponsiveState {
    isMobile: boolean;
    width: number;
}

const MOBILE_BREAKPOINT = 768;

export const useResponsive = (): ResponsiveState => {
    const [state, setState] = useState<ResponsiveState>(() => {
        if (typeof window !== 'undefined') {
            return {
                isMobile: window.innerWidth < MOBILE_BREAKPOINT,
                width: window.innerWidth,
            };
        }
        return {
            isMobile: false,
            width: 1024,
        };
    });

    useEffect(() => {
        const handleResize = () => {
            setState({
                isMobile: window.innerWidth < MOBILE_BREAKPOINT,
                width: window.innerWidth,
            });
        };

        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return state;
};
