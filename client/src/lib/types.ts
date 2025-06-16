export interface Video {
    _id: string;
    title: string;
    description: string;
    category: string;
    keywords: string[];
    isSensitiveContent: boolean;
    uploadedDate: Date;
    thumbnail: string;
    user: string;
    isOwner?: boolean;
    url?: string;
    hasRequested?: boolean;
}

export interface Exchange {
    _id: string;
    initiator: string;
    responder: string;
    initiatorVideo?: string;
    responderVideo?: string;
    status: string;
    requestedDate?: Date;
    user?: string;
    initiatorVideoUrl?: string;
    responderVideoUrl?: string;
}