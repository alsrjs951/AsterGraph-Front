import { useState } from "react";
import { Dialog } from "../../components/ui";
import { batch, exception, rowCitation } from "./batch";
import { dossier, type Citation } from "../retail/model";
export function BatchLedger({
  corrected,
  openSource,
  close,
}: {
  corrected: boolean;
  openSource: (citation: Citation) => void;
  close: () => void;
}) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const needle = term.trim().toLowerCase();
  const matches = batch.links.filter(
    (link) =>
      (!exceptionsOnly || !link.valid) &&
      [
        link.from,
        link.to,
        link.expected,
        batch.entities.get(link.from)?.label,
        batch.entities.get(link.expected)?.label,
        dossier[link.source].file,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
  );
  const size = 5;
  return (
    <Dialog title="관계별 원본 대조 내역" close={close}>
      <p>
        두 개체의 ID와 원본 행의 연결값을 대조했습니다. 각 항목을 누르면 근거
        행이 열립니다.
      </p>
      <div className="batch-ledger-tools">
        <input
          aria-label="관계 검색"
          placeholder="상품명, ID, 문서명"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setPage(0);
          }}
        />
        <label>
          <input
            type="checkbox"
            checked={exceptionsOnly}
            onChange={(e) => {
              setExceptionsOnly(e.target.checked);
              setPage(0);
            }}
          />{" "}
          추출 예외만
        </label>
      </div>
      <div className="batch-ledger">
        {matches.slice(page * size, (page + 1) * size).map((link) => (
          <button
            key={link.source + link.row}
            onClick={() => {
              openSource(rowCitation(link));
              close();
            }}
          >
            <strong>
              {link.from} →{" "}
              {corrected && link === exception ? link.expected : link.to}
            </strong>
            <span>
              {dossier[link.source].file} · {link.row}행{" "}
              <b>
                {link.valid
                  ? "자동 대조 일치"
                  : corrected && link === exception
                    ? "원문으로 보정"
                    : "검수 필요"}
              </b>
            </span>
          </button>
        ))}
      </div>
      <div className="km-pager">
        <span>
          {matches.length}건 · {matches.length ? page + 1 : 0} /{" "}
          {Math.ceil(matches.length / size)}쪽
        </span>
        <button
          aria-label="이전 관계"
          disabled={!page}
          onClick={() => setPage(page - 1)}
        >
          ←
        </button>
        <button
          aria-label="다음 관계"
          disabled={(page + 1) * size >= matches.length}
          onClick={() => setPage(page + 1)}
        >
          →
        </button>
      </div>
    </Dialog>
  );
}
