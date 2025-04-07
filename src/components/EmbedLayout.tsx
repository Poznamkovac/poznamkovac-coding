import React, { ReactNode } from "react";
import { EmbedOptions } from "../hooks/useQueryParams";

interface EmbedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  score?: number;
  maxScore?: number;
  options: EmbedOptions;
}

const EmbedLayout: React.FC<EmbedLayoutProps> = ({ children, title, description, score, maxScore, options }) => {
  return (
    <div className="min-h-screen text-white bg-gray-900">
      <main className="container p-4 mx-auto">
        {options.showAssignment && title && (
          <div className="mb-4">
            <h2 className="my-2 text-2xl font-bold">
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
    </div>
  );
};

export default EmbedLayout;
