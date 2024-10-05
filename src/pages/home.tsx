import { useCallback, useEffect, useState } from "react";
import { StoredAccessToken } from "./model/token";
import Profile from "./components/profile";
import Main from "./components/content";
import { User } from "./model/objects";
import { SpotifyMainService } from "../api/spotify-main";
import { CurrentTrackSuccessResponse } from "../api/models/response-models";
import { SpotifyAuthorizationService } from "../api/spotify-auth";
import { AccessTokenSuccess } from "../api/models/auth-models";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
    const navigate = useNavigate();

    // Token states
    const [accessToken, setAccessToken] = useState<StoredAccessToken | null>(() => {
        const storedToken = localStorage.getItem('access_token');
        try {
            return storedToken ? JSON.parse(storedToken) : null;
        } catch (error) {
            console.error("Failed to parse access token from localStorage", error);
            return null;
        }
    });

    // Profile
    const [profile, setProfile] = useState<User>();

    // Current Track
    const [currentSong, setCurrentSong] = useState<CurrentTrackSuccessResponse | null>(null);
    const handleCurrentSong = (currentSong: CurrentTrackSuccessResponse | null) => {
        setCurrentSong(currentSong);
    }

    const refreshToken = useCallback(async () => {
        if (accessToken) {
            try {
                const tokenResponse = await SpotifyAuthorizationService.refreshToken(accessToken.data.refresh_token);

                if (tokenResponse.status === "success") {
                    // If success, store access token and set the current state
                    const success_token = (tokenResponse.data as AccessTokenSuccess);

                    const access_token = ({
                        data: success_token,
                        expiry_date: new Date(tokenResponse.date.getTime() + (1000 * success_token.expires_in))
                    }) as StoredAccessToken;

                    localStorage.setItem('access_token', JSON.stringify(access_token));
                    setAccessToken(access_token);

                } else {
                    // Else, something must've went wrong
                    navigate("/");

                    throw new Error(tokenResponse.message);
                }

            } catch (err) {
                console.error("Failed to fetch token:", err);
            }
        } 
    }, [accessToken, navigate])

    useEffect(() => {
        if (!accessToken) {
            navigate("/");
        }
    }, [accessToken, navigate])

    useEffect(() => {
        const getProfile = async () => {
            if (accessToken) {
                const profile = await SpotifyMainService.getCurrentUser(accessToken.data.token_type, accessToken.data.access_token);
    
                if (profile.status === "success" && profile.data) {
                    setProfile(profile.data as User);

                } else if (profile.status === "error" && profile.type === "expired-access-token") {
                    // console.log(profile)
                    refreshToken();
                }

            }
        };

        getProfile();
    }, [accessToken, refreshToken])

    return (
        <>

            <div className="flex flex-col my-8 mx-auto gap-4 w-10/12 max-w-xl md:max-w-full lg:max-w-[1000px] select-none">
                <Profile profile={profile} accessToken={accessToken} setCurrentSong={handleCurrentSong} />
                <Main accessToken={accessToken} currentTrack={currentSong} tokenRefresher={refreshToken}/>
            </div>

        </>
    )
}

export default HomePage;