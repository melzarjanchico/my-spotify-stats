import { MouseEvent, useEffect, useRef, useState } from "react";
import { StoredAccessToken } from "../model/token";
import { activateTextTruncateScroll } from '../modified-packages/text-truncate-scroll/text-truncate-scroll'
import { SpotifyMainService } from "../../api/spotify-main";
import { CurrentTrackSuccessResponse, TopTracksSuccessResponse } from "../../api/models/response-models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompactDisc, faHeadphones, faPlay, faPause, faRecordVinyl } from "@fortawesome/free-solid-svg-icons";
import { PuffLoader } from "react-spinners";
import { getTooltipTheme, nowPlayingIcon, nowPlayingTooltipContent } from "./utils";
import { Tooltip } from "flowbite-react";
import { hasArtistCheck } from "./utils";

export interface ContentProps {
    accessToken: StoredAccessToken | null;
    currentTrack: CurrentTrackSuccessResponse | null;
    tokenRefresher: () => Promise<void>;
}

const timerangeSelections = [
    {name: "Fresh", id: "short_term"},
    {name: "Recent", id: "medium_term"},
    {name: "Timeless", id: "long_term"},
];

const Content = (props: ContentProps) => {
    const {accessToken, currentTrack, tokenRefresher} = props;

    const [topTracks, setTopTracks] = useState<TopTracksSuccessResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [term, setTerm] = useState("medium_term");
    const [offset, setOffset] = useState(0);
    const limit = 20;


    useEffect(() => {
        const getTopTracks = async () => {

            setIsLoading(true);
            
            if (accessToken) {
                const topTracksResponse = await SpotifyMainService.getUserTopList(accessToken.data.token_type, accessToken.data.access_token, "tracks", term, limit);
    
                if (topTracksResponse.status === "success") {
                    // If success, set current track
                    setTopTracks(topTracksResponse.data as TopTracksSuccessResponse);
                    setTrackSelected((topTracksResponse.data as TopTracksSuccessResponse).items[0].id)
                } else {
                    // Else, something must've went wrong
                    throw new Error(topTracksResponse.message)
                }
            }

            setIsLoading(false);
            activateTextTruncateScroll({ scrollSpeed: 40 });
        };

        if (!topTracks) {
            void getTopTracks();
        }

    }, [accessToken, topTracks, term])


    const addNewItemList = async (retryCount = 0) => {
        if (retryCount > 1) {
            // Prevent infinite loop by limiting retries
            throw new Error("Failed refetching token in fetching more top songs.");
        }

        if (accessToken && topTracks) {
            const newTracksResponse = await SpotifyMainService.getUserTopList(accessToken.data.token_type, accessToken.data.access_token, "tracks", term, limit, topTracks.offset+limit);
            
            if (newTracksResponse.status === "success") {
                setOffset(topTracks.offset+limit);
                // If success, set current track
                setTopTracks({
                        ...(newTracksResponse.data as TopTracksSuccessResponse),
                        items: [...topTracks.items, ...(newTracksResponse.data as TopTracksSuccessResponse).items]
                    }
                );

            } else {
                // Else, something must've went wrong

                // Expected Error: Expired token
                if (newTracksResponse.status === "error" && newTracksResponse.type === "expired-access-token") {
                    await tokenRefresher();
                    await addNewItemList(retryCount + 1);
                }

                throw new Error(newTracksResponse.message)
            }
        }

        activateTextTruncateScroll({ scrollSpeed: 40 });
    }

    const setTrackTimeRange = async (timerange: string, retryCount = 1) => {
        if (retryCount > 1) {
            // Prevent infinite loop by limiting retries
            throw new Error("Failed refetching token in fetching top list by time range.");
        }

        if (accessToken && topTracks && timerange !== term) {
            const newTracksResponse = await SpotifyMainService.getUserTopList(accessToken.data.token_type, accessToken.data.access_token, "tracks", timerange, limit);

            if (newTracksResponse.status === "success") {
                setTerm(timerange);
                // If success, set current track
                setTopTracks(newTracksResponse.data as TopTracksSuccessResponse);
                setTrackSelected((newTracksResponse.data as TopTracksSuccessResponse).items[0].id)
                setOffset((newTracksResponse.data as TopTracksSuccessResponse).offset);

            } else {
                // Else, something must've went wrong

                // Expected Error: Expired token
                if (newTracksResponse.status === "error" && newTracksResponse.type === "expired-access-token") {
                    await tokenRefresher();
                    await setTrackTimeRange(timerange, retryCount+1);
                }

                throw new Error(newTracksResponse.message)
            }
        }

        activateTextTruncateScroll({ scrollSpeed: 40 });
    }

    // AUDIO RELATED SHIT
    const audioRef = useRef(new Audio());
    const [currentPreviewAudio, setCurrentPreviewAudio] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;

        const handleEnded = () => {
            setIsPlaying(false); // Update state when audio ends
        };

        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.currentTime = 0;
            audio.removeEventListener('ended', handleEnded); // Cleanup the event listener
        };
    }, []);

    const playAudio = (e: MouseEvent<SVGSVGElement, globalThis.MouseEvent>, url: string) => {
        e.stopPropagation();

        if (audioRef.current.src !== url) {
            setCurrentPreviewAudio(url);
            setIsPlaying(true);
            audioRef.current.src = url;
            audioRef.current.load(); // Load the new audio source
        }
    
        if (audioRef.current.paused) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                setIsPlaying(false);
                console.error("Error playing audio:", error);
            });
          } else {
            setIsPlaying(false);
            audioRef.current.pause(); // Pause if it's currently playing
          }
    }; 

    const checkPlayingAudio = (url: string) => {
        return (isPlaying && currentPreviewAudio === url);
    }

    const iconColorPlayingAudio = (isPlaying: boolean) => {
        return isPlaying ? "text-zinc-50 h-3 opacity-90" : "text-zinc-50 h-3 opacity-50 transition-[opacity] duration-[250ms] hover:opacity-90";
    }

    // UI SELECTION SHIT
    const [trackSelected, setTrackSelected] = useState("");

    const isTrackSelected = (trackId: string) => {
        return trackSelected === trackId;
    }

    const handleSelection = (id: string) => {
        setTrackSelected(id);
        activateTextTruncateScroll({ scrollSpeed: 40 });
    }

    const timerange_selected = " border border-zinc-700 bg-purple-600/70 active";
    const timerange_unselected = " border border-zinc-700 bg-zinc-950/50 cursor-pointer transition-[border-color] duration-[250ms] hover:border-purple-500";

    const listitem_unselected = " bg-zinc-900/50 border-zinc-700 transition-[background-color] transition-[border-color] duration-[250ms] hover:bg-zinc-600/10 hover:border-zinc-600 cursor-pointer"


    return (
        <>
        
            <div className="flex flex-col p-4 gap-4 border rounded-md shadow border-zinc-700 bg-zinc-800">

                {isLoading &&
                    <div className="flex grow justify-center py-20">
                        <PuffLoader
                            color="#ffffff"
                            loading={(isLoading)}
                            size={50}
                        />
                    </div>
                }

                {!isLoading && topTracks &&
                <>
                    {/* Selector */}
                    <div className="overflow-x-scroll no-scrollbar">
                        <div className="flex gap-1 text-xs md:text-sm">
                            {
                                timerangeSelections.map((timerange) => (
                                    <div className="flex-shrink-0" onClick={() => {void setTrackTimeRange(timerange.id)}} key={timerange.id}>
                                        <span className={"inline-block px-3.5 py-1.5 rounded-md" + (timerange.id === term ? timerange_selected : timerange_unselected)}>{timerange.name}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex flex-col gap-1.5 overflow-hidden">

                        {topTracks?.items
                            .map((track, index) => (
                                <div className={"flex flex-row place-items-center rounded-md border" + listitem_unselected} key={track.id} onClick={() => {handleSelection(track.id)}}>
                                    
                                    
                                        <div className={"flex place-items-center justify-center w-10 h-10 rounded-s-md flex-none md:w-12 md:h-12 text-xs font-normal md:text-sm"}>
                                            {index+1}
                                        </div>
                                    

                                    <div className={"flex-none " + (isTrackSelected(track.id) ? "w-16 h-16 md:w-32 md:h-32 md:me-1.5" : "w-12 h-12 md:w-16 md:h-16")} >
                                        {track.album.images.length ?
                                            <img src={track.album.images[1].url} loading="lazy" draggable={false}/> :
                                            <div className="flex place-items-center justify-center h-full bg-zinc-900">
                                                <FontAwesomeIcon icon={faCompactDisc} className="text-zinc-500 h-6 opacity-50"/>
                                            </div>
                                        }
                                    </div>

                                    <div className="min-w-4 mx-2.5 truncate">
                                        <div className="flex flex-col">
                                            <div className="flex flex-row place-items-center gap-1.5">
                                                {currentTrack?.item && (track.id === currentTrack.item.id) &&
                                                    <div className="ms-0.5">
                                                        <Tooltip content={nowPlayingTooltipContent(currentTrack, false)} arrow={true} theme={getTooltipTheme(currentTrack.is_playing)}>
                                                            <FontAwesomeIcon icon={faHeadphones} className={"w-2.5 md:w-3" + nowPlayingIcon(currentTrack)}/>
                                                        </Tooltip>
                                                    </div>
                                                }
                                                <div className="text-xs font-normal text-truncate-scroll md:text-base">
                                                    <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">{track.name}</a>
                                                </div>
                                            </div>
                                            {hasArtistCheck(track.artists) &&
                                                <div className="text-[0.7rem] text-zinc-400 text-truncate-scroll md:text-xs">
                                                    {
                                                        track.artists.map((artist, index) => (
                                                            <span key={artist.id || index}>
                                                                <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" key={artist.id}>
                                                                    {artist.name}
                                                                </a>
                                                                {index < track.artists.length - 1 && ", "}
                                                            </span>
                                                        ))
                                                    }                                
                                                </div>
                                            }
                                            {isTrackSelected(track.id) &&
                                                <div className="flex items-center text-[0.7rem] text-zinc-400 md:text-xs">
                                                    <FontAwesomeIcon icon={faRecordVinyl} className="w-2.5 text-zinc-400 me-1 md:me-1.5"/> 
                                                    <div className="text-truncate-scroll">
                                                        <a href={track.album.external_urls.spotify} target="_blank" rel="noopener noreferrer">{track.album.name}</a>
                                                        <span className="mx-1">&#8226;</span>
                                                        {track.album.release_date.slice(0,4)}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                    <div className="grow"/>

                                    {track.preview_url &&
                                        <div className="flex place-items-center justify-center w-10 h-10 rounded-s-md flex-none md:w-12 md:h-12 text-xs font-normal md:text-sm">
                                            {checkPlayingAudio(track.preview_url) ?
                                                <FontAwesomeIcon 
                                                    icon={faPause} 
                                                    className={iconColorPlayingAudio(checkPlayingAudio(track.preview_url))} 
                                                    onClick={(e) => track.preview_url ? playAudio(e, track.preview_url) : {}}
                                                /> : 
                                                <FontAwesomeIcon 
                                                    icon={faPlay} 
                                                    className={iconColorPlayingAudio(checkPlayingAudio(track.preview_url))} 
                                                    onClick={(e) => track.preview_url ? playAudio(e, track.preview_url) : {}}
                                                />
                                            }
                                        </div>
                                    }
                                </div>

                            ))
                        }

                    </div>

                    {/* Selector */}
                    {topTracks && ((offset + limit) < 100) ?
                        <div className="flex justify-center">
                            <button className="text-sm py-1.5" onClick={() => void addNewItemList()}>See More</button>
                        </div> :
                        <div className="flex justify-center">
                            <button className="text-sm py-1.5" onClick={() => {window.scrollTo({ top: 0, behavior: "smooth" })}}>Back to Top</button>
                        </div>
                    }

                </>
                }

            </div>
        </>
    )

}

export default Content;