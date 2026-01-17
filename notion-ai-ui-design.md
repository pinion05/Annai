# Annai UI/UX 디자인 문서

## 개요

본 문서는 Annai의 클라이언트 UI/UX 요소(채팅창, 플로팅 버튼 등)에 대한 계획을 문서화한것입니다.

---

## 1. Annai 네이티브 UI

### 1.1 플로팅 위젯 (Floating Widget)
사용할 이미지 = ![alt text](../public/icon/Annai.png)
| 속성 | 설명 |
|------|------|
| **위치** | 화면 하단 우측 (bottom right corner) |
| **기능** | Annai AI 기능에 빠른 액세스 제공 |
| **특징** | 메인 인터페이스를 방해하지 않고 필수 기능을 손쉽게 사용 가능 |

### 1.2 Annai Agent 기능

- AI가 단순히 아이디어 생성만 하는 것이 아니라 편집, 액션 수행까지 처리
- 채팅 인터페이스를 통해 컨텍스트 인식 대화 가능
- 워크스페이스 전체 데이터를 이해하고 활용

---

## 2. 플로팅 챗봇 버튼 UI/UX 패턴

### 2.1 버튼 디자인 요소

| 요소 | 일반적 패턴 |
|------|-----------|
| **형태** | 원형 아이콘 버튼 |
| **아이콘** | 채팅 말풍선, AI 로봇 아이콘, 브랜드 로고 |
| **위치** | 화면 하단 우측 고정 (fixed position) |
| **애니메이션** | 호버 시 확대, 클릭 시 채팅창 전개 |
| **색상** | 브랜드 색상 또는 대비색으로 눈에 띄게 |

### 2.2 채팅창 형태

- 플로팅 버튼 클릭 시 팝업 형태의 채팅창이 열림
- 최소화/최대화 가능
- 드래그로 위치 조절 가능한 옵션
- 메인 인터페이스 위에 오버레이 형태로 표시


## 4. UI/UX 설계 원칙

### 4.1 접근성 (Accessibility)
- 항상 화면에 표시되어 빠른 접근 가능
- 키보드 네비게이션 지원
- 명확한 포커스 상태 표시

### 4.2 비침입성 (Non-intrusive)
- 메인 콘텐츠를 가리지 않음
- 필요할 때만 채팅창 확장
- 최소화 시 작은 아이콘만 표시

### 4.3 반응형 (Responsive)
- 모바일/태블릿/데스크톱 모두 지원
- 화면 크기에 따라 위치 및 크기 조정

---

## 5. 참고 자료

- [Annai AI Features Guide](https://matthiasfrank.de/en/Annai-features/Annai-ai/)
- [Everything you can do with Annai AI](https://www.Annai.com/help/guides/everything-you-can-do-with-Annai-ai)
- [Common Ninja Annai AI Chatbot Widget](https://www.commoninja.com/widgets/ai-chatbot/Annai)
- [ChatBotKit Widget Integration](https://chatbotkit.com/tutorials/how-to-embed-chatbotkit-widget-inside-Annai)
- [DocsBot Embeddable Widget](https://docsbot.ai/documentation/developer/embeddable-chat-widget)
- [AI Floating Widget UI Kit](https://blazor.syncfusion.com/essential-ui-kit/blocks/ai-floating-widget)
- [Dribbble Chatbot Designs](https://dribbble.com/search/chatbot-floating-button)

---

*문서 생성일: 2025-01-17*
