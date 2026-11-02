import { useMemo } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui";
import {
  descriptions,
  dossier,
  sourceOrder,
  type Citation,
  type Source,
} from "./model";

import type { CatalogState } from "./story";
const owners: Record<Source, string> = {
  products: "상품기획팀",
  changes: "구매운영팀",
  events: "행사기획팀",
  stores: "매장운영팀",
  notice: "구매운영팀",
};
type CatalogRow = {
  source: Source;
  row: number;
  key: string;
  value: string;
  search: string;
};
const catalog = sourceOrder.flatMap<CatalogRow>((source) => {
  if (source === "notice")
    return [
      {
        source,
        row: 1,
        key: dossier.notice.id,
        value: dossier.notice.reason,
        search: (
          dossier.notice.id +
          " " +
          dossier.notice.productId +
          " " +
          dossier.notice.reason +
          " " +
          dossier.notice.file
        ).toLowerCase(),
      },
    ];
  return dossier[source].rows.map((cells, i) => ({
    source,
    row: i + 2,
    key: cells[0],
    value: cells.slice(1).join(" · "),
    search: (cells.join(" ") + " " + dossier[source].file).toLowerCase(),
  }));
});
export const recordCount = catalog.length;
const size = 5;
export function Catalog({
  citation,
  select,
  next,
  nextLabel = "검토 메모 정리",
  state,
  update,
}: {
  citation: Citation;
  select: (citation: Citation) => void;
  next: () => void;
  nextLabel?: string;
  state: CatalogState;
  update: (patch: Partial<CatalogState>) => void;
}) {
  const { records, term, source, page } = state;
  const matches = useMemo(() => {
    const query = term.trim().toLowerCase();
    // Prevent a full product ID such as P-101 from also matching P-1010.
    const exactId =
      /^[pe]-\d+$/.test(query) &&
      catalog.some((row) => row.key.toLowerCase() === query);
    return catalog.filter(
      (row) =>
        (source === "all" || row.source === source) &&
        (exactId
          ? row.search.split(" ").includes(query)
          : row.search.includes(query)),
    );
  }, [source, term]);
  const checkingStores = records && source === "stores" && Boolean(term);
  return (
    <article className="panel rt-card km-catalog">
      <div className="rt-section-title">
        <span className="rt-kicker">KNOWLEDGE OPERATIONS / CATALOG</span>
        <h2>{checkingStores ? "행사별 매장 배정표" : "구매 운영 자료"}</h2>
        <p>
          {checkingStores
            ? "선택한 행사 번호가 매장 배정 원본의 행사 ID와 일치하는지 대조합니다."
            : "상품명 또는 ID로 개별 기록을 찾고 원본 위치를 확인합니다."}
        </p>
      </div>
      <div className="km-volume">
        <div>
          <Database size={19} />
          <strong>{recordCount.toLocaleString()}</strong>
          <span>관리 레코드</span>
        </div>
        <span>
          원본 {sourceOrder.length}개 <b>·</b> 담당 조직{" "}
          {new Set(Object.values(owners)).size}개
        </span>
      </div>
      <div className="km-switch" aria-label="카탈로그 보기">
        {["원본 자료", "레코드 탐색"].map((label, i) => (
          <button
            key={label}
            aria-pressed={records === Boolean(i)}
            onClick={() => {
              update({ records: Boolean(i) });
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {!records ? (
        <div className="km-list">
          <div className="km-file km-colhead">
            <span>원본 / 연결 기준</span>
            <span>담당 조직</span>
            <span>레코드</span>
          </div>
          {sourceOrder.map((id) => (
            <button
              className="km-file"
              key={id}
              aria-pressed={id === citation.source}
              onClick={() =>
                select({ source: id, rows: id === "notice" ? undefined : [2] })
              }
            >
              <span>
                <FileText size={17} />
                <span>
                  <strong>{dossier[id].file}</strong>
                  <small>{descriptions[id]}</small>
                </span>
              </span>
              <span>{owners[id]}</span>
              <span>
                {id === "notice" ? 1 : dossier[id].rows.length}
                {id === citation.source && <Check size={13} />}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="km-filters">
            <label>
              <Search size={15} />
              <input
                aria-label="레코드 검색"
                placeholder="상품명, 매장명, ID 검색"
                value={term}
                onChange={(e) => {
                  update({ term: e.target.value, page: 0 });
                }}
              />
            </label>
            <select
              aria-label="원본 필터"
              value={source}
              onChange={(e) => {
                update({ source: e.target.value as Source | "all", page: 0 });
              }}
            >
              <option value="all">모든 원본</option>
              {sourceOrder.map((id) => (
                <option value={id} key={id}>
                  {dossier[id].file}
                </option>
              ))}
            </select>
          </div>
          <div className="km-list km-rows">
            {matches.slice(page * size, (page + 1) * size).map((row) => (
              <button
                key={row.source + row.row}
                aria-pressed={
                  citation.source === row.source &&
                  (citation.rows ?? [row.source === "notice" ? 1 : 2]).includes(
                    row.row,
                  )
                }
                onClick={() => select({ source: row.source, rows: [row.row] })}
              >
                <b>{row.key}</b>
                <span>
                  {row.value}
                  <small className="km-origin">
                    {dossier[row.source].file}
                  </small>
                </span>
                <small>
                  {row.source === "notice" ? "1쪽" : row.row + "행"}
                </small>
              </button>
            ))}
            {matches.length === 0 && (
              <p>일치하는 기록이 없습니다. 검색어나 원본 필터를 변경하세요.</p>
            )}
          </div>
          <div className="km-pager">
            <span>
              {matches.length.toLocaleString()}건 중{" "}
              {matches.length ? page * size + 1 : 0}–
              {Math.min((page + 1) * size, matches.length)}
            </span>
            <button
              aria-label="이전 결과"
              disabled={!page}
              onClick={() => update({ page: page - 1 })}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="다음 결과"
              disabled={(page + 1) * size >= matches.length}
              onClick={() => update({ page: page + 1 })}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </>
      )}
      <div className="rt-action">
        <span>원본의 행·페이지로 추적 가능</span>
        <Button onClick={next}>
          {nextLabel}
          <ArrowRight size={16} />
        </Button>
      </div>
    </article>
  );
}
