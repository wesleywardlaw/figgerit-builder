import { MatchResult } from "./matchresult";

export interface Figgerit {
    saying: {
        text: string;
        _id: string;
    };
    matches: MatchResult[];
}