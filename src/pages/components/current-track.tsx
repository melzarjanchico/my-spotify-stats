import { useEffect, useState } from "react";
import { CurrentTrackSuccessResponse } from "../../api/models/response-models";
import { SpotifyMainService } from "../../api/spotify-main";
import { StoredAccessToken } from "../model/token";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faHeadphones, faCompactDisc, faExclamation } from "@fortawesome/free-solid-svg-icons";
import { activateTextTruncateScroll } from '../modified-packages/text-truncate-scroll/text-truncate-scroll'
import { Tooltip } from "flowbite-react";
import { getTooltipTheme, hasArtistCheck, nowPlayingIcon, nowPlayingTooltipContent } from "./utils";

export interface CurrentTrackProps {
    accessToken: StoredAccessToken | null;
    setCurrentSong: (currentSong: CurrentTrackSuccessResponse | null) => void;
}

const CurrentTrack = (props: CurrentTrackProps) => {
    const {accessToken, setCurrentSong} = props;

    const [currentTrack, setCurrentTrack] = useState<CurrentTrackSuccessResponse | null>(null);
    const [isNoContent, setIsNoContent] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getCurrentTrack = async () => {
            if (accessToken) {
                const currentTrack = await SpotifyMainService.getUserCurrentTrack(accessToken.data.token_type, accessToken.data.access_token);
    
                if (currentTrack.status === "success") {
                    // If success, set current track
                    setCurrentTrack(currentTrack.data as CurrentTrackSuccessResponse);
                    setIsLoading(false);
                    
                } else {
                    // Else, something must've went wrong
    
                    // Expected Error: API did not return anything because you're already offline
                    if (currentTrack.type && currentTrack.type === "no-current-track") {
                        console.warn("User currently has no playing track.");
                        setIsLoading(false);
                        setIsNoContent(true);
                        return;
                    }
                    throw new Error(currentTrack.message)
                }
            }
            activateTextTruncateScroll({ scrollSpeed: 40 });
        };

        void getCurrentTrack();
    }, [accessToken])

    useEffect(() => {
        if (currentTrack) {
            setCurrentSong(currentTrack)
        }
    }, [currentTrack, setCurrentSong])

    return (
        <>
            <div className="flex w-full mt-3 justify-center md:justify-start">
                <div className="border w-72 min-w-52 rounded-md border-zinc-700 bg-zinc-950/50">

                    {/* Loading */}
                    {!currentTrack && isLoading &&
                        <div className="flex flex-row place-items-center">
                            <div className="flex place-items-center justify-center rounded-s-md w-14 h-14 bg-zinc-950/70 flex-none"/>
                            <div className="text-xs text-zinc-400 mx-2.5">
                                ...
                            </div>
                        </div>
                    }

                    {/* No track currently playing */}
                    {!currentTrack && isNoContent &&  
                        <div className="flex flex-row place-items-center">
                            <div className="flex place-items-center justify-center rounded-s-md w-14 h-14 bg-zinc-950/70 flex-none">
                                <FontAwesomeIcon icon={faXmark} className="text-zinc-500 h-6"/>
                            </div>
                            <div className="text-xs text-zinc-400 mx-2.5">
                                No track is currently played.
                            </div>
                        </div>
                    }

                    {/* Track is not a track */}
                    {currentTrack && currentTrack.currently_playing_type !== "track" &&  
                        <div className="flex flex-row place-items-center">
                            <div className="flex place-items-center justify-center rounded-s-md w-14 h-14 bg-zinc-950/70 flex-none">
                                <FontAwesomeIcon icon={faExclamation} className="text-zinc-500 h-6"/>
                            </div>
                            <div className="text-xs text-zinc-400 mx-2.5">
                                Unavailable. Currently playing an {currentTrack.currently_playing_type}.
                            </div>
                        </div>
                    }

                    {/* Has track currently playing */}
                    {currentTrack?.item &&
                        <div className="flex flex-row place-items-center">
                            {currentTrack.item.album.images.length ?
                                <img className="rounded-s-md w-14 h-14 min-w-14 min-h-14 flex-shrink-0" src={currentTrack.item.album.images[2].url} loading="lazy" draggable={false}/> :
                                <div className="flex place-items-center justify-center rounded-s-md w-14 h-14 bg-zinc-950/70 flex-none">
                                    <FontAwesomeIcon icon={faCompactDisc} className="text-zinc-500 h-6"/>
                                </div>
                            }
                            <div className="mx-2.5 truncate">
                                <div className="flex flex-col">
                                    <div className="flex flex-row place-items-center gap-1.5">
                                        <div className="ms-0.5">
                                            <Tooltip content={nowPlayingTooltipContent(currentTrack)} arrow={true} theme={getTooltipTheme(currentTrack.is_playing)}>
                                                <FontAwesomeIcon icon={faHeadphones} className={"w-3" + nowPlayingIcon(currentTrack)}/>
                                            </Tooltip>
                                        </div>
                                        <div className="text-sm font-normal text-truncate-scroll">
                                            <a href={currentTrack.item.external_urls.spotify} target="_blank" rel="noopener noreferrer">{currentTrack.item.name}</a>
                                        </div>
                                    </div>
                                    {hasArtistCheck(currentTrack.item.artists) &&
                                        <div className="text-xs text-zinc-400 text-truncate-scroll">
                                            {
                                                currentTrack.item.artists.map((artist, index) => (
                                                    <span key={artist.id || index}>
                                                        <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" key={artist.id}>
                                                            {artist.name}
                                                        </a>
                                                        {currentTrack.item && index < currentTrack.item.artists.length - 1 && ", "}
                                                    </span>
                                                ))
                                            }                                
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                    
                </div>
            </div>
        </>
    )

}

export default CurrentTrack;