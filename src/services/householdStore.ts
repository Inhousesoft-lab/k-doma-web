/**
 * 가구 공유 데이터 Firestore 저장소 (냉장고 · 장바구니 · 요리 기록)
 * - 냉장고: households/{householdId}/fridge/{재료키}
 * - 장바구니: households/{householdId}/cart/{재료키}
 * - 요리 기록: households/{householdId}/plans/{날짜}_{요리id} (KD-57, KD-61)
 * - 가구 id 는 currentHouseholdId() 한 곳에서만 정한다. 지금(MVP 1)은 내 uid = 내 1인 가구 (KD-58)
 *   MVP 2에서는 이 함수만 users/{uid}.householdId 를 읽게 바꾼다
 * - 냉장고·장바구니 문서 id = ingredientKey(이름) → 같은 재료는 한 문서라 중복 등록이 생기지 않는다 (KD-R05)
 * - onSnapshot 으로 받은 목록을 메모리에 두고, 화면은 이 목록을 읽는다 (쓰기는 바로 목록에 반영된다)
 */
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartItem, Ingredient, IngredientStatus, MealPlan, StorageZone } from '../types';
import { ingredientKey } from '../utils/ingredient';

interface HouseholdSession {
  uid: string;
  householdId: string;
  fridge: Ingredient[];
  cart: CartItem[];
  plans: MealPlan[];
  /** 기록 목록이 바뀔 때마다 부르는 대기자 (저장한 기록이 목록에 들어올 때까지 기다리기) */
  planWaiters: Set<() => void>;
  ready: Promise<void>;
  unsubscribes: Unsubscribe[];
  stopped: boolean;
}

/** 새로 만드는 가구 이름 (MVP 2에서 OWNER가 바꿀 수 있다, KD-60) */
const DEFAULT_HOUSEHOLD_NAME = '우리 집';

let session: HouseholdSession | null = null;
/** 마지막 구독 정보. 연결이 실패하면 다음에 읽을 때 다시 시도한다 */
let lastStart: { uid: string; onChange: () => void } | null = null;

const fridgeCol = (hid: string) => collection(db, 'households', hid, 'fridge');
const fridgeDoc = (hid: string, id: string) => doc(db, 'households', hid, 'fridge', id);
const cartCol = (hid: string) => collection(db, 'households', hid, 'cart');
const cartDoc = (hid: string, id: string) => doc(db, 'households', hid, 'cart', id);
const plansCol = (hid: string) => collection(db, 'households', hid, 'plans');
const planDoc = (hid: string, id: string) => doc(db, 'households', hid, 'plans', id);

/** 기록 문서 id: 같은 날 같은 요리는 문서 1개 (KD-61) */
export const planIdOf = (date: string, recipeId: string): string => `${date}_${recipeId}`;

/**
 * 로그인한 사람의 가구 id. 가구를 정하는 곳은 여기 한 곳뿐이다.
 * MVP 1: 내 uid = 내 1인 가구. MVP 2: users/{uid}.householdId (KD-58, KD-59)
 */
export const currentHouseholdId = (uid: string): string => uid;

const active = (): HouseholdSession => {
  if (!session) throw new Error('가구 데이터 연결 전이에요');
  return session;
};

/** 가구 문서가 없으면 만든다 (처음 로그인할 때 1번) */
const ensureHousehold = async (uid: string): Promise<string> => {
  const hid = currentHouseholdId(uid);
  const ref = doc(db, 'households', hid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name: DEFAULT_HOUSEHOLD_NAME, memberIds: [uid], createdAt: serverTimestamp() });
  }
  return hid;
};

const toIngredient = (snap: QuerySnapshot<DocumentData>): Ingredient[] =>
  snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      zone: data.zone,
      status: data.status,
      imageKey: data.imageKey ?? null,
    } satisfies Ingredient;
  });

const toCartItem = (snap: QuerySnapshot<DocumentData>): CartItem[] =>
  snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      zone: data.zone,
      isUrgent: data.isUrgent,
      checked: data.checked,
    } satisfies CartItem;
  });

/** 기록 목록. 방금 추가해 서버 시각이 아직 없는 기록은 추정 시각을 쓴다 */
const toPlans = (snap: QuerySnapshot<DocumentData>): MealPlan[] =>
  snap.docs
    .map((d) => {
      const data = d.data({ serverTimestamps: 'estimate' });
      return {
        id: d.id,
        date: data.date,
        recipeId: data.recipeId,
        recipeName: data.recipeName,
        photoUrl: data.photoUrl ?? null,
        status: data.status,
        inventoryUpdated: data.inventoryUpdated === true,
        plannedBy: data.plannedBy,
        plannedAt: data.plannedAt?.toMillis?.() ?? 0,
        cookedBy: data.cookedBy,
      } satisfies MealPlan;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.plannedAt - b.plannedAt);

/** 로그인하면 가구 냉장고·장바구니·기록 구독을 시작한다. 바뀔 때마다 onChange */
export const startHouseholdSync = (uid: string, onChange: () => void): void => {
  if (session?.uid === uid) return;
  stopHouseholdSync();
  lastStart = { uid, onChange };

  const current: HouseholdSession = {
    uid,
    householdId: currentHouseholdId(uid),
    fridge: [],
    cart: [],
    plans: [],
    planWaiters: new Set(),
    ready: Promise.resolve(),
    unsubscribes: [],
    stopped: false,
  };

  /** 컬렉션 하나를 구독하고, 첫 목록을 받으면 끝나는 Promise */
  const subscribe = <T,>(
    col: ReturnType<typeof collection>,
    map: (snap: QuerySnapshot<DocumentData>) => T[],
    assign: (items: T[]) => void,
    label: string
  ) =>
    new Promise<void>((resolve) => {
      if (current.stopped) return resolve();
      current.unsubscribes.push(
        onSnapshot(
          col,
          (snap) => {
            assign(map(snap));
            resolve();
            onChange();
          },
          (error) => {
            console.error(`${label}을(를) 불러오지 못했어요`, error);
            resolve();
          }
        )
      );
    });

  current.ready = ensureHousehold(uid).then((hid) =>
    Promise.all([
      subscribe(fridgeCol(hid), toIngredient, (items) => (current.fridge = items), '냉장고'),
      subscribe(cartCol(hid), toCartItem, (items) => (current.cart = items), '장바구니'),
      subscribe(plansCol(hid), toPlans, (items) => {
        current.plans = items;
        current.planWaiters.forEach((w) => w());
      }, '요리 기록'),
    ]).then(() => undefined)
  );
  current.ready.catch((error) => {
    console.error('가구 정보를 만들지 못했어요', error);
    if (session === current) {
      current.stopped = true;
      session = null; // 다음에 읽을 때 다시 시도
    }
  });
  session = current;
};

export const stopHouseholdSync = (): void => {
  lastStart = null;
  if (!session) return;
  session.stopped = true;
  session.unsubscribes.forEach((u) => u());
  session = null;
};

/** 첫 목록을 받을 때까지 기다린 세션 */
const loaded = async (): Promise<HouseholdSession> => {
  if (!session && lastStart) startHouseholdSync(lastStart.uid, lastStart.onChange);
  const s = active();
  await s.ready.catch(() => undefined);
  return s;
};

const stamp = () => ({ updatedAt: serverTimestamp(), updatedBy: active().uid });

/* ───────── 냉장고 ───────── */

export const loadFridge = async (): Promise<Ingredient[]> => (await loaded()).fridge;

/** 지금 메모리에 있는 냉장고 목록 (구독 전이면 빈 목록) */
export const cachedFridge = (): Ingredient[] => session?.fridge ?? [];

export const setIngredientStatus = (id: string, status: IngredientStatus): Promise<void> =>
  updateDoc(fridgeDoc(active().householdId, id), { status, ...stamp() });

/** 냉장고 화면에서 재료를 다른 구역으로 옮긴다 (드래그앤드롭). 이후 상태 변경에도 구역은 유지된다 */
export const setIngredientZone = (id: string, zone: StorageZone): Promise<void> =>
  updateDoc(fridgeDoc(active().householdId, id), { zone, ...stamp() });

export const deleteIngredient = (id: string): Promise<void> => deleteDoc(fridgeDoc(active().householdId, id));

export interface FridgeUpsert {
  name: string;
  zone: StorageZone;
  status: IngredientStatus;
  imageKey?: string | null;
}

const fridgeFields = (item: FridgeUpsert) => ({
  name: item.name,
  zone: item.zone,
  status: item.status,
  imageKey: item.imageKey ?? null,
  ...stamp(),
});

/** 재료를 넣거나(없으면) 상태를 바꾼다(있으면). 문서 id 가 재료키라 같은 재료는 한 줄 */
export const upsertIngredient = (item: FridgeUpsert): Promise<void> =>
  setDoc(fridgeDoc(active().householdId, ingredientKey(item.name)), fridgeFields(item), { merge: true });

/* ───────── 장바구니 ───────── */

export const loadCart = async (): Promise<CartItem[]> => (await loaded()).cart;

/** 지금 메모리에 있는 장바구니 (구독 전이면 빈 목록) */
export const cachedCart = (): CartItem[] => session?.cart ?? [];

export interface CartUpsert {
  name: string;
  zone: StorageZone;
  isUrgent: boolean;
  checked?: boolean;
}

const cartFields = (item: CartUpsert) => ({
  name: item.name,
  zone: item.zone,
  isUrgent: item.isUrgent,
  checked: item.checked ?? false,
  ...stamp(),
});

/** 장바구니에 여러 재료를 한 번에 담는다 (이미 있는 재료는 부르는 쪽에서 거른다) */
export const addCartItems = async (items: CartUpsert[]): Promise<void> => {
  if (items.length === 0) return;
  const hid = active().householdId;
  const batch = writeBatch(db);
  items.forEach((item) => batch.set(cartDoc(hid, ingredientKey(item.name)), cartFields(item)));
  await batch.commit();
};

export const updateCartItem = (id: string, fields: Partial<Pick<CartItem, 'isUrgent' | 'checked'>>): Promise<void> =>
  updateDoc(cartDoc(active().householdId, id), { ...fields, ...stamp() });

export const deleteCartItem = (id: string): Promise<void> => deleteDoc(cartDoc(active().householdId, id));

/**
 * 장바구니 재료를 냉장고에 '있음'으로 저장하고 장바구니에서 지운다.
 * 둘을 한 번에 저장해서(batch) 한쪽만 바뀌는 일이 없다.
 * existingFridgeId: 냉장고에 이미 있는 재료면 그 문서 id (상태만 있음으로)
 */
export const moveCartItemToFridge = async (
  cartId: string,
  fridgeItem: { existingFridgeId?: string; upsert: FridgeUpsert }
): Promise<void> => {
  const hid = active().householdId;
  const batch: WriteBatch = writeBatch(db);
  if (fridgeItem.existingFridgeId) {
    batch.update(fridgeDoc(hid, fridgeItem.existingFridgeId), { status: 'HAVE', ...stamp() });
  } else {
    batch.set(fridgeDoc(hid, ingredientKey(fridgeItem.upsert.name)), fridgeFields(fridgeItem.upsert), { merge: true });
  }
  batch.delete(cartDoc(hid, cartId));
  await batch.commit();
};

/* ───────── 요리 기록 (KD-57) ───────── */

/** 같은 날 같은 요리가 이미 기록에 있다 */
export class DuplicatePlanError extends Error {
  constructor() {
    super('이미 오늘 기록에 있어요');
    this.name = 'DuplicatePlanError';
  }
}

/** 이미 재고를 반영한 기록이다 (다른 구성원이 먼저 반영했을 수 있다) */
export class InventoryAlreadyAppliedError extends Error {
  constructor() {
    super('이미 재고가 반영됐어요');
    this.name = 'InventoryAlreadyAppliedError';
  }
}

/** 기록이 없다 (다른 구성원이 지웠을 수 있다) */
export class PlanNotFoundError extends Error {
  constructor() {
    super('기록을 찾을 수 없어요');
    this.name = 'PlanNotFoundError';
  }
}

export const loadPlans = async (): Promise<MealPlan[]> => (await loaded()).plans;

/** 지금 메모리에 있는 기록 (구독 전이면 빈 목록) */
export const cachedPlans = (): MealPlan[] => session?.plans ?? [];

/**
 * 기록 목록이 조건을 만족할 때까지 기다린다 (최대 timeoutMs).
 * 트랜잭션은 서버에 저장된 뒤에야 목록(onSnapshot)에 들어와서, 바로 다음 추가가 옛 목록으로 10개를 세지 않게 한다
 */
const waitForPlans = (s: HouseholdSession, done: (plans: MealPlan[]) => boolean, timeoutMs = 5000): Promise<void> =>
  new Promise((resolve) => {
    if (done(s.plans)) return resolve();
    const finish = () => {
      clearTimeout(timer);
      s.planWaiters.delete(check);
      resolve();
    };
    const check = () => {
      if (done(s.plans)) finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    s.planWaiters.add(check);
  });

/**
 * 요리 예정 기록을 만든다. 같은 날 같은 요리 문서가 이미 있으면 DuplicatePlanError.
 * 트랜잭션으로 있는지 확인하고 만든다. 보안 규칙도 이미 있는 문서를 다시 만들지 못하게 막는다 (KD-61)
 */
export const createPlan = async (input: {
  date: string;
  recipeId: string;
  recipeName: string;
  photoUrl: string | null;
}): Promise<void> => {
  const s = active();
  const ref = planDoc(s.householdId, planIdOf(input.date, input.recipeId));
  await runTransaction(db, async (tx) => {
    if ((await tx.get(ref)).exists()) throw new DuplicatePlanError();
    tx.set(ref, {
      date: input.date,
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      photoUrl: input.photoUrl,
      status: 'PLANNED',
      inventoryUpdated: false,
      plannedBy: s.uid,
      plannedAt: serverTimestamp(),
      updatedBy: s.uid,
      updatedAt: serverTimestamp(),
    });
  });
  await waitForPlans(s, (plans) => plans.some((p) => p.id === ref.id));
};

/** [요리 완료]: PLANNED → COOKED */
export const markPlanCooked = (planId: string): Promise<void> => {
  const s = active();
  return updateDoc(planDoc(s.householdId, planId), {
    status: 'COOKED',
    cookedBy: s.uid,
    cookedAt: serverTimestamp(),
    ...stamp(),
  });
};

/** 요리 예정 [취소]·요리 완료 [삭제]: 기록을 지운다. 재고는 되돌리지 않는다 */
export const deletePlan = (planId: string): Promise<void> => deleteDoc(planDoc(active().householdId, planId));

/** 재고 반영 때 냉장고에 쓸 재료 하나. existingId 가 없으면 냉장고에 새로 추가한다 */
export interface InventoryWrite {
  existingId?: string;
  upsert: FridgeUpsert;
}

/**
 * 재고 반영: 냉장고 변경과 '재고 반영됨'을 한 번에 저장한다 (트랜잭션, KD-57·KD-R06)
 * 이미 반영된 기록이면 InventoryAlreadyAppliedError. 아무것도 바꾸지 않는다
 */
export const applyInventory = async (planId: string, writes: InventoryWrite[]): Promise<void> => {
  const s = active();
  const hid = s.householdId;
  const ref = planDoc(hid, planId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new PlanNotFoundError();
    if (snap.data().inventoryUpdated === true) throw new InventoryAlreadyAppliedError();
    writes.forEach(({ existingId, upsert }) => {
      if (existingId) {
        tx.update(fridgeDoc(hid, existingId), { status: upsert.status, ...stamp() });
      } else {
        tx.set(fridgeDoc(hid, ingredientKey(upsert.name)), fridgeFields(upsert), { merge: true });
      }
    });
    tx.update(ref, {
      inventoryUpdated: true,
      inventoryUpdatedBy: s.uid,
      inventoryUpdatedAt: serverTimestamp(),
      ...stamp(),
    });
  });
};
