interface SearchResultSchema {
    content: string;
    is_functional: boolean;
    snippet: {
        header: string;
        version: string;
        subheader: string;
        pagination: string;
        type: string;
        content: string;
        [k: string]: unknown;
    };
    id: number;
    pagination?: unknown;
    slide_content_id: number;
    context: {
        lesson: {
            id: number;
            name: string;
            [k: string]: unknown;
        };
        screen: {
            id: number;
            [k: string]: unknown;
        };
        section: {
            name: string;
            [k: string]: unknown;
        };
        slideshow: {
            background_url: string;
            width: number;
            height: number;
            order_number: number;
            [k: string]: unknown;
        };
        [k: string]: unknown;
    };
    scout_metadata: {
        highlight: {
            "snippet.content": string[];
            "snippet.subheader": string[];
            "snippet.header": string[];
        };
        [k: string]: unknown;
    };
    slideshows: {
        [k: string]: unknown;
    }[];
    [k: string]: unknown;
}

interface SearchResults {
    [k: string]: SearchResultSchema
}

interface ParsedSearchResult {
    highlight: SearchResultSchema["scout_metadata"]["highlight"],
    details: SearchResultSchema["snippet"],
    context: SearchResultSchema["context"],
    /** used for dynamic links */
    id: SearchResultSchema["id"]
}

interface SlideshowChapterMetadata {
    href?: string,
    name?: string,
    chapterLength?: number,
    startPage?: number
}