import api from "./client";

export interface UploadResponse {
  url: string;
  filename: string;
  stored_as: string;
  uploaded_at: string;
}

export const UploadsApi = {
  file: (file: { uri: string; name: string; type?: string }) => api.upload<UploadResponse>("/uploads_api/file", file),
};

export default UploadsApi;
