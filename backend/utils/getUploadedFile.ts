import { Files, File } from "formidable";

function getUploadedFile(files: Files<string>): File | undefined {
  const uploaded = Object.values(files)[0];

  return Array.isArray(uploaded) ? uploaded[0] : uploaded;
}

export default getUploadedFile;