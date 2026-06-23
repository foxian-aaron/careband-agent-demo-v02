interface UnknownElderStateProps {
  elderId?: string;
}

export const UnknownElderState = ({ elderId }: UnknownElderStateProps) => (
  <section className="panel unknown-elder-state" aria-label="找不到長者資料">
    <div className="section-title">
      <span>Unknown elder</span>
      <h1>資料未載入：找不到此長者資料。</h1>
    </div>
    <p>
      系統不會自動切換到陳伯 E001，避免誤把其他長者資料當作當前個案。
    </p>
    {elderId ? <p className="muted-copy">Requested elderId: {elderId}</p> : null}
    <div className="button-row">
      <a className="primary-link" href="#/institution">返回機構端</a>
      <a className="text-button" href="#/elder/E001">查看陳伯 E001 Demo</a>
    </div>
  </section>
);
