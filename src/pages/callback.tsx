import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PuffLoader } from "react-spinners";

import { SpotifyAuthorizationService } from "../api/spotify-auth";
import { AccessTokenSuccess } from "../api/models/auth-models";
import { StoredAccessToken } from "./model/token";
// import { SpotifyMainService } from "../api/spotify-main";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const CallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Spotify URL Authorization query params
    const userAuthCode = searchParams.get("code");
    const userAuthState = searchParams.get("state");
    const userAuthError = searchParams.get("error");

    // Auth state generated from the app
    const appState = localStorage.getItem('app_state');

    // Token states
    const [accessToken, setAccessToken] = useState<StoredAccessToken | null>(() => {
        const storedToken = localStorage.getItem('access_token');
        try {
            return storedToken ? (JSON.parse(storedToken) as StoredAccessToken) : null;
        } catch (error) {
            console.error("Failed to parse access token from localStorage", error);
            return null;
        }
    });

    // Home page conditionals after Spotify URL authorization
    const isError = userAuthError ?? (userAuthState && userAuthState !== appState);
    const isSuccess = userAuthCode && userAuthState;
    const isLoading = !isError && !isSuccess;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (userAuthCode && userAuthState && !accessToken) {
                    // If user auth code and state exists in query params, fetch token
                    const tokenResponse = await SpotifyAuthorizationService.fetchTokenWithAuth(userAuthCode);
                    
                    if (tokenResponse.status === "success") {
                        // If success, store access token and set the current state
                        const success_token = (tokenResponse.data as AccessTokenSuccess);

                        const access_token = ({
                            data: success_token,
                            expiry_date: new Date(tokenResponse.date.getTime() + (1000 * success_token.expires_in))
                        }) as StoredAccessToken;

                        localStorage.setItem('access_token', JSON.stringify(access_token));
                        setAccessToken(access_token);
                        navigate("/home");

                    } else {
                        // Else, something must've went wrong

                        // Expected Error: If authcode was invalid because you already exchanged it for a token
                        if (tokenResponse.type && tokenResponse.type == "invalid-auth-code") {
                            console.warn("Authorization code was already exchanged for an access token.");
                            return;
                        }

                        // Expected Error: If authcode was expired since it already past ten minutes
                        if (tokenResponse.type && tokenResponse.type == "expired-auth-code") {
                            console.warn("Authorization code was already expired.");
                            return;
                        }

                        throw new Error(tokenResponse.message);
                    }

                } else if (!userAuthCode && !userAuthState) {
                    // If user auth code and state does not exist, re-run the authorization handler from Spotify
                    localStorage.removeItem('app_state');
                    localStorage.removeItem('access_token');
                    
                    SpotifyAuthorizationService.handleLogin();
                }

            } catch (err) {
                console.error("Failed to fetch token:", err);
            }
        };
        void fetchData();

    }, [accessToken, userAuthCode, userAuthState, navigate]);

    // Spotify URL Authorization Error Reason
    const authErrorReason = () => {
        if (userAuthError) {
            return userAuthError
        }
        if (userAuthState && userAuthState !== appState) {
            return "state_mismatch"
        }
        return null
    }

    const errorButton = () => {
        window.location.href = '/';
    }

    return (
        <>
            <div className="flex w-full h-screen items-center justify-center">
                {isLoading && 
                    <div className="flex flex-col items-center">
                        <PuffLoader
                            color={"#9061f9"}
                            loading={isLoading}
                            size={150}
                        />
                        <span className="mt-5">Authenticating</span>
                    </div>
                } 
                {isError &&
                    <div className="flex flex-col items-center">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="h-20 my-1" />
                        <p>Something went wrong. Authentication denied.</p>
                        {authErrorReason() && <p className="my-1">ERROR: <span className="bg-zinc-900 text-red-400 px-2 py-[0.15rem] rounded">{authErrorReason()}</span></p>}

                        <button className="my-5" onClick={() => errorButton()}>Retry</button>
                    </div>
                }
                {isSuccess && !isError &&
                    <div className="flex flex-col items-center">
                        <PuffLoader
                            color={"#9061f9"}
                            loading={true}
                            size={150}
                        />
                        <span className="mt-5">Loading</span>
                    </div>
                }
            </div>
        </>
    )
}

export default CallbackPage;