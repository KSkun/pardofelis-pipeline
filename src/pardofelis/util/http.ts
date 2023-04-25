// HTTP util functions
// by chengtian.he
// 2023.3.23

import type { AxiosResponse } from "axios";

export function checkStatus(rsp: AxiosResponse) {
  if (rsp.status >= 300) {
    console.error("[checkStatus] http error", rsp);
    return false;
  }
  return true;
}