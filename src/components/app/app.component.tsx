import { Component, createRef } from "react";
import { createWorker } from "tesseract.js";
import { fetch } from "@tauri-apps/plugin-http";
import { translate } from '@vitalets/google-translate-api';
import { IAppProps, IAppState } from "./app.interface";
import { TranslationLogItem } from "../../types/translation-log-item.type";
import "./app.component.css";


export class App extends Component<IAppProps, IAppState> {

    imgRef = createRef<HTMLDivElement>();
    imgContainerRef = createRef<HTMLDivElement>();

    constructor(props: IAppProps) {
        super(props);
        this.state = {
            screenshotUrl: props?.dataUrl ?? null,
            // displaySize: window.displaySize,
            translationLogs: [],
            selection: null,
            isDragging: false,
            // imagePath: '',
            // selectedImage: null,
        };
    }

    async componentDidMount(): Promise<void> {
        console.log(this.props);

        this.setState({
            screenshotUrl: this.props.dataUrl
        });
    }

    getImageScales = () => {
        const img: any = this.imgRef.current;
        const container = this.imgContainerRef.current;
        if (!img || !container) return { ratioX: 1, ratioY: 1 };

        const ratioX = img.naturalWidth / img.width;
        const ratioY = img.naturalHeight / img.height;
        return { ratioX, ratioY };
    };

    handleMouseDown = (event: any) => {
        if (event.button === 0) {
            const rect = this.imgContainerRef.current!.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.setState({
                isDragging: true
            });
            this.setState({
                selection: { startX: x, startY: y, endX: x, endY: y }
            })
        }
    };

    handleMouseMove = (event: any) => {
        if (!this.state.isDragging) return;
        const rect = this.imgContainerRef.current!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.setState((prev) => ({
            selection: { startX: prev.selection!.startX, startY: prev.selection!.startY, endX: x, endY: y }
        }));
    };

    handleMouseUp = async () => {
        if (!this.state.isDragging || !this.state.selection) return;
        this.setState({
            isDragging: false
        });

        const { startX, startY, endX, endY } = this.state.selection;
        const { ratioX, ratioY } = this.getImageScales();

        // Нормализуем прямоугольник (чтобы start <= end)
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        // Переводим в координаты оригинала
        const originalRect = {
            left: Math.round(left * ratioX),
            top: Math.round(top * ratioY),
            width: Math.round(width * ratioX),
            height: Math.round(height * ratioY),
        };

        const worker = await createWorker('eng');

        const ret = await worker.recognize(this.state.screenshotUrl, {
            rectangle: originalRect
        });

        await worker.terminate();

        //console.log('Origin:', ret.data.text);

        //const response = await window.api.translateText(ret.data.text);

        //console.log('Translation:', response.data.translation);

        const translationItemLog: TranslationLogItem = {
            id: this.state.translationLogs.length + 1,
            originText: ret.data.text,
            translationText: null
        };

        this.setState((prev) => ({
            translationLogs: [...prev.translationLogs, translationItemLog]
        }));

        // const resp = await window.api.drawBlock(this.state.imagePath, {
        //     x: originalRect.left, y: originalRect.top, width: originalRect.width, height: originalRect.height
        // });
    };

    newTranslateText = async (textToTranslate: string, sourceLang = 'auto', targetLang = 'ru') => {
        const baseUrl = 'https://translate.googleapis.com/translate_a/single';

        const params = new URLSearchParams({
            client: 'gtx',
            sl: sourceLang,
            tl: targetLang,
            dt: 't',
            dj: '1', // ВАЖНО: заставляет Google вернуть стандартный JSON, а не сложный массив
            q: textToTranslate
        });

        const url = `${baseUrl}?${params.toString()}`;

        try {
            const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            });

            // Если Google всё же вернул ошибку, мы увидим её статус, а не упадём на парсинге JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ответ сервера Google:", errorText);
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            
            // Благодаря параметру dj=1 структура ответа становится очень простой
            if (data && data.sentences) {
            const translatedText = data.sentences
                .map(sentence => sentence.trans)
                .join('');
                
            console.log('Результат перевода:', translatedText);
            return translatedText;
            } else {
            throw new Error("Неверная структура JSON в ответе");
            }

        } catch (error) {
            console.error('Не удалось выполнить перевод:', error);
        }
    }

    // translateText = async (textForTranslate: string, translationOnLanguage: string = 'ru') => {
    //     // return invoke('translate_text_new', { originalText: textForTranslate, sourceLanguage: "en", targetLanguage: "ru" });
    //     return translate(textForTranslate, { to: translationOnLanguage });
    //     const url = 'https://translate.api.cloud.yandex.net/translate/v2/translate';

    //     const body = {
    //         folderId: this.YANDEX_FOLDER_ID,
    //         texts: [textForTranslate],
    //         targetLanguageCode: translationOnLanguage,
    //         format: 'PLAIN_TEXT',
    //     };

    //     try {
    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Api-Key ${this.YANDEX_API_KEY}`
    //             },
    //             body: JSON.stringify(body)
    //         });

    //         if (!response.ok) {
    //             const errorBody = await response.text();
    //             throw new Error(`Error: ${response.status} - ${errorBody}`);
    //         }

    //         return await response.json();

    //         // console.log(response);
    //         // const data = response;
    //     }
    //     catch (error) {
    //         throw error;
    //     }
    // }

    translateLogItem = async (logItemId: number, originText: string) => {
        const translatedText = await this.newTranslateText(originText);
        console.log(1111, translatedText);

        if (translatedText) {
            this.setState((prev) => ({
                translationLogs: [...prev.translationLogs.map(el => {
                    if (el.id === logItemId) { el.translationText = translatedText }
                    return el;
                })]
            }));
        }
    }

    copyText = async (text: string) => {
        await navigator.clipboard.writeText(text);
    }

    render() {
        // width: '1920px', //`${this.state.displaySize.width}px`,
        //                 height: '1080px', //`${this.state.displaySize.height}px`,

        return (<>
            <div className="block-container">
                <div className="screenshot-container styled-scrollbar">
                    <div ref={this.imgContainerRef} style={{
                            backgroundImage: this.state.screenshotUrl ? `url(${this.state.screenshotUrl})` : 'none',
                            width: '1920px', 
                            height: '1080px',
                            backgroundRepeat: 'no-repeat',
                            cursor: 'crosshair'
                            // backgroundSize: 'contain',
                            // backgroundPosition: 'center',
                        }}
                        onMouseDown={this.handleMouseDown}
                        onMouseMove={this.handleMouseMove}
                        onMouseUp={this.handleMouseUp}
                        >
                        {this.state.selection && (
                            <div className="selection-square"
                                style={{
                                    top: Math.min(this.state.selection.startY, this.state.selection.endY),
                                    left: Math.min(this.state.selection.startX, this.state.selection.endX),
                                    width: Math.abs(this.state.selection.endX - this.state.selection.startX),
                                    height: Math.abs(this.state.selection.endY - this.state.selection.startY),
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
            <div className="block-container translate-log-container styled-scrollbar">
                <button className="button-base">Test button</button>
                {
                    this.state.translationLogs.map((el, idx) => {
                        return (<div key={idx} className="block-container translate-log-item">
                            <div className="translate-log-item-data-container">
                                <div className="translate-log-item-title-block">
                                    <span>Оригинал</span>
                                    <button className="styled-btn" onClick={() => this.copyText(el.originText)}>Copy</button>
                                </div>
                                <div>{el.originText}</div>
                            </div>
                            { el?.translationText ? <div className="translate-log-item-data-container">
                                <span className="translate-log-item-title-block">Перевод</span>
                                <div>{el.translationText}</div>
                            </div> : <button onClick={() => this.translateLogItem(el.id, el.originText)}>Translate</button>}
                        </div>);
                    })
                }
            </div>
        </>);
    }
}
