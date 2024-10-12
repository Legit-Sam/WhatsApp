import { useState, useEffect, useRef } from "react";

interface ComponentVisibleHook {
	ref: React.RefObject<HTMLDivElement>; // Replace 'any' with a specific HTML element type
	isComponentVisible: boolean;
	setIsComponentVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function useComponentVisible(initialIsVisible: boolean): ComponentVisibleHook {
	const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
	const ref = useRef<HTMLDivElement>(null); // Replace 'any' with a specific HTML element type

	const handleClickOutside = (event: MouseEvent) => {
		// Use 'Node' type for 'event.target' and refine the check
		if (ref.current && !ref.current.contains(event.target as Node)) {
			setIsComponentVisible(false);
		}
	};

	useEffect(() => {
		document.addEventListener("click", handleClickOutside, true);
		return () => {
			document.removeEventListener("click", handleClickOutside, true);
		};
	}, []);

	return { ref, isComponentVisible, setIsComponentVisible };
}
