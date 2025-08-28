declare module 'marked' {
    interface MarkedOptions {
        gfm?: boolean;
        breaks?: boolean;
        pedantic?: boolean;
        smartLists?: boolean;
        smartypants?: boolean;
        xhtml?: boolean;
        baseUrl?: string;
        headerIds?: boolean;
        headerPrefix?: string;
        mangle?: boolean;
        sanitize?: boolean;
        silent?: boolean;
        highlight?: (code: string, lang: string, callback?: (error: any, code: string) => void) => string | void;
        langPrefix?: string;
        smartLists?: boolean;
        smartypants?: boolean;
        tables?: boolean;
        xhtml?: boolean;
    }

    interface MarkedStatic {
        (src: string, options?: MarkedOptions, callback?: (error: any, parseResult: string) => void): string | Promise<string>;
        setOptions(options: MarkedOptions): void;
        parse: (src: string, options?: MarkedOptions, callback?: (error: any, parseResult: string) => void) => string | Promise<string>;
        parseInline: (src: string, options?: MarkedOptions) => string;
        options: MarkedOptions;
        defaults: MarkedOptions;
        use: (extension: any) => void;
    }

    const marked: MarkedStatic;
    export default marked;
    export { marked };
}
