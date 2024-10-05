import { CurrentTrackSuccessResponse } from "../../api/models/response-models";
import { Artist } from "../model/objects";

export const getTooltipTheme = (isPlaying: boolean) => {
    const backgroundColor = isPlaying ? "bg-green-500" : "bg-orange-500";

    return {
        target: "w-fit leading-[0px]",
        animation: "transition delay-500",
        arrow: {
            style: {
                dark: backgroundColor, // Ensure this matches what is expected
            },
        },
        base: "rounded-md px-2 py-1 text-xs font-light",
        style: {
            dark: backgroundColor, // Ensure this matches what is expected
        }
    };
}
export const nowPlayingIcon = (currentTrack: CurrentTrackSuccessResponse)  => {
    if (currentTrack?.is_playing) {
        return " fa-beat icon-beat text-green-400"
    } else {
        return " text-orange-400"
    }
}

export const nowPlayingTooltipContent = (currentTrack: CurrentTrackSuccessResponse, forProfile = true) => {
    if (currentTrack?.is_playing) {
        return forProfile ? "Online" : "Currently Playing"
    } else {
        return forProfile ? "Away" : "Currently Paused"
    }
}

export const hasArtistCheck = (artists: Artist[]) => {
    if (artists) {
        return artists.every(artist => (artist.id && artist.name))
    }
}