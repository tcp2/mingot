import { notification } from "antd";

export const messgeNotWorking = () => {
  notification["warning"]({
    message: "Xin lỗi 😅",
    description: "Tính năng này đang xây dựng",
    placement: "bottom",
  });
};


export const messageDone = (desc?: string) => {
  notification["success"]({
    message: "DONE 😎",
    description: desc || 'Đã xử lý',
    placement: "bottom",
  });
};


export const messageError = (desc?: string, delay: number = 7) => {
  notification["error"]({
    message: "Lỗi rồi 😅",
    description: desc || "Đã xảy ra trục trặc kỹ thuật, hãy liên hệ admin để giải quyết 😂",
    placement: "bottom",
    duration: delay
  });
};
