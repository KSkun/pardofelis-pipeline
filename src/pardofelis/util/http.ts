import type { AxiosResponse } from "axios";

export function checkStatus(rsp: AxiosResponse) {
  if (rsp.status >= 300) {
    console.error("http error", rsp);
    return false;
  }
  return true;
}