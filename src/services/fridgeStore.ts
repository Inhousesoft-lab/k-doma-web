/**
 * 가구 냉장고 Firestore 저장소
 * - 경로: households/{householdId}/fridge/{재료키}
 * - 가구 문서 id = 만든 사람의 uid (가구 합류 기능 전까지 1인 1가구)
 * - 재료 문서 id = ingredientKey(이름) → 같은 재료는 한 문서라 중복 등록이 생기지 않는다
 * - onSnapshot 으로 받은 목록을 메모리에 두고, 화면은 이 목록을 읽는다 (쓰기는 바로 목록에 반영된다)
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ingredient, IngredientStatus, StorageZone } from '../types';
import { ingredientKey } from '../utils/ingredient';

interface FridgeSession {
  uid: string;
  householdId: string;
  items: Ingredient[];
  ready: Promise<void>;
  unsubscribe: Unsubscribe | null;
  stopped: boolean;
}

let session: FridgeSession | null = null;
/** 마지막 구독 정보. 연결이 실패하면 다음에 냉장고를 읽을 때 다시 시도한다 */
let lastStart: { uid: string; householdName: string; onChange: () => void } | null = null;

const fridgeCol = (householdId: string) => collection(db, 'households', householdId, 'fridge');
const ingredientDoc = (householdId: string, id: string) => doc(db, 'households', householdId, 'fridge', id);

const active = (): FridgeSession => {
  if (!session) throw new Error('냉장고 연결 전이에요');
  return session;
};

/** 가구 문서가 없으면 만든다 (처음 로그인할 때 1번) */
const ensureHousehold = async (uid: string, householdName: string): Promise<string> => {
  const ref = doc(db, 'households', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name: householdName, memberIds: [uid], createdAt: serverTimestamp() });
  }
  return uid;
};

/** 로그인하면 가구 냉장고 구독을 시작한다. 바뀔 때마다 onChange */
export const startFridgeSync = (uid: string, householdName: string, onChange: () => void): void => {
  if (session?.uid === uid) return;
  stopFridgeSync();
  lastStart = { uid, householdName, onChange };

  const current: FridgeSession = {
    uid,
    householdId: uid,
    items: [],
    ready: Promise.resolve(),
    unsubscribe: null,
    stopped: false,
  };
  current.ready = ensureHousehold(uid, householdName).then(
    (householdId) =>
      new Promise<void>((resolve) => {
        if (current.stopped) return resolve();
        current.unsubscribe = onSnapshot(
          fridgeCol(householdId),
          (snap) => {
            current.items = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name,
                zone: data.zone,
                status: data.status,
                imageKey: data.imageKey ?? null,
              } satisfies Ingredient;
            });
            resolve();
            onChange();
          },
          (error) => {
            console.error('냉장고를 불러오지 못했어요', error);
            resolve();
          }
        );
      })
  );
  current.ready.catch((error) => {
    console.error('가구 정보를 만들지 못했어요', error);
    if (session === current) {
      current.stopped = true;
      session = null; // 다음 loadFridge 때 다시 시도
    }
  });
  session = current;
};

export const stopFridgeSync = (): void => {
  lastStart = null;
  if (!session) return;
  session.stopped = true;
  session.unsubscribe?.();
  session = null;
};

/** 첫 목록을 받을 때까지 기다린 뒤의 냉장고 목록 */
export const loadFridge = async (): Promise<Ingredient[]> => {
  if (!session && lastStart) startFridgeSync(lastStart.uid, lastStart.householdName, lastStart.onChange);
  const s = active();
  await s.ready.catch(() => undefined);
  return s.items;
};

/** 지금 메모리에 있는 냉장고 목록 (구독 전이면 빈 목록) */
export const cachedFridge = (): Ingredient[] => session?.items ?? [];

const stamp = () => ({ updatedAt: serverTimestamp(), updatedBy: active().uid });

export const setIngredientStatus = (id: string, status: IngredientStatus): Promise<void> =>
  updateDoc(ingredientDoc(active().householdId, id), { status, ...stamp() });

export const deleteIngredient = (id: string): Promise<void> => deleteDoc(ingredientDoc(active().householdId, id));

/** 재료를 넣거나(없으면) 상태를 바꾼다(있으면). 문서 id 가 재료키라 같은 재료는 한 줄 */
export const upsertIngredient = (item: {
  name: string;
  zone: StorageZone;
  status: IngredientStatus;
  imageKey?: string | null;
}): Promise<void> =>
  setDoc(
    ingredientDoc(active().householdId, ingredientKey(item.name)),
    { name: item.name, zone: item.zone, status: item.status, imageKey: item.imageKey ?? null, ...stamp() },
    { merge: true }
  );

/** 여러 재료 상태를 한 번에 바꾼다 (요리 완료 후 재고 반영) */
export const setStatusesBatch = async (updates: Array<{ id: string; status: IngredientStatus }>): Promise<void> => {
  if (updates.length === 0) return;
  const s = active();
  const batch = writeBatch(db);
  updates.forEach(({ id, status }) => batch.update(ingredientDoc(s.householdId, id), { status, ...stamp() }));
  await batch.commit();
};
