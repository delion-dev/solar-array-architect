# Solar Array Architect: Advanced Modeling Guide
## 고도화 시뮬레이션 및 엔지니어링 가이드

본 문서는 Solar Array Architect에 구현된 세계 수준(World-Class)의 고급 시뮬레이션 기능에 대한 기술적 배경과 사용 방법을 설명합니다.

---

## 1. 정밀 손실 모델링 (Advanced Loss Modeling)

단순한 종합 효율(PR) 입력을 넘어, 물리적 현상에 기반한 세부 손실을 개별적으로 산출합니다.

### 1.1 입사각 수정 계수 (IAM, Incidence Angle Modifier)
태양광 모듈 표면의 유리는 태양의 입사각이 커질수록(태양이 낮게 뜰수록) 반사율이 높아집니다.
- **구현 모델**: Ashrae 모델 기반 보정
- **영향**: 연간 약 1.5% ~ 3.0%의 발전량 감소 요인으로 작용
- **설정**: `EconomicConfig`의 `LossFactors`에서 `iamLoss` 항목으로 조정 가능

### 1.2 지면 반사율 (Albedo) 및 양면 이득 (Bifacial Gain)
양면 모듈(Bifacial Module)의 후면 발전량은 지면의 상태(Albedo)와 설치 높이에 결정적인 영향을 받습니다.
- **Albedo 예시**:
  - 잔디/녹지: 0.25
  - 아스팔트: 0.15
  - 콘크리트: 0.30
  - 눈(Snow): 0.80 (매우 높음)
- **설치 높이**: 높이가 높을수록 지면에서 반사된 빛이 모듈 후면에 도달하는 'View Factor'가 개선되어 이득이 증가합니다.

---

## 2. BESS (Battery Energy Storage System) 통합

태양광 발전과 연계된 배터리 저장 장치의 경제성을 시뮬레이션합니다.

### 2.1 시뮬레이션 로직
- **충전**: 낮 시간(10시~16시)의 잉여 전력을 배터리에 저장
- **방전**: 저녁 시간(18시~22시) 또는 피크 시간대에 방전하여 자가소비율을 높이거나 피크 컷 편익 발생
- **주요 지표**:
  - **DOD (Depth of Discharge)**: 배터리 수명 보호를 위한 실제 사용 가능 용량 비율
  - **Round-trip Efficiency**: 충방전 과정에서의 에너지 변환 효율 (통상 90% 내외)

---

## 3. 글로벌 재무 모델 (Global Financial Modeling)

국내외 다양한 사업 환경에 대응하기 위한 고급 재무 지표를 제공합니다.

### 3.1 PPA (Power Purchase Agreement)
계통 한계 가격(SMP) 변동 리스크를 회피하기 위해 기업과 직접 체결하는 전력판매계약 모델입니다.
- **Escalation**: 매년 계약 단가가 일정 비율로 상승하는 조건을 반영할 수 있습니다.

### 3.2 ITC (Investment Tax Credit)
미국 등 글로벌 시장에서 흔히 사용되는 투자 세액 공제 제도입니다.
- **영향**: 초기 투자비(CAPEX)에서 직접적으로 세액을 공제하여 ROI를 획기적으로 개선합니다.

### 3.3 NPV 및 LCOE
- **NPV (Net Present Value)**: 할인율을 적용하여 미래의 현금흐름을 현재 가치로 환산한 사업의 절대적 가치
- **LCOE (Levelized Cost of Energy)**: 발전소 운영 전 기간 동안 생산된 전력 1kWh당 투입된 총 비용 (발전 원가)

---

## 4. 시각화 도구 (Visualization)

### 4.1 Loss Waterfall Chart
명목 발전량(Nominal)에서 시작하여 각 손실 단계(Soiling, Shading, IAM, Inverter 등)를 거쳐 최종 발전량에 도달하는 과정을 시각적으로 보여줍니다. 이를 통해 어떤 부분에서 가장 큰 손실이 발생하는지 즉각적으로 파악할 수 있습니다.

---

> [!TIP]
> **World-Class 분석을 위한 팁**
> 1. 정확한 위치의 **TMY(Typical Meteorological Year)** 데이터를 업로드하여 시간별 시뮬레이션을 수행하세요.
> 2. 지면 상태에 맞는 **Albedo** 값을 선택하여 양면 모듈의 잠재력을 정확히 평가하세요.
> 3. **민감도 분석**을 통해 SMP 가격 하락 시에도 사업성이 유지되는지 확인하세요.
