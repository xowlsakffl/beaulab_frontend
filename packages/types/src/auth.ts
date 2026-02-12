export type ActorType = "staff" | "partner" | "user";

/** 공통 Authorization(UX 제어용) */
export type ActorAuthorization = {
    roles: string[];
    permissions: string[];
    scope?: string; // 선택: ALL, OWN_HOSPITAL 등
};

/** 공통 Session 베이스 */
export type ActorSession<TProfile> = {
    actor: ActorType;
    profile: TProfile;
    auth?: Partial<ActorAuthorization>;
};

/** Staff 프로필(최소) */
export type StaffProfile = {
    id: number | string;
    name: string;
    email?: string;
    nickname?: string;
    status?: string;
    last_login_at?: string | null;
};

/** Partner 프로필(최소) */
export type PartnerProfile = {
    id: number | string;
    name: string;
    email?: string;

    partner_type?: "HOSPITAL" | "BEAUTY" | "AGENCY";
    hospital_id?: number | string | null;
    beauty_id?: number | string | null;
};

/** User 프로필(최소) */
export type UserProfile = {
    id: number | string;
    name?: string;
    email?: string;
    nickname?: string;
};

/** Actor별 세션 타입 */
export type StaffSession = ActorSession<StaffProfile>;
export type PartnerSession = ActorSession<PartnerProfile>;
export type UserSession = ActorSession<UserProfile>;
