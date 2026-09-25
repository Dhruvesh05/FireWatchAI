"use client";

import React, { useState } from "react";
import { Home, Search, Heart, Bell, ShoppingCart } from "lucide-react";

export interface NeumorphicNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  cartCount?: number;
}

export default function NeumorphicNavbar({
  activeTab: externalActiveTab,
  onTabChange,
  cartCount = 3,
}: NeumorphicNavbarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("home");
  const activeTab = externalActiveTab ?? internalActiveTab;

  const handleSelect = (id: string) => {
    setInternalActiveTab(id);
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-6 bg-[#e0e5ec] dark:bg-[#18191c] transition-colors duration-300 rounded-3xl my-6">
      <div className="flex items-center gap-4 sm:gap-6 max-w-full overflow-x-auto p-4">
        {/* Main Elongated Neumorphic Pill Navigation Bar Container */}
        <nav className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#e0e5ec] dark:bg-[#18191c] border border-zinc-300/60 dark:border-zinc-800/80 transition-all duration-300">
          {/* 1. Home Icon (Active Element - Inset dual box-shadow carved into surface) */}
          <button
            onClick={() => handleSelect("home")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300 font-sans text-sm font-semibold cursor-pointer ${
              activeTab === "home"
                ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_6px_6px_10px_#c8cdd4,inset_-6px_-6px_10px_#ffffff] dark:shadow-[inset_6px_6px_10px_#101114,inset_-6px_-6px_10px_#202124]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
            }`}
          >
            <Home className="w-5 h-5 fill-current stroke-current stroke-1" />
            {activeTab === "home" && <span>Home</span>}
          </button>

          {/* 2. Search Icon */}
          <button
            onClick={() => handleSelect("search")}
            className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "search"
                ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_6px_6px_10px_#c8cdd4,inset_-6px_-6px_10px_#ffffff] dark:shadow-[inset_6px_6px_10px_#101114,inset_-6px_-6px_10px_#202124]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
            }`}
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          {/* 3. Favorite Icon (Heart) */}
          <button
            onClick={() => handleSelect("favorite")}
            className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "favorite"
                ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_6px_6px_10px_#c8cdd4,inset_-6px_-6px_10px_#ffffff] dark:shadow-[inset_6px_6px_10px_#101114,inset_-6px_-6px_10px_#202124]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
            }`}
            aria-label="Favorites"
          >
            <Heart className="w-5 h-5 stroke-[2]" />
          </button>

          {/* 4. Notification Icon (Bell) */}
          <button
            onClick={() => handleSelect("notification")}
            className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "notification"
                ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_6px_6px_10px_#c8cdd4,inset_-6px_-6px_10px_#ffffff] dark:shadow-[inset_6px_6px_10px_#101114,inset_-6px_-6px_10px_#202124]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
          </button>
        </nav>

        {/* Separate Floating Circular Neumorphic Button with Shopping Cart & Badge */}
        <div className="relative p-2">
          <button
            className="w-13 h-13 rounded-full bg-[#e0e5ec] dark:bg-[#18191c] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-all duration-300 shadow-[8px_8px_16px_#c8cdd4,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#101114,-8px_-8px_16px_#202124] active:shadow-[inset_6px_6px_10px_#c8cdd4,inset_-6px_-6px_10px_#ffffff] dark:active:shadow-[inset_6px_6px_10px_#101114,inset_-6px_-6px_10px_#202124] cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
          </button>

          {cartCount > 0 && (
            <span className="absolute top-0 right-0 w-5.5 h-5.5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-[#e0e5ec] dark:border-[#18191c] shadow-sm">
              {cartCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
