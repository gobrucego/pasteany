"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createSecretUrl } from "@/lib/secret-link";

const MAX_LENGTH = 4000;

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const remaining = useMemo(() => MAX_LENGTH - message.length, [message.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);

    if (!message.trim()) {
      setNote("请输入要发送的文本内容。");
      setGeneratedUrl("");
      return;
    }

    if (message.length > MAX_LENGTH) {
      setNote(`文本不能超过 ${MAX_LENGTH} 个字符。`);
      setGeneratedUrl("");
      return;
    }

    try {
      const url = await createSecretUrl(message.trim());
      setGeneratedUrl(url);
      setNote("链接已生成。对方打开后，页面会立即从地址栏移除密文。");
    } catch {
      setNote("生成链接失败，请稍后重试。");
      setGeneratedUrl("");
    }
  }

  async function handleCopy() {
    if (!generatedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setNote("链接已复制，可以直接发给对方。");
    } catch {
      setNote("复制失败，请手动复制下面的链接。");
    }
  }

  return (
    <main style={{ padding: "32px 0 40px" }}>
      <div className="shell">
        <section
          style={{
            display: "grid",
            gap: "32px",
            padding: "28px",
            alignItems: "start"
          }}
          className="card"
        >
          <div className="grid" style={{ alignItems: "start" }}>
            <div>
              <span className="badge">Zero storage • Vercel ready</span>
              <p className="eyebrow" style={{ marginTop: "24px" }}>
                Burn after reading
              </p>
              <h1 className="title">焚信</h1>
              <p className="lead muted" style={{ fontSize: "18px", marginTop: "18px" }}>
                只支持文本字符，不接数据库，不保留服务端副本。内容会在浏览器端加密后放进分享链接，
                接收方查看时立即解密，并从地址栏清除密文。
              </p>
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "28px"
                }}
              >
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div className="eyebrow">01</div>
                  <p className="copy" style={{ margin: "8px 0 0" }}>
                    发送方输入文本，浏览器本地加密生成链接。
                  </p>
                </div>
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div className="eyebrow">02</div>
                  <p className="copy" style={{ margin: "8px 0 0" }}>
                    接收方打开链接时，密文只存在于 URL hash，不会发给服务器。
                  </p>
                </div>
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div className="eyebrow">03</div>
                  <p className="copy" style={{ margin: "8px 0 0" }}>
                    页面读取后会清除地址栏，降低再次泄露的概率。
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <form onSubmit={handleSubmit}>
                <label htmlFor="message" style={{ display: "block", fontWeight: 700, marginBottom: "12px" }}>
                  输入要烧毁的文本
                </label>
                <textarea
                  id="message"
                  className="textarea"
                  placeholder="例如：会议密码、临时口令、一次性说明..."
                  value={message}
                  maxLength={MAX_LENGTH + 100}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginTop: "12px"
                  }}
                >
                  <span className="hint">建议控制在 {MAX_LENGTH} 个字符以内，避免链接过长。</span>
                  <span className="hint mono tabular-nums">{remaining}</span>
                </div>
                {note ? (
                  <p
                    className={note.includes("失败") || note.includes("请输入") || note.includes("不能超过") ? "error" : "hint"}
                    style={{ marginTop: "14px" }}
                  >
                    {note}
                  </p>
                ) : null}
                <div className="button-row" style={{ marginTop: "20px" }}>
                  <button className="button button-primary" type="submit">
                    生成分享链接
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setGeneratedUrl("");
                      setNote("");
                      setCopied(false);
                    }}
                  >
                    清空内容
                  </button>
                </div>
              </form>

              <div style={{ marginTop: "24px" }}>
                <label htmlFor="result" style={{ display: "block", fontWeight: 700, marginBottom: "12px" }}>
                  分享链接
                </label>
                <input
                  id="result"
                  className="input mono"
                  readOnly
                  value={generatedUrl}
                  placeholder="生成后会显示在这里"
                />
                <div className="button-row" style={{ marginTop: "16px" }}>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={handleCopy}
                    disabled={!generatedUrl}
                  >
                    {copied ? "已复制" : "复制链接"}
                  </button>
                  {generatedUrl ? (
                    <Link className="button button-secondary" href={generatedUrl}>
                      打开阅读页
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
