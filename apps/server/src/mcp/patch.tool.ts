import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const APPLY_PATCH_TOOL: FunctionDeclaration = {
  name: "apply_patch",
  description:
    "Generate a code patch to fix the user's error. Use this when you are confident in the solution.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      explanation: {
        type: SchemaType.STRING,
        description:
          "A brief, one-sentence explanation of what this patch fixes.",
      },
      codeBlock: {
        type: SchemaType.STRING,
        description: "The complete, corrected code content for the file.",
      },
      targetFile: {
        type: SchemaType.STRING,
        description:
          "The relative path of the file to modify (e.g., src/App.jsx).",
      },
      action: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["REPLACE_FILE"],
        description: "Currently only supports replacing the full file content.",
      },
    },
    required: ["codeBlock", "targetFile", "action", "explanation"],
  },
};
