import { CartItem, IngredientStatus, StorageZone } from '../types';
import { canonicalName, findByIngredientName, findMasterIngredient, isSameIngredient } from '../utils/ingredient';
import {
  addCartItems,
  cachedCart,
  deleteCartItem,
  deleteCartItems,
  moveCartItemToFridge,
  setCartItemsChecked,
  updateCartItem,
} from './householdStore';
import { cart, currentUid, fridge, requireUser } from './session';

/** 재료 사전 기준 구역. 사전에 없으면 냉장고 */
const zoneOf = (name: string): StorageZone => findMasterIngredient(name)?.zone ?? 'FRIDGE';

/** 장바구니 문서 값. 표준 이름·재료 사전 구역으로 맞춘다 */
const toCartUpsert = (name: string, isUrgent: boolean) => ({
  name: canonicalName(name),
  zone: zoneOf(name),
  isUrgent,
});

/** 장바구니 재료를 냉장고 '있음'으로 옮긴다. 이미 냉장고에 있으면(있음·적음·없음) 있음으로 바꾼다 (KD-28) */
const moveToFridge = async (name: string, cartItemId: string): Promise<void> => {
  const match = findByIngredientName(name, await fridge());
  const master = findMasterIngredient(name);
  await moveCartItemToFridge(cartItemId, {
    existingFridgeId: match?.id,
    upsert: {
      name: master?.name ?? canonicalName(name),
      zone: master?.zone ?? 'FRIDGE',
      status: 'HAVE',
      imageKey: master?.imageKey ?? null,
    },
  });
};

export const cartService = {
  async getCartItems(): Promise<CartItem[]> {
    return [...(await cart())];
  },

  async getCartCount(): Promise<number> {
    return (await cart()).length;
  },

  isItemInCart(name: string): boolean {
    return Boolean(currentUid() && findByIngredientName(name, cachedCart()));
  },

  async toggleItemCheck(id: string): Promise<void> {
    requireUser();
    const item = (await cart()).find((i) => i.id === id);
    if (item) await updateCartItem(id, { checked: !item.checked });
  },

  /** 전체 선택(true)·전체 해제(false) */
  async setAllChecked(checked: boolean): Promise<void> {
    requireUser();
    const ids = (await cart()).filter((i) => Boolean(i.checked) !== checked).map((i) => i.id);
    await setCartItemsChecked(ids, checked);
  },

  /** 체크한 재료를 장바구니에서 지운다 (냉장고는 그대로) */
  async deleteItems(ids: string[]): Promise<void> {
    requireUser();
    await deleteCartItems(ids);
  },

  /**
   * 재료를 장바구니에 담거나 빼기 ('꼭 사야 해요')
   * 같은 재료는 표준 이름 한 줄로 합친다 (KD-R05)
   */
  async toggleItem(name: string, isUrgent: boolean = true): Promise<boolean> {
    requireUser();
    const existing = findByIngredientName(name, await cart());
    if (existing) {
      await deleteCartItem(existing.id);
      return false;
    }
    await addCartItems([toCartUpsert(name, isUrgent)]);
    return true;
  },

  /**
   * 여러 재료 한 번에 장바구니에 담기 (이미 담긴 재료는 건너뛴다)
   */
  async addItems(names: string[], isUrgent: boolean = true): Promise<number> {
    requireUser();
    const current = await cart();
    const toAdd = names.filter(
      (name, index) =>
        !findByIngredientName(name, current) &&
        names.findIndex((other) => isSameIngredient(other, name)) === index
    );
    await addCartItems(toAdd.map((name) => toCartUpsert(name, isUrgent)));
    return toAdd.length;
  },

  /**
   * [집에 있어요]: 냉장고에 '있음(HAVE)'으로 저장하고 장바구니에서 지운다 (한 번에 저장)
   */
  async markAsInFridge(itemName: string, cartItemId: string): Promise<void> {
    requireUser();
    await moveToFridge(itemName, cartItemId);
  },

  /**
   * [+ 살 목록에]: 더 사두면 좋아요에서 꼭 사야 해요로 옮긴다.
   */
  async moveToUrgentCart(itemName: string): Promise<void> {
    requireUser();
    const existing = findByIngredientName(itemName, await cart());
    if (existing) {
      await updateCartItem(existing.id, { isUrgent: true });
    } else {
      await addCartItems([toCartUpsert(itemName, true)]);
    }
  },

  /**
   * [체크한 n개 냉장고에 등록]:
   * 체크한 재료를 냉장고에 '있음(HAVE)'으로 저장하고, 저장된 항목만 목록에서 지운다.
   * 항목마다 따로 저장해서, 실패한 항목만 체크된 채로 남긴다 (KD-36).
   */
  async registerCheckedToFridge(itemIds: string[]): Promise<{ successIds: string[]; failedIds: string[] }> {
    requireUser();
    const successIds: string[] = [];
    const failedIds: string[] = [];
    for (const item of (await cart()).filter((i) => itemIds.includes(i.id))) {
      try {
        await moveToFridge(item.name, item.id);
        successIds.push(item.id);
      } catch (e) {
        console.error(e);
        failedIds.push(item.id);
      }
    }
    return { successIds, failedIds };
  },

  /**
   * 냉장고에 등록된 재료 중 적음·없음 (더 사두면 좋아요, KD-35)
   * 이미 꼭 사야 해요에 있는 재료는 제외
   */
  async getNeedBuyFromFridge(): Promise<Array<{ id: string; name: string; status: IngredientStatus; zone: StorageZone }>> {
    const cartList = await cart();
    return (await fridge())
      .filter(
        (ing) =>
          (ing.status === 'LOW' || ing.status === 'NONE') && !findByIngredientName(ing.name, cartList)
      )
      .map((i) => ({ id: i.id, name: i.name, status: i.status, zone: i.zone }));
  },
};
