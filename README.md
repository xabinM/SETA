# 🌍 SETA (Save the Earth Through AI)  
비용과 지구를 동시에 지키는 GREEN AI 솔루션

---

## 📑 목차
1. [프로젝트 개요](#-프로젝트-개요)  
2. [문제 인식](#-문제-인식)  
3. [프로젝트 미리보기](#-프로젝트-미리보기🧚)  
4. [서비스 소개](#-서비스-소개)  
5. [기술 스택](#-기술-스택)  
6. [아키텍처](#-아키텍처)  
7. [기대 효과](#-기대-효과)  
8. [기술 설명](#-기술-설명)  
9. [산출물](#-산출물)  
10. [설치 및 실행 방법](#-설치-및-실행-방법)  
11. [트러블 슈팅](#-트러블-슈팅)  
12. [팀 소개](#-코사인-팀-소개)  
13. [프로젝트 후기](#-프로젝트-후기)  

---

## 📌 프로젝트 개요
**📆 프로젝트 기간 : 2025.09.01 ~ 2025.09.29**  

AI는 업무 효율화와 가치 창출에 크게 기여하지만 막대한 전력 소모와 CO₂ 배출을 야기하고 있으며,
여러 연구 결과에 따르면 실제 운영 환경에서도 **‘안녕’, ‘고마워’ 같은 불필요한 요청**이 수천만 달러 규모의 비용을 발생시키는 문제로 이어지고 있는 상황입니다.

**SETA**는 이러한 불필요한 AI 호출을 줄여  
👉 **자원·비용 절감 + 환경 보호**라는 두 가지 목표를 동시에 실현하는 **Green AI 솔루션**입니다.  

---

## 📌 문제 인식
- 불필요한 프롬프트로 인한 **자원 낭비**  
- 서버 부하 증가 및 **운영 비용 상승**  
- 하루 기준 낭비량:
  - ⚡ **288 MWh 전력**
  - 🌫 **36톤 CO₂**
  - 🚗 **7,500대 자동차 배출량**
  - 🏠 **3만 가구 전력 사용량**

---

## 📌 서비스 소개

### 🔹 주요 기능
1. **다단계 필터링**
   - 규칙 기반 필터링 → “안녕”, “고마워” 같은 불필요 요청 즉시 차단  
   - 의미 기반 ML 필터링 → 문맥 이해 후 핵심 요청만 추출  
   - ✅ GPU 호출 및 토큰 사용량 절감

2. **실시간 대시보드**
   - 토큰 절감량 추적
   - ESG 지표 (전력·CO₂ 절약량) 시각화
   - 유저별/전체 사용량 분석

3. **유저 플로우**
   - 사용자 입력 → SETA 분석 → 검증된 요청만 LLM 전달 → 실시간 절감 효과 확인

---

## 📌 기술 스택💻

#### 📌 프로그래밍 언어 및 프레임워크
![Java](https://img.shields.io/badge/Java-17-007396?logo=java&logoColor=white&style=flat)  
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.2-green?logo=springboot&logoColor=white&style=flat)  
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat)

#### Big Data / AI
![Kafka](https://img.shields.io/badge/Kafka-3.7-231F20?logo=apachekafka&logoColor=white&style=for-the-badge)  
![Spark](https://img.shields.io/badge/Apache_Spark-Streaming-orange?logo=apachespark&logoColor=white&style=for-the-badge) 
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white&style=for-the-badge)

#### 🎨 UI 스타일링
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white&style=flat)  

#### 🗃️ 데이터/상태 관리
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white&style=flat)  
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis&logoColor=white&style=flat)  

#### 🌐 배포/인프라
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazonaws&logoColor=white&style=flat)  
![Docker](https://img.shields.io/badge/Docker-25-2496ED?logo=docker&logoColor=white&style=flat)  
![Nginx](https://img.shields.io/badge/Nginx-1.18-009639?logo=nginx&logoColor=white&style=flat)   


---

## 📌 아키텍처
- **다단계 필터링 파이프라인**: Kafka → Spark → ML → Spring Boot Gateway  
- **실시간 스트리밍**: SSE(Server-Sent Events) 기반 응답 처리  
- **데이터베이스**: 절감 로그 및 ESG 지표 저장  

<img src="./docs/architecture.png" width="700px">

---

## 📌 기대 효과
- 불필요 요청 차단으로 **운영비 절감**  
- **전력·CO₂ 절약**을 통한 ESG 가치 창출  
- 투명한 모니터링을 통한 **운영 인사이트 제공**  

---

## 📌 기술 설명

### 1. 다단계 필터링 (ML 기반 + 규칙 기반)
- **규칙 기반 필터링**  
  - “안녕”, “고마워” 같은 불필요 요청을 정규식·룰 엔진으로 즉시 차단  
  - GPU 호출을 줄여 비용 절감 효과
- **ML 기반 필터링**  
  - BERT 계열 모델과 유사도 측정을 통한 의미 분석  
  - 문맥 파악이 필요한 요청을 분류해 핵심 요청만 LLM으로 전달  
  - 👉 불필요 토큰 사용량을 획기적으로 절감  

### 2. Kafka 기반 스트리밍 파이프라인
- **Apache Kafka**  
  - 모든 사용자 요청/응답을 토픽 단위로 비동기 처리  
  - 주요 토픽: `chat.raw.request.v1`, `chat.filter.result.v1`, `chat.raw.filtered.v1`, `chat.llm.answer.v1` 
  - 장애 발생 시 **exactly-once consumer** 설정으로 데이터 유실 최소화  
- 결과: **확장성 + 안정성**을 동시에 확보  

### 3. Spark 기반 대규모 데이터 처리
- **Apache Spark Streaming**  
  - Kafka → Spark → PostgreSQL 파이프라인 구성  
  - 초당 수천 건의 요청 로그를 집계하여 **토큰 절감량, CO₂ 절약량** 실시간 계산  
  - Window 연산 기반 집계 (분 단위, 일 단위)로 대시보드에 시각화 

### 4. 실시간 절감량 대시보드
- **SSE(Server-Sent Events)** 기반으로 절감 데이터 실시간 전송  
- **Elasticsearch 집계 쿼리**를 통해 대량 로그 데이터에서 빠르게 지표 산출  
- ESG 지표와 비용 절감 효과를 **한눈에 시각화**  
- 운영자/사용자 모두 투명하게 확인 가능  

### 5. RAG 기반 대화 메모리
- **Retrieval-Augmented Generation (RAG)** 구조 적용  
  - 사용자의 과거 채팅 데이터를 **벡터 임베딩 후 Elasticsearch** 에 저장  
  - 새로운 대화 시, **관련 맥락을 검색하여 프롬프트에 삽입**  
- 결과:  
  - LLM이 이전 대화를 기억하는 듯한 자연스러운 연속 대화 제공  
  - 불필요한 재질문 감소 → **토큰 절감 + UX 개선**  

### 6. Liquid Glass Design (UI/UX)
- 프론트엔드 대시보드 디자인에 **Liquid Glass Design** 적용  
  - 반투명 유리 느낌(Glassmorphism)  
  - ESG 친화적 색감(녹색/청색 계열)으로 환경 메시지 강화  
- 결과: **데이터 신뢰성과 친환경 이미지**를 동시에 강조  

---

## 📌 산출물
- 📄 와이어프레임  
- 📑 API 명세서  
- 🗂 ERD & 기술 아키텍처  
- 📊 번다운 차트 / 발표 자료  

---

## 📌 코사인 팀 소개
SSAFY 13기 · 코사인 팀
- 👩‍💻 김시연 (팀장, FrontEnd)
- 👩‍💻 유지은 (Infra, FrontEnd)
- 👩‍💻 민사빈 (Infra, BackEnd)
- 👩‍💻 김유미 (BackEnd)
- 👨‍💻 한경훈 (Data)
- 👨‍💻 이병헌 (AI)
