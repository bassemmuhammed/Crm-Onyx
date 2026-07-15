// ── projectMediaService.js ─────────────────────────────────────────
// P1-3: تخزين ميديا المشاريع في Supabase Storage (مطابقة Flutter)
//
// الـ bucket 'project-media' يجب أن يكون موجوداً في Supabase.
// المسارات (مطابقة Flutter):
//   - صور الـ cover:    covers/cover_{projectId}_{timestamp}.jpg
//   - صور الـ story:    stories/story_{projectId}_{index}_{timestamp}.jpg
//   - صور الـ profile:  profiles/profile_{projectId}_{timestamp}.jpg
//   - الفيديوهات:       videos/video_{projectId}_{timestamp}.{ext}
//
// حدود الحجم (مطابقة Flutter):
//   - صور: 10MB max
//   - فيديو: 100MB max
//   - MIME types المسموحة للصور: image/jpeg, image/png, image/webp
//   - MIME types المسموحة للفيديو: video/mp4, video/webm, video/quicktime

import { supabase } from "./lib/supabase";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// ── Validation ──────────────────────────────────────────────────────
export function validateImageFile(file) {
  if (!file) return { ok: false, error: "No file provided" };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: `Image too large. Max ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }
  return { ok: true };
}

export function validateVideoFile(file) {
  if (!file) return { ok: false, error: "No file provided" };
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { ok: false, error: `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}` };
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return { ok: false, error: `Video too large. Max ${MAX_VIDEO_SIZE / 1024 / 1024}MB` };
  }
  return { ok: true };
}

// ── Upload helpers ──────────────────────────────────────────────────

// رفع صورة cover للـ project
export async function uploadCoverImage(projectId, file) {
  const validation = validateImageFile(file);
  if (!validation.ok) return { ok: false, error: validation.error };

  const ext = file.type.split("/")[1] || "jpg";
  const filePath = `covers/cover_${projectId || "new"}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("project-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("project-media").getPublicUrl(filePath);
  return { ok: true, url: data.publicUrl };
}

// رفع صورة profile للـ project
export async function uploadProfileImage(projectId, file) {
  const validation = validateImageFile(file);
  if (!validation.ok) return { ok: false, error: validation.error };

  const ext = file.type.split("/")[1] || "jpg";
  const filePath = `profiles/profile_${projectId || "new"}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("project-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("project-media").getPublicUrl(filePath);
  return { ok: true, url: data.publicUrl };
}

// رفع صورة story
export async function uploadStoryImage(projectId, index, file) {
  const validation = validateImageFile(file);
  if (!validation.ok) return { ok: false, error: validation.error };

  const ext = file.type.split("/")[1] || "jpg";
  const filePath = `stories/story_${projectId || "new"}_${index}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("project-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("project-media").getPublicUrl(filePath);
  return { ok: true, url: data.publicUrl };
}

// رفع فيديو cover
export async function uploadCoverVideo(projectId, file, onProgress) {
  const validation = validateVideoFile(file);
  if (!validation.ok) return { ok: false, error: validation.error };

  const ext = file.type.split("/")[1] || "mp4";
  const filePath = `videos/video_${projectId || "new"}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("project-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("project-media").getPublicUrl(filePath);
  return { ok: true, url: data.publicUrl };
}

// ── Delete media ────────────────────────────────────────────────────
// يمسح ملف من الـ bucket بمساره الكامل
export async function deleteMediaFile(fileUrl) {
  if (!fileUrl) return { ok: true };
  try {
    // استخراج الـ path من الـ URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/project-media/");
    if (pathParts.length < 2) return { ok: false, error: "Invalid URL" };
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from("project-media")
      .remove([filePath]);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Resize image client-side قبل الرفع (اختياري — لتقليل الحجم) ────
export function resizeImageFile(file, maxSize = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; } }
        else       { if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Failed to resize")),
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
