import { AccessTokenSuccess } from "../../api/models/auth-models";

export interface StoredAccessToken {
    data: AccessTokenSuccess,
    expiry_date: Date
}