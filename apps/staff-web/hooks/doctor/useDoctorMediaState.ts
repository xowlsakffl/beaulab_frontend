"use client";

import React from "react";
import type { ExistingMediaItem } from "@beaulab/ui-admin";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { type DoctorFieldName, validateDoctorProfileImageFile } from "@/lib/doctor/form";

type UseDoctorMediaStateParams = {
  clearError: (field: DoctorFieldName) => void;
};

export function useDoctorMediaState({ clearError }: UseDoctorMediaStateParams) {
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [licenseImage, setLicenseImage] = React.useState<File | null>(null);
  const [specialistCertificateImage, setSpecialistCertificateImage] = React.useState<File | null>(null);
  const [existingProfileImage, setExistingProfileImage] = React.useState<ExistingMediaItem | null>(null);
  const [existingLicenseImage, setExistingLicenseImage] = React.useState<ExistingMediaItem | null>(null);
  const [existingSpecialistCertificateImage, setExistingSpecialistCertificateImage] =
    React.useState<ExistingMediaItem | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [uploadModalMessage, setUploadModalMessage] = React.useState<string | null>(null);

  const handleProfileImageChange = React.useCallback(
    async (file: File | null) => {
      if (file) {
        const validationMessage = await validateDoctorProfileImageFile(file);
        if (validationMessage) {
          setUploadModalMessage(validationMessage);
          return;
        }
      }

      setProfileImage(file);
      clearError("profile_image");
    },
    [clearError],
  );

  const handleLicenseImageChange = React.useCallback(
    (file: File | null) => {
      setLicenseImage(file);
      clearError("license_image");
    },
    [clearError],
  );

  const handleExistingLicenseImageChange = React.useCallback(
    (file: ExistingMediaItem | null) => {
      setExistingLicenseImage(file);
      clearError("license_image");
    },
    [clearError],
  );

  const handleSpecialistCertificateImageChange = React.useCallback(
    (file: File | null) => {
      setSpecialistCertificateImage(file);
      clearError("specialist_certificate_image");
    },
    [clearError],
  );

  const handleExistingSpecialistCertificateImageChange = React.useCallback(
    (file: ExistingMediaItem | null) => {
      setExistingSpecialistCertificateImage(file);
      clearError("specialist_certificate_image");
    },
    [clearError],
  );

  const closeUploadModal = React.useCallback(() => {
    setUploadModalMessage(null);
  }, []);

  return {
    profileImage,
    setProfileImage,
    licenseImage,
    setLicenseImage,
    specialistCertificateImage,
    setSpecialistCertificateImage,
    existingProfileImage,
    setExistingProfileImage,
    existingLicenseImage,
    setExistingLicenseImage,
    existingSpecialistCertificateImage,
    setExistingSpecialistCertificateImage,
    previewMedia,
    setPreviewMedia,
    uploadModalMessage,
    closeUploadModal,
    handleProfileImageChange,
    handleLicenseImageChange,
    handleExistingLicenseImageChange,
    handleSpecialistCertificateImageChange,
    handleExistingSpecialistCertificateImageChange,
  };
}
