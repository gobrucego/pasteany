"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { decryptSecretFromHash, wipeHashFromUrl } from "@/lib/secret-link";

type ViewState = "loading" | "ready" | "empty" | "error" | "burned";

export default function ViewPage() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ViewState>("loading");

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      Promise.resolve().then(() => {
        setState(sessionStorage.getItem("secret-consumed") === "1" ? "burned" : "empty");
      });
      return;
    }

    decryptSecretFromHash(hash)
      .then((value) => {
        setMessage(value);
        setState("ready");
        sessionStorage.setItem("secret-consumed", "1");
        wipeHashFromUrl();
      })
      .catch(() => {
        setState("error");
      });
  }, []);

  return (
    <main style={{ padding: "32px 0 40px" }}>
      <div className="shell">
        <section className="card" style={{ padding: "28px" }}>
          <p className="eyebrow">Reader</p>
          <h1 className="title" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}>
            内容已展开
          </h1>
          <p className="lead muted" style={{ maxWidth: "680px", marginTop: "18px" }}>
            这个页面不会把 hash 里的密文发给服务器。成功读取后，地址栏中的密文会被立即清除。
          </p>

          <div style={{ marginTop: "28px" }}>
            {state === "loading" ? <p className="copy">正在解密内容...</p> : null}

            {state === "ready" ? <div className="secret-box">{message}</div> : null}

            {state === "empty" ? (
              <div className="card" style={{ padding: "20px" }}>
                <p className="copy" style={{ margin: 0 }}>
                  当前没有可读取的内容。请确认你打开的是完整分享链接。
                </p>
              </div>
            ) : null}

            {state === "burned" ? (
              <div className="card" style={{ padding: "20px" }}>
                <p className="copy" style={{ margin: 0 }}>
                  这条消息已经在当前浏览器会话中读取过，地址栏里的密文也已经被清除。
                </p>
              </div>
            ) : null}

            {state === "error" ? (
              <div className="card" style={{ padding: "20px" }}>
                <p className="copy" style={{ margin: 0 }}>
                  解密失败。链接可能已经损坏，或者内容不是由当前版本生成的。
                </p>
              </div>
            ) : null}
          </div>

          <div className="button-row" style={{ marginTop: "24px" }}>
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                setMessage("");
                setState("burned");
                sessionStorage.setItem("secret-consumed", "1");
              }}
            >
              立即焚毁当前内容
            </button>
            <Link className="button button-secondary" href="/">
              返回首页
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
