import fs from "fs";
import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    return await extractTextFromPDFBuffer(dataBuffer);
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to read PDF file.");
  }
};

export const extractTextFromPDFBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF Buffer:", error);
    throw new Error("Failed to read PDF buffer.");
  }
};
