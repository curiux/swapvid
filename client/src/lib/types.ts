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