/**
 * 찜 Firestore 저장소 (계정별, KD-27)
 * - users/{uid}/favorites/{recipeId}  { createdAt }
 * - 문서 id = 요리 id → 같은 요리를 여러 번 찜해도 한 문서 (저장을 여러 번 해도 결과가 같다)
 * - onSnapshot 으로 받은 목록(최근 찜한 순)을 메모리에 두고, 화면은 이 목록을 읽는다
 *   (쓰기는 Firestore 가 로컬에서 먼저 반영해서 하트가 바로 바뀐다)
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FavoritesSession {
  uid: string;
  /** 최근 찜한 순 */
  ids: string[];
  set: Set<string>;
  ready: Promise<void>;
  unsubscribe: Unsubscribe | null;
  /** 첫 목록을 못 받았으면 다음에 읽을 때 다시 구독한다 */
  failed: boolean;
}

let session: FavoritesSession | null = null;
let lastStart: { uid: string; onChange: () => void } | null = null;

const favoritesCol = (uid: string) => collection(db, 'users', uid, 'favorites');
const favoriteDoc = (uid: string, recipeId: string) => doc(db, 'users', uid, 'favorites', recipeId);

const EMPTY: ReadonlySet<string> = new Set();

/** 로그인하면 내 찜 구독을 시작한다. 바뀔 때마다 onChange */
export const startFavoritesSync = (uid: string, onChange: () => void): void => {
  if (session?.uid === uid && !session.failed) return;
  stopFavoritesSync();
  lastStart = { uid, onChange };

  const current: FavoritesSession = {
    uid,
    ids: [],
    set: new Set(),
    ready: Promise.resolve(),
    unsubscribe: null,
    failed: false,
  };
  current.ready = new Promise<void>((resolve) => {
    // 방금 찜해서 서버 시각이 아직 없는 문서는 Firestore 가 가장 최근으로 보고 맨 앞에 둔다
    current.unsubscribe = onSnapshot(
      query(favoritesCol(uid), orderBy('createdAt', 'desc')),
      (snap) => {
        current.ids = snap.docs.map((d) => d.id);
        current.set = new Set(current.ids);
        resolve();
        onChange();
      },
      (error) => {
        console.error('찜 목록을 불러오지 못했어요', error);
        current.failed = true;
        resolve();
        onChange();
      }
    );
  });
  session = current;
};

export const stopFavoritesSync = (): void => {
  lastStart = null;
  if (!session) return;
  session.unsubscribe?.();
  session = null;
};

const active = (): FavoritesSession => {
  if (!session) throw new Error('찜 목록 연결 전이에요');
  return session;
};

/** 첫 목록을 받을 때까지 기다린 세션. 실패했으면 다시 구독해 보고, 그래도 실패하면 오류 */
const loaded = async (): Promise<FavoritesSession> => {
  if ((!session || session.failed) && lastStart) startFavoritesSync(lastStart.uid, lastStart.onChange);
  const s = active();
  await s.ready;
  if (s.failed) throw new Error('찜 목록을 불러오지 못했어요');
  return s;
};

/** 찜한 요리 id (최근 찜한 순) */
export const loadFavoriteIds = async (): Promise<string[]> => [...(await loaded()).ids];

/** 첫 목록을 받을 때까지 기다린다 (실패해도 넘어간다: 하트만 비어 보인다) */
export const favoritesReady = async (): Promise<void> => {
  await loaded().catch(() => undefined);
};

/** 지금 메모리에 있는 찜 (구독 전·로그아웃이면 비어 있음) */
export const cachedFavoriteSet = (): ReadonlySet<string> => session?.set ?? EMPTY;

export const addFavorite = (recipeId: string): Promise<void> =>
  setDoc(favoriteDoc(active().uid, recipeId), { createdAt: serverTimestamp() });

export const removeFavorite = (recipeId: string): Promise<void> => deleteDoc(favoriteDoc(active().uid, recipeId));
