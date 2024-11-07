// src/hooks/usePreventRightClick.ts
import { useEffect } from 'react';

const usePreventRightClick = () => {
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};

export default usePreventRightClick;
