import { useCallback, useEffect, useRef, useState } from "react";

export function useCountryCodePicker({ onEnter } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tagName = target.tagName;
      return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
    };

    const handleClickOutside = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleKeyDown = (event) => {
      const target = event.target;
      const isInsidePicker = pickerRef.current?.contains(target) ?? false;

      // Let users keep typing normally in other form fields while the picker is open.
      if (!isInsidePicker && isEditableTarget(target)) {
        return;
      }

      // Only capture letter and number keys, not special keys
      if (event.key.length === 1 && /[a-zA-Z0-9\+]/.test(event.key)) {
        event.preventDefault();
        setSearchQuery((prev) => prev + event.key.toLowerCase());

        // Clear search query after 1 second of no typing
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
          setSearchQuery("");
        }, 1000);
      } else if (event.key === "Enter") {
        if (typeof onEnter === "function") {
          event.preventDefault();
          onEnter(searchQuery);
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(searchTimeoutRef.current);
    };
  }, [isOpen, onEnter, searchQuery]);

  const closePicker = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  return {
    isOpen,
    setIsOpen,
    pickerRef,
    searchQuery,
    setSearchQuery,
    openPicker: () => setIsOpen(true),
    closePicker,
    togglePicker: () => setIsOpen((prev) => !prev),
  };
}
