export type ActorType = "staff" | "hospital" | "beauty" | "user";

/** 공통 Authorization(UX 제어용) */
export type ActorAuthorization = {
    roles: string[];
    permissions: string[];
    scope?: string; // 선택: ALL, OWN_HOSPITAL 등
};

/** 공통 Session 베이스 */
export type ActorSession<TActor extends ActorType, TProfile> = {
    actor: TActor;
    profile: TProfile;
    auth?: Partial<ActorAuthorization>;
};

/** Staff 프로필(최소) */
export type StaffProfile = {
    id: number | string;
    name: string;
    email?: string;
    nickname?: string;
    department?: string | null;
    job_title?: string | null;
    status?: string;
    last_login_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

/** Hospital 프로필(백엔드 DTO 기준) */
export type HospitalProfile = {
    id: number | string;
    name: string;
    email?: string;
    nickname?: string;
    status?: string;
    hospital_id?: number | string | null;
    last_login_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

/** Beauty 프로필(백엔드 DTO 기준) */
export type BeautyProfile = {
    id: number | string;
    name: string;
    email?: string;
    nickname?: string;
    status?: string;
    beauty_id?: number | string | null;
    last_login_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

/** User 프로필(최소) */
export type UserProfile = {
    id: number | string;
    name?: string;
    email?: string;
    nickname?: string;
};

/** Actor별 세션 타입 */
export type StaffSession = ActorSession<"staff", StaffProfile>;
export type HospitalSession = ActorSession<"hospital", HospitalProfile>;
export type BeautySession = ActorSession<"beauty", BeautyProfile>;
export type UserSession = ActorSession<"user", UserProfile>;

export type ActorSessionMap = {
    staff: StaffSession;
    hospital: HospitalSession;
    beauty: BeautySession;
    user: UserSession;
};

export type AnyActorSession = ActorSessionMap[ActorType];
