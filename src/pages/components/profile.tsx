import ReactCountryFlag from "react-country-flag";
import { getName } from 'country-list';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserAlt } from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons"
import CurrentTrackPlayer from "./current-track";
import { User } from "../model/objects";
import { StoredAccessToken } from "../model/token";
import { PuffLoader } from "react-spinners";
import { CurrentTrackSuccessResponse } from "../../api/models/response-models";

export interface ProfileProps {
    accessToken: StoredAccessToken | null;
    profile: User | undefined;
    setCurrentSong: (currentSong: CurrentTrackSuccessResponse | null) => void;
}

const Profile = (props: ProfileProps) => {
    const {profile, accessToken, setCurrentSong} = props;

    const isLoading = !profile || !accessToken;
    const isSuccess = profile && accessToken;

    return (
        <>
            <div className="flex flex-col py-4 gap-2 items-center border rounded-md shadow md:flex-row md:p-0 md:gap-6 border-zinc-700 bg-zinc-800 overflow-hidden">
                {isLoading &&
                    <div className="flex grow justify-center py-12">
                        <PuffLoader
                            color="#ffffff"
                            loading={isLoading}
                            size={50}
                        />
                    </div>
                }
                {isSuccess && !isLoading && profile &&
                    <>
                        {/* Profile Picture */}
                        <img 
                            className="object-cover rounded-full max-w-56 border border-zinc-700 bg-zinc-800 md:h-auto md:max-w-64 md:rounded-none md:rounded-s-md md:m-0 md:border-0" 
                            src={profile.images[1].url} 
                            alt="Profile"
                            draggable={false}
                        /> 

                        {/* Profile Information */}
                        <div className="flex flex-col w-full px-4 justify-between leading-normal items-center overflow-hidden md:items-start md:px-0">

                            {/* Display Name */}
                            <h5 className="text-3xl font-bold tracking-tight mx-1 mb-1">{profile.display_name}</h5>

                            {/* Profile Details */}
                            <div className="flex flex-row flex-wrap gap-1 whitespace-nowrap min-w-56 justify-center md:justify-start">
                                {/* Country */}
                                <div className="flex flex-row items-center gap-1.5 py-1 px-3 border rounded-xl border-zinc-700 bg-zinc-900/50">
                                    <ReactCountryFlag svg countryCode={profile.country} style={{width: '0.8em', height: '0.8em',}}/>
                                    <div className="text-xs">{getName(profile.country)}</div>
                                </div>
                                {/* Followers */}
                                <div className="flex flex-row items-center gap-1.5 py-1 px-3 border rounded-xl border-zinc-700 bg-zinc-900/50">
                                    <FontAwesomeIcon icon={faUserAlt} className="w-2.5 h-2.5"/>
                                    <div className="text-xs">{`${profile.followers.total} Followers`}</div>
                                </div>
                                {/* Premium/Free */}
                                <div className="flex flex-row items-center gap-1.5 py-1 px-3 border rounded-xl border-zinc-700 bg-zinc-900/50">
                                    <FontAwesomeIcon icon={faSpotify} className="w-2.5 h-2.5"/>
                                    <div className="text-xs">{`${profile.product[0].toUpperCase()}${profile.product.slice(1)}`}</div>
                                </div>
                                
                            </div>

                            {/* Currently Playing Track */}
                            <CurrentTrackPlayer accessToken={accessToken} setCurrentSong={setCurrentSong}/>
                        </div>
                    </>
                }
            </div>
        </>
    )
}

export default Profile;