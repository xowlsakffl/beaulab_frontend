export const STAFF_STATUS_PERMISSIONS = {
  hospital: "beaulab.hospital.status_update",
  hospitalEntry: "beaulab.hospital_entry.status_update",
  user: "beaulab.user.status_update",
  doctor: "beaulab.doctor.status_update",
  expert: "beaulab.expert.status_update",
  video: "beaulab.video.status_update",
  hospitalEvent: "beaulab.hospital_event.status_update",
  hospitalEventAd: "beaulab.hospital_event_ad.status_update",
  hospitalEventDb: "beaulab.hospital_event_db.status_update",
  hospitalEventRealModelDb: "beaulab.hospital_event_real_model_db.status_update",
  hospitalReview: "beaulab.hospital_review.status_update",
  hospitalEvaluation: "beaulab.hospital_evaluation.status_update",
  talk: "beaulab.talk.status_update",
  reportedTalk: "beaulab.reported_talk.status_update",
  reportedHospitalReview: "beaulab.reported_hospital_review.status_update",
  reportedHospitalEvaluation: "beaulab.reported_hospital_evaluation.status_update",
  reportedChatMessage: "beaulab.reported_chat_message.status_update",
  reportedVideo: "beaulab.reported_video.status_update",
  notice: "beaulab.notice.status_update",
  faq: "beaulab.faq.status_update",
  category: "beaulab.category.status_update",
  hashtag: "beaulab.hashtag.status_update",
} as const;

export function reportedContentStatusPermission(targetType: string) {
  switch (targetType) {
    case "talk":
    case "talk_comment":
      return STAFF_STATUS_PERMISSIONS.reportedTalk;
    case "hospital_review":
    case "hospital_review_comment":
      return STAFF_STATUS_PERMISSIONS.reportedHospitalReview;
    case "hospital_evaluation":
      return STAFF_STATUS_PERMISSIONS.reportedHospitalEvaluation;
    case "chat_message":
      return STAFF_STATUS_PERMISSIONS.reportedChatMessage;
    case "hospital_video":
      return STAFF_STATUS_PERMISSIONS.reportedVideo;
    default:
      return "";
  }
}

export function reportedContentKindStatusPermission(kind: string) {
  switch (kind) {
    case "talk":
    case "talk-comment":
      return STAFF_STATUS_PERMISSIONS.reportedTalk;
    case "review":
    case "review-comment":
      return STAFF_STATUS_PERMISSIONS.reportedHospitalReview;
    case "evaluation":
      return STAFF_STATUS_PERMISSIONS.reportedHospitalEvaluation;
    case "chat":
      return STAFF_STATUS_PERMISSIONS.reportedChatMessage;
    default:
      return "";
  }
}
