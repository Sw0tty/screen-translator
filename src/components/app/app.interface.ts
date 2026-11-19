import { SelectionSquare } from "../../types/selected-square.type";
import { TranslationLogItem } from "../../types/translation-log-item.type";


export interface IAppProps {
    dataUrl: string;
}

export interface IAppState {
    isDragging: boolean;
    translationLogs: TranslationLogItem[];
    selection: SelectionSquare | null;
    screenshotUrl: string | null;
}
