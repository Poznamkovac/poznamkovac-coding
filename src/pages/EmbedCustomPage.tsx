import React, { useEffect, useState } from "react";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import EmbedLayout from "../components/EmbedLayout";
import { useQueryParams } from "../hooks/useQueryParams";
import { createVirtualFileSystem } from "../services/virtualFileSystemService";
import { ChallengeData, VirtualFileSystem } from "../types/challenge";

const EmbedCustomPage: React.FC = () => {
  const { options, customData } = useQueryParams();
  const [fileSystem, setFileSystem] = useState<VirtualFileSystem | null>(null);
  const [assignmentData, setAssignmentData] = useState<ChallengeData | null>(null);

  // Process custom assignment data from URL parameter
  useEffect(() => {
    if (!customData) {
      console.error("No custom data provided");
      return;
    }

    try {
      // Create default challenge data structure
      const defaultData: ChallengeData = {
        title: "Custom Assignment",
        assignment: "Custom assignment loaded from URL",
        maxScore: 0,
        previewType: "html",
        mainFile: "index.html",
        files: [],
      };

      // Merge with custom data
      const assignmentData: ChallengeData = {
        ...defaultData,
        ...customData,
      };

      // Ensure all required fields are present
      if (!assignmentData.previewType) assignmentData.previewType = "html";
      if (!assignmentData.files || !Array.isArray(assignmentData.files) || assignmentData.files.length === 0) {
        // Create default files if none provided
        assignmentData.files = [
          {
            filename: "index.html",
            content: "<html><body><h1>Custom Assignment</h1></body></html>",
            readonly: false,
            hidden: false,
            autoreload: true,
          },
        ];
      }

      // Set main file if not specified
      if (!assignmentData.mainFile) {
        assignmentData.mainFile = assignmentData.files.find((f) => f.filename === "index.html")
          ? "index.html"
          : assignmentData.files[0].filename;
      }

      // Create file system
      const fs = createVirtualFileSystem("custom", "embed", assignmentData.files);

      setAssignmentData(assignmentData);
      setFileSystem(fs);
    } catch (error) {
      console.error("Error processing custom data:", error);
    }
  }, [customData]);

  if (!fileSystem || !assignmentData) {
    return (
      <div className="min-h-screen text-white bg-gray-900">
        <div className="container p-4 mx-auto">
          <h2 className="text-xl font-bold">Error Loading Custom Assignment</h2>
          <p>
            No valid assignment data was provided. Make sure the URL contains a valid base64-encoded JSON object in the "data"
            parameter.
          </p>
          <p className="mt-4">
            <a href="#/embed/create" className="text-blue-400 underline">
              Create a custom assignment
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmbedLayout title={assignmentData.title} description={assignmentData.assignment} options={options}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.showEditors && (
          <div className="flex flex-col h-[500px]">
            <ChallengeIDE fileSystem={fileSystem} />
          </div>
        )}

        <div className={`h-[500px] flex flex-col ${!options.showEditors ? "md:col-span-2" : ""}`}>
          <ChallengePreview
            fileSystem={fileSystem}
            mainFile={assignmentData.mainFile}
            previewType={assignmentData.previewType}
            autoReload={options.autoReload}
          />
        </div>
      </div>
    </EmbedLayout>
  );
};

export default EmbedCustomPage;
