import { filesApi } from "@/src/api/services";

export interface UploadedSignature {
  signatureImageUrl: string;
  previewUrl: string;
  assetId: string;
}

export async function uploadSignatureDataUrl(dataUrl: string) {
  const fileName = `signature-${Date.now()}.png`;
  const contentType = "image/png";

  const presigned = await filesApi.presignUpload({
    fileName,
    contentType,
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await filesApi.uploadToPresignedUrl(presigned.uploadUrl, blob, presigned.headers);

  const asset = await filesApi.createAsset({
    key: presigned.key,
    fileName,
    contentType,
    sizeBytes: blob.size,
  });

  const download = await filesApi.presignDownload(asset.assetId);

  return {
    signatureImageUrl: asset.url ?? presigned.key,
    previewUrl: download.downloadUrl,
    assetId: asset.assetId,
  } satisfies UploadedSignature;
}
