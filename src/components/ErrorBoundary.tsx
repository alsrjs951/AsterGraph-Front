import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="error-page">
        <span className="demo-badge">DEMO · SIMULATED DATA</span>
        <h1>데모 상태를 다시 불러와 주세요.</h1>
        <p>로컬 목업 데이터를 초기화하면 다시 시작할 수 있습니다.</p>
        <button className="button primary" onClick={() => location.reload()}>
          리셋
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
