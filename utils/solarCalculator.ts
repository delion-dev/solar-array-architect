/**
 * Solar Calculator Utilities (Facade)
 * 
 * [주요 역할]
 * 이 파일은 시스템 전반에서 사용되는 태양광 계산 로직의 통합 인터페이스(Facade) 역할을 합니다.
 * 
 * [구조적 특징]
 * Clean Architecture 및 SOLID 원칙을 준수하기 위해, 거대했던 단일 파일을 
 * 기능별 전문 모듈(Engineering, Economics, Parsers, Constants)로 분리하였습니다.
 * 외부 컴포넌트들은 이 파일을 통해 필요한 모든 계산 함수에 접근할 수 있습니다.
 */

export * from './solar/engineering'; // 설계 및 기술 검토 관련 로직
export * from './solar/economics';   // 경제성 분석 및 수익성 시뮬레이션
export * from './solar/parsers';     // 외부 데이터(TMY 등) 파싱 유틸리티
export * from './solar/constants';   // 물리/경제적 상수 정의
