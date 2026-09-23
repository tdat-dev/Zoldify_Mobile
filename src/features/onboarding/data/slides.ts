/** Nội dung 3 slide giới thiệu. Giọng sinh viên, thật, không sáo. */
export type SlideKey = 'buy' | 'sell' | 'safe';

export interface Slide {
  key: SlideKey;
  title: string;
  body: string;
}

export const SLIDES: Slide[] = [
  {
    key: 'buy',
    title: 'Đồ cũ, giá sinh viên',
    body: 'Mua đồ còn tốt với giá mềm, từ chính sinh viên quanh bạn.',
  },
  {
    key: 'sell',
    title: 'Món không dùng, bán vài phút',
    body: 'Chụp, đăng, xong. Dọn tủ gọn mà còn có thêm tiền tiêu vặt.',
  },
  {
    key: 'safe',
    title: 'Có ký quỹ, khỏi lo bị lừa',
    body: 'Tiền được Zoldify giữ đến khi bạn nhận hàng và thấy ưng.',
  },
];
