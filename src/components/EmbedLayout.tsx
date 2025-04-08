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
  return (
    <div className={`min-h-screen text-indigo-300 ${className || ""}`}>
      <main className="w-full">
        {options.showAssignment && title && (
          <div className="px-4 py-1 mb-4 rounded-lg bg-black/60">
            <h2 className="my-2 text-2xl font-bold text-yellow-500">
              {options.isScored && score === maxScore && "✅ "}
              {title}
              {options.isScored && maxScore !== undefined && (
                <span className="ml-2 text-xl font-normal">
                  (Score: {score ?? 0} / {maxScore})
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
            color-scheme: unset !important;
          }
        `}
      </style>
    </div>
  );
};

export default EmbedLayout;
