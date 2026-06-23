interface MockNoticeBannerProps {
  children?: string;
}

export const MockNoticeBanner = ({ children }: MockNoticeBannerProps) => (
  <div className="mock-notice">
    {children ??
      "当前为前端模拟数据 / Mock 流程；当前不接真实后端、QwenPaw 或穿戴服务，仅展示 Future Integration / API Contract。"}
  </div>
);
