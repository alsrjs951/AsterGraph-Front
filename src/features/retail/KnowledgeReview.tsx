import { useMemo, useState, useSyncExternalStore } from "react";
import { History, GitCommitHorizontal, UserRound } from "lucide-react";
import { Button, Dialog } from "../../components/ui";
import { dossier, impact } from "./model";
const statuses = ["검토 대기", "검토 중", "검토 완료"] as const;
type Status = (typeof statuses)[number];
type Entry = { status: Status; at: string; note: string; revision: string };
function parse(raw: string): Entry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is Entry =>
        e &&
        statuses.includes(e.status) &&
        typeof e.note === "string" &&
        typeof e.at === "string" &&
        typeof e.revision === "string" &&
        Number.isFinite(Date.parse(e.at)),
    );
  } catch {
    return [];
  }
}
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("retail-review-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("retail-review-change", notify);
  };
}
export function useKnowledgeReview(productId = impact.id) {
  const storageKey = "astergraph-review/product/" + productId;
  const snapshot = () => {
    try {
      return localStorage.getItem(storageKey) ?? "[]";
    } catch {
      return "[]";
    }
  };
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const entries = useMemo(() => parse(raw), [raw]);
  const subject = useMemo(() => {
    const product = dossier.products.rows.find(
      (cells) => cells[0] === productId,
    )!;
    const revisions = dossier.changes.rows
      .map((cells, i) => ({ cells, row: i + 2 }))
      .filter((r) => r.cells[0] === productId)
      .sort((a, b) => a.cells[1].localeCompare(b.cells[1]));
    return { name: product[1], id: productId, revisions };
  }, [productId]);
  const revision =
    subject.revisions.at(-1)?.cells.slice(1).join(" · ") ?? "기준 등록";
  const [error, setError] = useState("");
  const status =
    entries.findLast((entry) => entry.revision === revision)?.status ??
    statuses[0];
  const advance = (note: string) => {
    const latest = parse(snapshot());
    if (
      (latest.findLast((e) => e.revision === revision)?.status ??
        statuses[0]) !== status
    ) {
      setError("검토 상태가 갱신되었습니다. 최신 기록을 확인하세요.");
      return false;
    }
    const next: Status = status === "검토 중" ? "검토 완료" : "검토 중";
    const updated = [
      ...latest,
      {
        status: next,
        at: new Date().toISOString(),
        note: note.trim(),
        revision,
      },
    ];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("retail-review-change"));
      setError("");
      return true;
    } catch {
      setError("이 브라우저에 검토 기록을 저장할 수 없습니다.");
      return false;
    }
  };
  return { subject, entries, status, advance, error };
}
export function ReviewDialog({
  review,
  close,
  initialNote = "",
}: {
  review: ReturnType<typeof useKnowledgeReview>;
  close: () => void;
  initialNote?: string;
}) {
  const [note, setNote] = useState(initialNote);
  return (
    <Dialog title="지식 변경 이력" close={close}>
      <div className="km-review-head">
        <span className="rt-kicker">KNOWLEDGE REGISTER</span>
        <h3>
          {review.subject.name} · {review.subject.id}
        </h3>
        <p>
          <UserRound size={15} /> 구매운영팀 <b>{review.status}</b>
        </p>
      </div>
      <ReviewTimeline review={review} />
      <form
        className="km-review-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (review.advance(note)) setNote("");
        }}
      >
        <label htmlFor="review-note">
          검토 메모 <small>선택</small>
        </label>
        <input
          id="review-note"
          maxLength={240}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="확인한 내용이나 다음 담당자에게 남길 사항"
        />
        <Button variant="primary" type="submit">
          {review.status === "검토 대기"
            ? "검토 시작"
            : review.status === "검토 중"
              ? "검토 완료 기록"
              : "재검토 시작"}
        </Button>
      </form>
      {review.error && <p role="alert">{review.error}</p>}
      <p className="km-local">시연 기록은 현재 브라우저에 저장됩니다.</p>
    </Dialog>
  );
}

export function ReviewStrip({
  handoff = false,
  status,
  open,
}: {
  handoff?: boolean;
  status: Status;
  open: () => void;
}) {
  return (
    <button className="km-strip" onClick={open}>
      <span>
        <GitCommitHorizontal size={18} />
        <strong>{handoff ? "검토 메모 남기기" : "지식 변경 이력"}</strong>
        <small>
          {impact.before.cells[1].slice(5)} 기준 등록 →{" "}
          {impact.latest.cells[1].slice(5)} 변경 반영
        </small>
      </span>
      <span>
        <b>{status}</b>
        <History size={16} />
      </span>
    </button>
  );
}

export function ReviewTimeline({
  review,
}: {
  review: ReturnType<typeof useKnowledgeReview>;
}) {
  return (
    <ol className="km-history">
      {review.subject.revisions.map(({ cells, row }, i) => (
        <li key={row}>
          <span>{cells[1]}</span>
          <strong>
            {i === 0 ? "기준 기록 등록" : "새 기록 반영"} · {cells[2]}
          </strong>
          <small>
            {dossier.changes.file} · {row}행
            {review.subject.id === impact.id &&
              row === impact.latest.row &&
              " / 공급사 공지 1쪽"}
          </small>
        </li>
      ))}
      {review.entries.map((entry, i) => (
        <li key={i}>
          <span>
            {new Date(entry.at).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
              hour12: false,
            })}{" "}
            KST
          </span>
          <strong>{entry.status} · 구매운영팀</strong>
          <small>대상 기록 · {entry.revision}</small>
          {entry.note && <small>{entry.note}</small>}
        </li>
      ))}
    </ol>
  );
}
