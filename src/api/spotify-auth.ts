import { AccessTokenSuccess, AccessTokenError, AccessTokenResponse } from "./models/auth-models";

const generateRandomString = (length: number): string => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

export class SpotifyAuthorizationService {
    static API_URL = "https://accounts.spotify.com/api/token";
    static CLIENT_ID = `${import.meta.env.VITE_CLIENT_ID}`;
    static CLIENT_SECRET = `${import.meta.env.VITE_CLIENT_SECRET}`;
    static CLIENT_URL = `${import.meta.env.VITE_URL}`;
    static MODE = `${import.meta.env.VITE_NODE_ENV}`

    static REDIRECT_URI = (this.MODE === "production") ? `${this.CLIENT_URL}/callback` : "http://localhost:5173/callback";
    
    // * Client Creds Flow: Useful for endpoints with no authorization needed.
    // static async fetchTokenNoAuth(): Promise<string> {
    //     const params = new URLSearchParams({
    //         grant_type: 'client_credentials'
    //     });

    //     const init: RequestInit = {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/x-www-form-urlencoded',
    //             'Authorization': `Basic ${btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)}`
    //         },
    //         body: params.toString()
    //     };

    //     const response = await fetch(this.API_URL, init);

    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }
    //     const data = await response.json();

    //     if (data && data.access_token) {
    //         return data.access_token;
    //     }
    //     throw new Error('Access token not found in response');
    // }

    // * =======================================
    // * Authorization Code Flow: Fetch token
    // * =======================================
    static async fetchTokenWithAuth(code: string): Promise<AccessTokenResponse> {
      const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.REDIRECT_URI
      });

      const init: RequestInit = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)}`
          },
          body: params.toString()
      };

      try {
        const response = await fetch(this.API_URL, init);

        // On failure
        if (!response.ok) {
          const error = (await response.json()) as AccessTokenError;
          
          // Expected Error: Expired auth code
          if (error.error === "invalid_grant" && error.error_description === "Authorization code expired") {
            console.warn("expired-auth-code:", error.error, error.error_description);
            return ({
              status: "error",
              data: error,
              message: "Authorization code has expired.",
              type: "expired-auth-code",
              date: new Date()
            }) as AccessTokenResponse;
          }

          // Expected Error. Invalid auth code
          if (error.error === "invalid_grant" && error.error_description === "Invalid authorization code") {
            console.warn("invalid-auth-code:", error.error, error.error_description);
            return ({
              status: "error",
              data: error,
              message: "Authorization code is invalid.",
              type: "invalid-auth-code",
              date: new Date()
            }) as AccessTokenResponse;
          }

          // Uncaught Error: Errors relating to fetching token go here
          throw new Error(`${error.error} - ${error.error_description}.`);
        }

        // On success
        const data = (await response.json()) as AccessTokenSuccess;
        if (data) {
            return ({
              status: "success",
              data: data,
              message: "Access token acquired!",
              date: new Date()
            }) as AccessTokenResponse;
        }

        // Uncaught Error: If access token not found in success response
        throw new Error('Access token data not found.');

      }
      catch (e) {
        // All uncaught errors should go here
        console.error("uncaught-fetch-token-error")
        return ({
          status: "error",
          message: `Uncaught Error: ${(e as Error).message ?? "Something went wrong during the Spotify API fetch token request."}`,
          type: "uncaught-fetch-token-error",
          date: new Date()
        }) as AccessTokenResponse;
      }
    }

    // * =======================================
    // * Authorization Code Flow: Refresh Token
    // * =======================================
    static async refreshToken(refresh_token: string): Promise<AccessTokenResponse> {
      const params = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token,
      });

      const init: RequestInit = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)}`
          },
          body: params.toString()
      };

      try {
        const response = await fetch(this.API_URL, init);

        // On failure
        if (!response.ok) {
            const error = (await response.json()) as AccessTokenError;
  
            throw new Error(`Uncaught Error: ${error.error} - ${error.error_description}.`);
        }

        // On success
        const data = (await response.json()) as AccessTokenSuccess;
        if (data) {
            return ({
              status: "success",
              data: data,
              message: "Refresh access token acquired!",
              date: new Date()
            }) as AccessTokenResponse;
        }

        // If access token not found in success response
        throw new Error('Uncaught Error: Access refresh token not found.');
      }
      catch (e) {
        // All uncaught errors should go here
        console.error("uncaught-refresh-token-error")
        return ({
          status: "error",
          message: `Uncaught Error: ${(e as Error).message ?? "Something went wrong during the Spotify API refresh token request."}`,
          type: "uncaught-refresh-token-error",
          date: new Date()
        }) as AccessTokenResponse;
      }

    }

    // * =======================================
    // * Spotify URL Login Authorization
    // * =======================================
    static handleLogin = () => {
      const state = generateRandomString(16);
      const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing';

      localStorage.setItem('app_state', state);

      const authUrl = `https://accounts.spotify.com/authorize?` +
        new URLSearchParams({
          response_type: 'code',
          client_id: this.CLIENT_ID,
          scope: scope,
          redirect_uri: this.REDIRECT_URI,
          state: state,
          //show_dialog: 'true'
        }).toString();

      window.location.href = authUrl.toString();
    };

}
