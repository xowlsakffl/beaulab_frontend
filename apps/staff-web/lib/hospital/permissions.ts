export const HOSPITAL_PERMISSIONS = {
  update: "beaulab.hospital.update",
} as const;

export const HOSPITAL_STATUS_PERMISSIONS = {
  update: "beaulab.hospital.status_update",
  requestShow: "beaulab.hospital_status_request.show",
  requestCreate: "beaulab.hospital_status_request.create",
  requestProcess: "beaulab.hospital_status_request.process",
} as const;
