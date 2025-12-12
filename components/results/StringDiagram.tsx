
import React from 'react';
import { SystemConfig } from '../../types';

interface StringDiagramProps {
  seriesCount: number; // 직렬 모듈 수
  moduleModel: string; // 모듈 모델명
  inverterModel: string; // 인버터 모델명
  config?: SystemConfig; // 시스템 설정
  inverterCount?: number; // 인버터 수량
  dcVoltsMin?: number; // DC 최소 전압 (여름)
  dcVoltsMax?: number; // DC 최대 전압 (겨울)
  acVolts?: number; // AC 출력 전압
  isReport?: boolean; // 리포트 모드 여부
}

/**
 * 텍스트 겹침 방지용 헬퍼 컴포넌트 (Extracted for Performance)
 * 텍스트 뒤에 반투명한 흰색 배경을 깔아서 가독성 확보
 */
const TextWithBg = ({ x, y, text, fontSize = 10, color = "#475569", fontWeight = "normal", bgWidth = 0 }: any) => {
  // 배경 너비 자동 계산 (폰트 크기 기반)
  const w = bgWidth || text.length * (fontSize * 0.6) + 10;
  return (
    <g>
      <rect x={x - w/2} y={y - fontSize/1.5} width={w} height={fontSize + 4} fill="white" opacity="1" />
      <text x={x} y={y} textAnchor="middle" fontSize={fontSize} fill={color} fontWeight={fontWeight} dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
};

/**
 * 태양광 전체 시스템 결선도 (Single Line Diagram) 시각화 컴포넌트
 * SVG를 사용하여 모듈 어레이 -> DC 케이블 -> 인버터 -> AC 케이블 -> 수배전반 -> 한전 계통 흐름을 그림.
 */
export const StringDiagram: React.FC<StringDiagramProps> = ({ 
  seriesCount, 
  moduleModel, 
  inverterModel,
  config,
  inverterCount = 1,
  dcVoltsMin = 0,
  dcVoltsMax = 0,
  acVolts = 380,
  isReport = false
}) => {
  // SVG 캔버스 설정
  // 리포트 모드일 경우 높이를 약간 줄이고, 배경/테두리를 제거함
  const width = 1250; // 전체 너비 확장 (Grid 이동 대응)
  const height = 350; // 전체 높이
  
  // 레이아웃 좌표 상수
  const startX = 50; // 시작 X 좌표
  const startY = 120; // 시작 Y 좌표
  
  // 모듈 그리기 치수
  const moduleWidth = 50;
  const moduleHeight = 35;
  const gap = 15;
  
  // 모듈을 너무 많이 그리면 화면을 벗어나므로 최대 그리기 개수 제한
  const maxDraw = 6;
  const isTruncated = seriesCount > maxDraw;
  const drawCount = isTruncated ? maxDraw : seriesCount;
  
  // 계산된 위치 좌표들
  const arrayWidth = drawCount * (moduleWidth + gap);
  const arrayEndX = startX + arrayWidth;
  
  const inverterX = arrayEndX + 180; // DC 케이블 정보 공간 확보
  
  // 인버터 크기 확장 (텍스트 겹침 방지 및 여유 공간 확보)
  const inverterW = 160;
  const inverterH = 190; // 높이 증가
  const inverterY = startY - (inverterH - moduleHeight) / 2; // 모듈과 수직 중앙 정렬
  
  // DC 터미널 연결 Y좌표 (인버터 내부 위치)
  const dcTermTopY = 30;
  const dcTermBottomY = inverterH - 60; // 하단 여유 공간 확보를 위해 위로 올림

  const switchgearX = inverterX + inverterW + 200; // AC 케이블 정보 공간 확보
  
  // 수배전반(Switchgear) 좌표
  const switchgearY = inverterY - 10; 
  const switchgearH = 200;

  // Grid 위치: 수배전반 오른쪽으로 이동
  const gridX = switchgearX + 180;
  const gridGroupY = switchgearY + 20; // 수배전반 상단과 비슷하게 정렬

  return (
    <div className={`w-full ${isReport ? '' : 'overflow-x-auto bg-slate-50 rounded-lg border border-slate-200 p-4'}`}>
      {!isReport && <h4 className="text-sm font-bold text-slate-700 mb-4 text-center">전체 시스템 결선도 (Single Line Diagram)</h4>}
      <div className={`flex justify-center ${isReport ? 'w-full' : 'min-w-[1000px]'}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
             <marker id="arrowhead-dark" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#334155" />
            </marker>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
            </pattern>
          </defs>

          {/* 배경 격자 (Grid) - 리포트에서는 제외 */}
          {!isReport && <rect width={width} height={height} fill="url(#gridPattern)" opacity="0.4" />}

          {/* =================================================================================
              1. 태양광 어레이 섹션 (Solar Array)
             ================================================================================= */}
          <g id="modules">
            {/* 점선 박스 (어레이 그룹 표시) */}
            <rect 
              x={startX - 20} 
              y={startY - 40} 
              width={arrayWidth + 30} 
              height={moduleHeight + 110} 
              rx="4" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" 
            />
            <TextWithBg x={startX + arrayWidth/2} y={startY - 40} text="PV String" fontSize={11} fontWeight="bold" color="#64748b" />
            
            {/* 개별 모듈 그리기 루프 */}
            {Array.from({ length: drawCount }).map((_, i) => {
              const x = startX + i * (moduleWidth + gap);
              const isEllipsis = isTruncated && i === 3;
              const labelIndex = (isTruncated && i > 3) ? seriesCount - (drawCount - i) + 1 : i + 1;

              if (isEllipsis) {
                 return <text key={i} x={x + 10} y={startY + moduleHeight / 2 + 5} className="text-xl font-bold fill-slate-400">...</text>;
              }

              return (
                <g key={i}>
                  <rect x={x} y={startY} width={moduleWidth} height={moduleHeight} rx="1" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                  {/* 버스바 (Busbars) 표현 */}
                  <path d={`M ${x+12} ${startY} v ${moduleHeight} M ${x+25} ${startY} v ${moduleHeight} M ${x+38} ${startY} v ${moduleHeight}`} stroke="#bae6fd" strokeWidth="1" />
                  <text x={x + moduleWidth/2} y={startY + moduleHeight + 15} textAnchor="middle" fontSize="9" fill="#64748b">#{labelIndex}</text>
                  
                  {/* 직렬 연결선 (Series Connection - Red) */}
                  {i < drawCount - 1 && !(isTruncated && i === 2) && (
                     <line x1={x + moduleWidth} y1={startY + moduleHeight/2} x2={x + moduleWidth + gap} y2={startY + moduleHeight/2} stroke="#ef4444" strokeWidth="1.5" />
                  )}
                  {isTruncated && i === 2 && <line x1={x + moduleWidth} y1={startY + moduleHeight/2} x2={x + moduleWidth + gap/2} y2={startY + moduleHeight/2} stroke="#ef4444" strokeWidth="1.5" />}
                  {isTruncated && i === 4 && <line x1={x - gap/2} y1={startY + moduleHeight/2} x2={x} y2={startY + moduleHeight/2} stroke="#ef4444" strokeWidth="1.5" />}
                </g>
              );
            })}
            
            {/* 어레이 정보 텍스트 */}
            <text x={startX + arrayWidth/2} y={startY + moduleHeight + 45} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
               {seriesCount} Modules Series
            </text>
            <text x={startX + arrayWidth/2} y={startY + moduleHeight + 60} textAnchor="middle" fontSize="9" fill="#64748b">
               {moduleModel}
            </text>
          </g>


          {/* =================================================================================
              2. DC 케이블 섹션 (Array -> Inverter)
             ================================================================================= */}
          <g id="dc-cables">
            {/* 양극 (+) Red Line (Dashed) */}
            {/* Connect to new dcTermTopY */}
            <path 
              d={`M ${startX + moduleWidth/2} ${startY} V ${inverterY + dcTermTopY} H ${inverterX - 5}`} 
              fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrowhead-red)"
            />
            <TextWithBg x={inverterX - 80} y={inverterY + dcTermTopY - 10} text="(+) DC" fontSize={10} color="#ef4444" fontWeight="bold" />

            {/* 음극 (-) Blue Line (Dashed) */}
            {/* Connect to new dcTermBottomY */}
            <path 
              d={`M ${arrayEndX - gap - moduleWidth/2} ${startY + moduleHeight} V ${inverterY + dcTermBottomY} H ${inverterX - 5}`} 
              fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrowhead-blue)"
            />
            <TextWithBg x={inverterX - 80} y={inverterY + dcTermBottomY + 10} text="(-) DC" fontSize={10} color="#3b82f6" fontWeight="bold" />

            {/* 케이블 스펙 및 전압 정보 말풍선 */}
            <g transform={`translate(${inverterX - 120}, ${startY + 15})`}>
               <line x1="0" y1="0" x2="0" y2="20" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
               <rect x="-60" y="-10" width="120" height="40" rx="4" fill="white" stroke="#94a3b8" strokeWidth="1" />
               
               <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">DC {dcVoltsMin.toFixed(0)}V ~ {dcVoltsMax.toFixed(0)}V</text>
               {config && (
                 <text x="0" y="20" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                   F-CV {config.cableCrossSection}mm² ({config.cableLength}m)
                 </text>
               )}
            </g>
          </g>


          {/* =================================================================================
              3. 인버터 섹션 (Inverter)
             ================================================================================= */}
          <g id="inverter" transform={`translate(${inverterX}, ${inverterY})`}>
             {/* 외함 박스 (Size Increased to 160x190) */}
             <rect width={inverterW} height={inverterH} rx="2" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
             
             {/* 내부 심볼 (DC/AC 변환 기호) - Centered */}
             <g transform={`translate(30, ${inverterH/2 - 25})`}>
               <rect x="0" y="0" width={inverterW-60} height={50} fill="none" stroke="#e2e8f0" strokeWidth="1" />
               <line x1="0" y1="0" x2={inverterW-60} y2={50} stroke="#e2e8f0" strokeWidth="1" />
               <line x1="0" y1="50" x2={inverterW-60} y2="0" stroke="#e2e8f0" strokeWidth="1" />
               
               {/* DC/AC 텍스트 */}
               <rect x={(inverterW-60)/2 - 25} y="18" width="50" height="15" rx="3" fill="white" stroke="#94a3b8" />
               <text x={(inverterW-60)/2} y="26" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155" dominantBaseline="middle">DC / AC</text>
             </g>

             {/* 연결 포인트 (Dots) - Adjusted Y positions */}
             <circle cx="0" cy={dcTermTopY} r="3" fill="#ef4444" stroke="white" strokeWidth="1" />
             <circle cx="0" cy={dcTermBottomY} r="3" fill="#3b82f6" stroke="white" strokeWidth="1" />
             <circle cx={inverterW} cy={inverterH/2} r="3" fill="#334155" stroke="white" strokeWidth="1" />

             {/* 명확한 입력/출력 라벨 */}
             <text x="-8" y={dcTermTopY - 15} textAnchor="end" fontSize="10" fontWeight="bold" fill="#334155">DC Input</text>
             <text x={inverterW + 8} y={inverterH/2 - 8} textAnchor="start" fontSize="10" fontWeight="bold" fill="#334155">AC Output</text>

             {/* 터미널 상세 라벨 - 겹침 방지 */}
             <text x="10" y={dcTermTopY} textAnchor="start" fontSize="9" fill="#ef4444" dominantBaseline="middle" fontWeight="bold">(+) Terminal</text>
             <text x="10" y={dcTermBottomY} textAnchor="start" fontSize="9" fill="#3b82f6" dominantBaseline="middle" fontWeight="bold">(-) Terminal</text>
             
             {/* 모델 정보 - 아래쪽으로 이동 (겹침 해결) */}
             <g transform={`translate(${inverterW/2}, ${inverterH - 30})`}>
               <text x="0" y="0" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">
                 {inverterCount} x Inverter
               </text>
               <text x="0" y="12" textAnchor="middle" fontSize="8" fill="#64748b">
                 {inverterModel}
               </text>
             </g>
          </g>


          {/* =================================================================================
              4. AC 케이블 섹션 (Inverter -> Switchgear)
             ================================================================================= */}
          <g id="ac-cables">
             <line 
               x1={inverterX + inverterW} y1={inverterY + inverterH/2} 
               x2={switchgearX - 5} y2={inverterY + inverterH/2} 
               stroke="#334155" strokeWidth="2.5" markerEnd="url(#arrowhead-dark)"
             />
             
             {/* AC 정보 말풍선 */}
             <g transform={`translate(${inverterX + inverterW + 90}, ${inverterY + inverterH/2})`}>
                <TextWithBg x={0} y={-10} text={`AC ${acVolts}V (3P4W)`} fontSize={11} fontWeight="bold" color="#334155" bgWidth={100} />
                <TextWithBg x={0} y={10} text="TFR-CV Cable" fontSize={9} color="#64748b" bgWidth={80} />
             </g>
          </g>


          {/* =================================================================================
              5. 수배전반 섹션 (Switchgear / MDB) + 변압기 (TR)
             ================================================================================= */}
          <g id="switchgear" transform={`translate(${switchgearX}, ${switchgearY})`}>
            {/* Main Panel Box */}
            <rect width="100" height={switchgearH} rx="2" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
            
            {/* Title */}
            <text x="50" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">MDB</text>
            <text x="50" y="27" textAnchor="middle" fontSize="8" fill="#64748b">LV Panel</text>

            {/* Main Busbar */}
            <line x1="60" y1="40" x2="60" y2="130" stroke="#334155" strokeWidth="4" />
            
            {/* Incoming from Inverter */}
            <circle cx="0" cy={(inverterY + inverterH/2) - switchgearY} r="3" fill="#334155" />
            <line x1="0" y1={(inverterY + inverterH/2) - switchgearY} x2="20" y2={(inverterY + inverterH/2) - switchgearY} stroke="#334155" strokeWidth="2" />
            
            {/* MCCB */}
            <g transform={`translate(20, ${(inverterY + inverterH/2) - switchgearY - 15})`}>
                <rect x="0" y="0" width="20" height="30" fill="white" stroke="#64748b" strokeWidth="1.5" />
                <path d="M 10 30 L 10 50" stroke="#64748b" strokeWidth="1.5" />
                <line x1="5" y1="5" x2="15" y2="25" stroke="#64748b" strokeWidth="1" />
                <line x1="15" y1="5" x2="5" y2="25" stroke="#64748b" strokeWidth="1" />
                <text x="10" y="-5" textAnchor="middle" fontSize="8" fill="#64748b">MCCB</text>
            </g>

            {/* Connection to Busbar */}
            <line x1="40" y1={(inverterY + inverterH/2) - switchgearY} x2="60" y2={(inverterY + inverterH/2) - switchgearY} stroke="#334155" strokeWidth="2" />
            <circle cx="60" cy={(inverterY + inverterH/2) - switchgearY} r="2.5" fill="black" />

            {/* --- Transformer (TR) Inside Switchgear --- */}
            <line x1="60" y1="130" x2="60" y2="145" stroke="#334155" strokeWidth="2" />
            
            {/* TR Symbols */}
            <circle cx="60" cy="155" r="10" fill="white" stroke="#334155" strokeWidth="1.5" />
            <circle cx="60" cy="170" r="10" fill="none" stroke="#334155" strokeWidth="1.5" />
            
            <text x="75" y="155" fontSize="9" fontWeight="bold" fill="#64748b" dominantBaseline="middle">TR</text>
            <text x="75" y="170" fontSize="8" fill="#64748b" dominantBaseline="middle">Step-up</text>
          </g>

          {/* =================================================================================
              6. 계통 연계 (Grid Connection)
             ================================================================================= */}
          
          <g id="grid" transform={`translate(${gridX}, ${gridGroupY})`}>
             {/* 
                 Connection Line from Switchgear(TR) to Grid (moved to right)
                 Calculate Absolute Positions
             */}
             {/* TR exit absolute: X = switchgearX + 60, Y = switchgearY + 180 (bottom of circle + margin) */}
             {/* Grid entry absolute: X = gridX - 30 (left of circle), Y = gridGroupY + 20 (middle) */}
             
             {/* Path: From TR -> Down -> Right -> Up -> Grid Left */}
             
             <path 
               d={`M ${switchgearX + 60 - gridX} ${switchgearY + 180 - gridGroupY} 
                   V ${switchgearY + 190 - gridGroupY}
                   H -40
                   V 20
                   H -25`} 
               fill="none" 
               stroke="#334155" 
               strokeWidth="2" 
               strokeDasharray="4,3" 
               markerEnd="url(#arrowhead-dark)"
             />
             
             {/* High Voltage Label on the line */}
             <TextWithBg x={-40} y={100} text="High Voltage (22.9kV)" fontSize={9} color="#ef4444" bgWidth={100} />

             {/* Grid Symbol */}
             <circle cx="20" cy="20" r="22" fill="white" stroke="#334155" strokeWidth="2" />
             <path d="M 10 20 Q 15 8 20 20 T 30 20" fill="none" stroke="#334155" strokeWidth="2" />
             
             <text x="20" y="60" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">KEPCO</text>
             <text x="20" y="72" textAnchor="middle" fontSize="9" fill="#64748b">22.9kV Grid</text>
          </g>

        </svg>
      </div>
    </div>
  );
};
