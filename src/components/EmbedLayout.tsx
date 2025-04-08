import React, { ReactNode } from "react";
import { EmbedOptions } from "../hooks/useQueryParams";

interface EmbedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  score?: number;
  maxScore?: number;
  options: EmbedOptions;
  className?: string;
}

const EmbedLayout: React.FC<EmbedLayoutProps> = ({ children, title, description, score, maxScore, options, className }) => {
  const themeStyles = options.theme === "light" ? "bg-white text-gray-900" : "bg-black text-indigo-200";

  return (
    <div className={`min-h-screen ${themeStyles} ${className || ""}`}>
      <main className="w-full">
        {options.showAssignment && title && (
          <div className={`px-4 py-1 ${options.theme === "light" ? "bg-gray-100/60" : "bg-black/60"}`}>
            <h2 className={`my-2 text-2xl font-bold ${options.theme === "light" ? "text-orange-600" : "text-yellow-400"}`}>
              {options.isScored && score === maxScore && "✅ "}
              {title}
              {options.isScored && maxScore !== undefined && (
                <span className="ml-2 text-xl font-normal">
                  ({score ?? 0} / {maxScore})
                </span>
              )}
            </h2>
            {description && <p className="mb-4" dangerouslySetInnerHTML={{ __html: description }} />}
          </div>
        )}
        {children}
      </main>
      <style>
        {`
          :root {
            color-scheme: ${options.theme === "light" ? "light" : "dark"} !important;
          }
        `}
      </style>
    </div>
  );
};

export default EmbedLayout;
