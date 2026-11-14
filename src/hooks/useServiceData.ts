import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { subscribeToDataChanges } from '../services';

/**
 * 화면 데이터 불러오기 공통 훅
 * - 처음 열 때 + 데이터가 바뀔 때마다(subscribeToDataChanges) fetcher 를 다시 부른다
 * - deps 가 바뀌면(예: 요리 id) 로딩부터 다시 시작한다
 * - reload: 저장 후 다시 읽기 (로딩 화면 없이). 실패하면 error 만 켠다 (던지지 않는다)
 * - retry: 오류 화면 [다시 시도] (로딩 화면을 보여 주고 다시 읽기)
 * - setData: 저장 전에 화면에 먼저 반영할 때 (드래그앤드롭 등)
 * - 마지막 요청의 결과만 반영한다. 먼저 보낸 요청이 늦게 끝나도 새 데이터를 덮어쓰지 않고,
 *   deps 가 바뀌었거나 화면을 떠난 뒤에 끝난 요청도 버린다
 */
export default function useServiceData<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // 마지막 fetcher 를 쓴다 (화면의 ref·state 를 읽는 fetcher 를 deps 없이 넘길 수 있게)
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  /** 요청 번호. 결과가 왔을 때 이 번호가 그대로여야 반영한다 */
  const requestIdRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;
    const isLatest = () => requestId === requestIdRef.current;
    try {
      const next = await fetcherRef.current();
      if (!isLatest()) return;
      setData(next);
      setError(false);
    } catch (e) {
      if (!isLatest()) return;
      console.error(e);
      setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  useEffect(() => {
    setLoading(true);
    void reload();
    const unsubscribe = subscribeToDataChanges(() => {
      void reload();
    });
    return () => {
      unsubscribe();
      requestIdRef.current++; // 진행 중인 요청 결과는 버린다 (deps 변경·화면 이탈)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload, retry };
}
