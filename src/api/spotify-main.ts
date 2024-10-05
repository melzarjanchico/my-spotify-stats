import { CurrentTrackSuccessResponse, SpotifyMainServiceErrorResponse, SpotityMainServiceResponse, TopTracksSuccessResponse } from "./models/response-models";
import { User as CurrentUserSuccessResponse } from "../pages/model/objects";

export class SpotifyMainService {
    static API_URL = "https://api.spotify.com/v1";

    static async getCurrentUser(token_type:string, access_token:string): Promise<SpotityMainServiceResponse> {
        const link = `${this.API_URL}/me`;
        
        const init: RequestInit = {
            method: 'GET',
            headers: {
                'Authorization': `${token_type} ${access_token}`
            },
        };

        try {
            const response = await fetch(link, init);

            if (!response.ok) {
                const error = ((await response.json()) as SpotifyMainServiceErrorResponse).error;

                if (error.status === 401 && error.message === "The access token expired") {
                    console.warn("expired-access-token:", error.status, error.message);
                    return ({
                        status: "error",
                        data: error,
                        message: "Access token is expired.",
                        type: "expired-access-token",
                        date: new Date()
                    }) as SpotityMainServiceResponse;
                }

                // Uncaught Error: Errors relating to fetching token go here
                throw new Error(`${error.status} - ${error.message}.`);
            }

            const data = (await response.json()) as CurrentUserSuccessResponse;
            if (data) {
                return ({
                  status: "success",
                  data: data,
                  message: "User profile acquired!",
                  date: new Date()
                }) as SpotityMainServiceResponse;
            }

            // Uncaught Error: If access token not found in success response
            throw new Error('User profile data not found.');

        } 
        catch (e) {
            // All uncaught errors should go here
            console.error("uncaught-get-user-profile-error")
            return ({
                status: "error",
                message: `Uncaught Error: ${(e as Error).message ?? "Something went wrong during the Spotify API get user profile request."}`,
                type: "uncaught-fetch-token-error",
                date: new Date()
            }) as SpotityMainServiceResponse;
        } 

    }

    static async getUserTopList(token_type:string, access_token:string, type:string, time_range?:string, limit?:number, offset?:number) {
        const params = new URLSearchParams({
            time_range: time_range ?? 'short_term',
            limit: limit ? limit.toString() : "10",
            offset: offset ? offset.toString() : "0"
        });

        const link = `${this.API_URL}/me/top/${type}?${params.toString()}`

        const init: RequestInit = {
            method: 'GET',
            headers: {
                'Authorization': `${token_type} ${access_token}`
            },
        };

        try {
            const response = await fetch(link, init);

            if (!response.ok) {
                const error = ((await response.json()) as SpotifyMainServiceErrorResponse).error;

                if (error.status === 401 && error.message === "The access token expired") {
                    console.warn("expired-access-token:", error.status, error.message);
                    return ({
                        status: "error",
                        data: error,
                        message: "Access token is expired.",
                        type: "expired-access-token",
                        date: new Date()
                    }) as SpotityMainServiceResponse;
                }

                // Uncaught Error: Errors relating to fetching token go here
                throw new Error(`${error.status} - ${error.message}.`);
            }
            
            const data = (await response.json()) as TopTracksSuccessResponse;
            const msgFrom = (offset ? offset : 0) + 1;
            const msgTo = (offset ? offset : 0) + (limit ? limit : 10);
            const msgType = time_range ?? "short_term"

            if (data) {
                return ({
                  status: "success",
                  data: data,
                  message: `User top ${msgType} ${msgFrom}-${msgTo} ${type} acquired!`,
                  date: new Date()
                }) as SpotityMainServiceResponse;
            }

            // Uncaught Error: If access token not found in success response
            throw new Error(`User current top ${type} list not found.`);
        } 
        catch (e) {
            // All uncaught errors should go here
            console.error("uncaught-get-user-top-list-error")
            return ({
                status: "error",
                message: `Uncaught Error: ${(e as Error).message ?? `Something went wrong getting top user ${type}.`}`,
                type: "uncaught-get-user-top-list-error",
                date: new Date()
            }) as SpotityMainServiceResponse;
        } 
    }

    static async getUserCurrentTrack(token_type:string, access_token:string) {
        const link = `${this.API_URL}/me/player/currently-playing`

        const init: RequestInit = {
            method: 'GET',
            headers: {
                'Authorization': `${token_type} ${access_token}`
            },
        };

        try {
            const response = await fetch(link, init);

            if (!response.ok) {
                const error = ((await response.json()) as SpotifyMainServiceErrorResponse).error;

                if (error.status === 401 && error.message === "The access token expired") {
                    console.warn("expired-access-token:", error.status, error.message);
                    return ({
                        status: "error",
                        data: error,
                        message: "Access token is expired.",
                        type: "expired-access-token",
                        date: new Date()
                    }) as SpotityMainServiceResponse;
                }

                // Uncaught Error: Errors relating to fetching token go here
                throw new Error(`${error.status} - ${error.message}.`);
            }

            // Succesful response but no content
            if (response.ok && response.status === 204) {
                return ({
                    status: "error",
                    data: null,
                    message: "The user currently has no currently playing track.",
                    type: "no-current-track",
                    date: new Date() 
                }) as SpotityMainServiceResponse;
            }

            const data = (await response.json()) as CurrentTrackSuccessResponse;
            if (data) {
                return ({
                  status: "success",
                  data: data,
                  message: "User currently playing track acquired!",
                  date: new Date()
                }) as SpotityMainServiceResponse;
            }

            // Uncaught Error: If access token not found in success response
            throw new Error(`User currently playing track not found.`);
        } 
        catch (e) {
            // All uncaught errors should go here
            console.error("uncaught-get-current-track-error")
            return ({
                status: "error",
                message: `Uncaught Error: ${(e as Error).message ?? `Something went wrong getting currently playing user track.`}`,
                type: "uncaught-get-user-top-list-error",
                date: new Date()
            }) as SpotityMainServiceResponse;
        } 

    }
}