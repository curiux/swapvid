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
    duration?: number;
    isOwner?: boolean;
    url?: string;
    hasRequested?: boolean;
    rating?: {
        value: number;
        count: number;
    }
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
    hasRated?: boolean;
}

export interface Plan {
    _id: string;
    name: string;
    monthlyPrice: number;
    libraryStorage: number;
    librarySize: number;
    videoMaxSize: number;
    exchangeLimit: number;
    stats: boolean;
    exchangePriority: boolean;
    searchPriority: boolean;
    supportPriority: boolean;
}

export interface Notification {
    _id: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
    message: string;
}

export interface UserData {
    email: string;
    username: string;
}