const ADMIN_TOKEN_STORAGE_KEY =
  "train-booking-admin-token";

export function getAdminAccessToken():
  | string
  | null {
  return window.localStorage.getItem(
    ADMIN_TOKEN_STORAGE_KEY,
  );
}

export function storeAdminAccessToken(
  token: string,
): void {
  window.localStorage.setItem(
    ADMIN_TOKEN_STORAGE_KEY,
    token,
  );
}

export function removeAdminAccessToken():
  void {
  window.localStorage.removeItem(
    ADMIN_TOKEN_STORAGE_KEY,
  );
}