import { useEffect, useState } from "react";

export default function useTheme(isDay: 1 | 0) {
    const [theme, setTheme] = useState<"light" | "dark">(isDay === 1 ? "light" : "dark");

    useEffect(() => {
        if (isDay === 1) {
            setTheme("light");
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
        } else {
            setTheme("dark");
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        }
    }, [isDay]);

    return theme;
}