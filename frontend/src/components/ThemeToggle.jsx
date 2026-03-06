import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/themeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="ui-icon-btn"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-warning" />
            ) : (
                <Moon className="w-5 h-5 text-ink" />
            )}
        </button>
    );
};

export default ThemeToggle;
