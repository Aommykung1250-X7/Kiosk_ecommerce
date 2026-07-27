import React from "react";

/**
 * KioskLayout wraps pages that are designed for the 681*1209 mm vertical Kiosk display screen.
 * - On vertical / portrait displays (such as physical 681*1209 mm kiosk screens), it fills 100% of the screen.
 * - On landscape / desktop displays, it frames and centers the 681:1209 portrait kiosk view cleanly.
 *
 * Pages EXCEPTED from this layout (Login and Dashboard Orders) render as standard full-window web pages.
 */
export default function KioskLayout({ children }) {
  return (
    <div className="w-full h-full min-h-screen bg-[#121214] flex items-center justify-center overflow-hidden font-['Prompt'] select-none">
      {/* 681mm * 1209mm Aspect Ratio Portrait Kiosk Viewport */}
      <div 
        className="relative w-full h-full max-h-screen 
                   portrait:w-full portrait:h-full portrait:max-w-none 
                   landscape:h-full landscape:aspect-[681/1209] landscape:max-w-[calc(100vh*681/1209)] 
                   bg-[#F8F8F8] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden 
                   border-0 sm:landscape:border sm:landscape:border-gray-800/60"
      >
        {children}
      </div>
    </div>
  );
}
