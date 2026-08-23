import { useEffect } from "react";

// Cada vez que un modal se abre, empuja una entrada al historial del
// navegador. Si el usuario presiona "Atrás", en vez de salir de la app,
// se ejecuta onClose() y se consume esa entrada del historial.
export const useBackButtonClose = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modalOpen: true }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
};
