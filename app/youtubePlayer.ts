/**
 * @see https://developers.google.com/youtube/iframe_api_reference
 */
export interface YouTubePlayer {
    addEventListener(event: string, listener: (event: CustomEvent) => void): void;
    destroy(): void;
    getAvailablePlaybackRates(): readonly number[];
    getAvailableQualityLevels(): readonly string[];
    getCurrentTime(): number;
    getDuration(): number;
    getIframe(): HTMLIFrameElement;
    getOption(module: string, option: string): any;
    getOptions(): string[];
    getOptions(module: string): object;
    setOption(module: string, option: string, value: any): void;
    setOptions(): void;
    cuePlaylist(
        playlist: string | readonly string[],
        index?: number,
        startSeconds?: number,
        suggestedQuality?: string,
    ): void;
    cuePlaylist(playlist: {
        listType: string;
        list?: string | undefined;
        index?: number | undefined;
        startSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    loadPlaylist(
        playlist: string | readonly string[],
        index?: number,
        startSeconds?: number,
        suggestedQuality?: string,
    ): void;
    loadPlaylist(playlist: {
        listType: string;
        list?: string | undefined;
        index?: number | undefined;
        startSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    getPlaylist(): readonly string[];
    getPlaylistIndex(): number;
    getPlaybackQuality(): string;
    getPlaybackRate(): number;
    getPlayerState(): number;
    getVideoEmbedCode(): string;
    getVideoLoadedFraction(): number;
    getVideoUrl(): string;
    getVolume(): number;
    cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    cueVideoById(video: {
        videoId: string;
        startSeconds?: number | undefined;
        endSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    cueVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
    cueVideoByUrl(video: {
        mediaContentUrl: string;
        startSeconds?: number | undefined;
        endSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    loadVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
    loadVideoByUrl(video: {
        mediaContentUrl: string;
        startSeconds?: number | undefined;
        endSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    loadVideoById(video: {
        videoId: string;
        startSeconds?: number | undefined;
        endSeconds?: number | undefined;
        suggestedQuality?: string | undefined;
    }): void;
    isMuted(): boolean;
    mute(): void;
    nextVideo(): void;
    pauseVideo(): void;
    playVideo(): void;
    playVideoAt(index: number): void;
    previousVideo(): void;
    removeEventListener(event: string, listener: (event: CustomEvent) => void): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    setLoop(loopPlaylists: boolean): void;
    setPlaybackQuality(suggestedQuality: string): void;
    setPlaybackRate(suggestedRate: number): void;
    setShuffle(shufflePlaylist: boolean): void;
    // getSize(): PlayerSize;
    setSize(width: number, height: number): object;
    setVolume(volume: number): void;
    stopVideo(): void;
    unMute(): void;
    on(eventType: "stateChange", listener: (event: CustomEvent & { data: number }) => void): void;
    // on(eventType: EventType, listener: (event: CustomEvent) => void): void;
}
