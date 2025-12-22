import { TMYData } from '../../types';

/**
 * [유틸리티: 텍스트 파일 읽기]
 * 브라우저의 File API를 사용하여 로컬 파일을 텍스트 문자열로 읽어옵니다.
 * @param file 읽어올 파일 객체
 * @returns 파일 내용 문자열을 담은 Promise
 */
export const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

/**
 * [TMY CSV 파싱 함수]
 * 기상청 등에서 제공하는 TMY(Typical Meteorological Year) 형식의 CSV 데이터를 파싱합니다.
 * 한국어 헤더(년, 월, 일, 시간, 풍속, 전일사량 등)를 인식하여 데이터를 추출합니다.
 * @param csvText CSV 원문 텍스트
 * @returns 파싱된 TMY 데이터 배열
 */
export const parseTMYCSV = (csvText: string): TMYData[] => {
    // 줄바꿈 처리 및 빈 줄 제거
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const data: TMYData[] = [];

    if (lines.length === 0) return [];

    let headerIndex = -1;
    let headers: string[] = [];
    let delimiter = ',';

    // 헤더 행 찾기 (상위 50줄 내에서 검색 - 메타데이터가 많을 수 있음)
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const line = lines[i];
        // 쉼표 또는 세미콜론 구분자 감지
        const currentDelimiter = line.includes(';') ? ';' : ',';
        const parts = line.split(currentDelimiter).map(h => h.trim());

        // 필수 키워드 포함 여부 확인 (한국어/영어 지원)
        const hasTime = parts.some(p => p.includes('시간') || p.toLowerCase().includes('hour') || p.toLowerCase().includes('time'));
        const hasGHI = parts.some(p => p.includes('일사량') || p.toLowerCase().includes('ghi') || p.toLowerCase().includes('irradiance'));

        if (hasTime && hasGHI) {
            headerIndex = i;
            headers = parts;
            delimiter = currentDelimiter;
            break;
        }
    }

    if (headerIndex === -1) {
        console.error("CSV 헤더를 찾을 수 없습니다.");
        return [];
    }

    // 각 컬럼의 인덱스 확인 (유연한 매칭)
    const findIdx = (keywords: string[]) => headers.findIndex(h =>
        keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))
    );

    const idxYear = findIdx(['년', 'year']);
    const idxMonth = findIdx(['월', 'month']);
    const idxDay = findIdx(['일', 'day']);
    const idxHour = findIdx(['시간', 'hour', 'time']);
    const idxWind = headers.findIndex(h => (h.includes('풍속') || h.toLowerCase().includes('wind')) && !h.includes('불확도'));
    const idxGHI = headers.findIndex(h => (h.includes('일사량') || h.toLowerCase().includes('ghi')) && !h.includes('불확도'));

    const idxWindUnc = headers.findIndex(h => (h.includes('풍속') || h.toLowerCase().includes('wind')) && h.includes('불확도'));
    const idxGHIUnc = headers.findIndex(h => (h.includes('일사량') || h.toLowerCase().includes('ghi')) && h.includes('불확도'));

    // 필수 컬럼 존재 여부 체크 (월, 시간, 일사량은 필수)
    if (idxMonth < 0 || idxHour < 0 || idxGHI < 0) {
        console.error("CSV 필수 컬럼 누락 (월, 시간, 일사량 중 일부가 없습니다)");
        return [];
    }

    // 데이터 행 파싱
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        if (cols.length < headers.length) continue;

        const tmy: TMYData = {
            year: idxYear > -1 ? parseInt(cols[idxYear]) || 0 : 0,
            month: parseInt(cols[idxMonth]) || 0,
            day: idxDay > -1 ? parseInt(cols[idxDay]) || 0 : 0,
            hour: parseInt(cols[idxHour]) || 0,
            windSpeed: idxWind > -1 ? parseFloat(cols[idxWind]) || 0 : 0,
            windSpeedUncertainty: idxWindUnc > -1 ? parseFloat(cols[idxWindUnc]) || 0 : 0,
            ghi: parseFloat(cols[idxGHI]) || 0,
            ghiUncertainty: idxGHIUnc > -1 ? parseFloat(cols[idxGHIUnc]) || 0 : 0
        };

        // 유효한 월 데이터만 추가
        if (tmy.month >= 1 && tmy.month <= 12) {
            data.push(tmy);
        }
    }

    return data;
};
