import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { BRAND_WORDMARK, BRAND_WORDMARK_VIEWBOX } from "./brandPaths";
export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  children: ReactNode;
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`brand ${large ? "brand-large" : ""}`}
      role="img"
      aria-label="AsterGraph"
    >
      <BrandMark />
      <svg
        className="brand-wordmark"
        viewBox={BRAND_WORDMARK_VIEWBOX}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d={BRAND_WORDMARK} />
      </svg>
    </div>
  );
}
export function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <Button variant="quiet" aria-label="닫기" onClick={close}>
          <X size={20} />
        </Button>
      </div>
      <div className="dialog-body">{children}</div>
      <Button onClick={close}>확인</Button>
    </dialog>
  );
}
export function Assumptions() {
  return (
    <>
      <p>
        부산 물류센터가 48시간 중단되는 가상 시나리오입니다. 주문당 상품
        1개·수량 1, 동일한 납기 판단 구간을 가정합니다.
      </p>
      <p>
        현재 로컬 목업 재고와 주문번호 순 배정으로 계산합니다. 서울 센터가
        배정된 주문을 출고할 수 있다고 가정합니다.
      </p>
      <p>
        실제 운송 시간, 도로 상황, 비용, SLA, 재고 예약과 현실의 출고 우선순위는
        반영하지 않습니다. 시뮬레이션은 실제 주문·재고·배송을 변경하지 않습니다.
      </p>
    </>
  );
}
