"use client";

import React from "react";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import type { HospitalEventMedia } from "@/lib/hospital-event/list";

export function useHospitalEventMediaState() {
  const [thumbnailImage, setThumbnailImage] = React.useState<File | null>(null);
  const [eventPageImage, setEventPageImage] = React.useState<File | null>(null);
  const [existingThumbnailImage, setExistingThumbnailImage] = React.useState<HospitalEventMedia | null>(null);
  const [existingEventPageImage, setExistingEventPageImage] = React.useState<HospitalEventMedia | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [isAppPreviewOpen, setIsAppPreviewOpen] = React.useState(false);
  const [uploadWarning, setUploadWarning] = React.useState<string | null>(null);

  const applyExistingMedia = React.useCallback(
    (thumbnail: HospitalEventMedia | null | undefined, eventPage: HospitalEventMedia | null | undefined) => {
      setThumbnailImage(null);
      setEventPageImage(null);
      setExistingThumbnailImage(thumbnail ?? null);
      setExistingEventPageImage(eventPage ?? null);
    },
    [],
  );

  const openAppPreview = React.useCallback(() => {
    setIsAppPreviewOpen(true);
  }, []);

  const closeAppPreview = React.useCallback(() => {
    setIsAppPreviewOpen(false);
  }, []);

  const closePreviewMedia = React.useCallback(() => {
    setPreviewMedia(null);
  }, []);

  const closeUploadWarning = React.useCallback(() => {
    setUploadWarning(null);
  }, []);

  return {
    thumbnailImage,
    setThumbnailImage,
    eventPageImage,
    setEventPageImage,
    existingThumbnailImage,
    existingEventPageImage,
    previewMedia,
    setPreviewMedia,
    isAppPreviewOpen,
    openAppPreview,
    closeAppPreview,
    uploadWarning,
    setUploadWarning,
    closeUploadWarning,
    applyExistingMedia,
    closePreviewMedia,
  };
}
