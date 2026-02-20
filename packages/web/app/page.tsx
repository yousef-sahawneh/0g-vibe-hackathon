"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NotarizeTab } from "@/components/NotarizeTab";
import { VerifyTab } from "@/components/VerifyTab";
import { MyDocsTab } from "@/components/MyDocsTab";
import styles from "./page.module.css";

type Tab = "notarize" | "verify" | "my-docs";

function PageContent() {
  const searchParams = useSearchParams();
  const verifyHash = searchParams.get("verify") ?? undefined;

  const [tab, setTab] = useState<Tab>(verifyHash ? "verify" : "notarize");

  useEffect(() => {
    if (verifyHash) setTab("verify");
  }, [verifyHash]);

  return (
    <main className={styles.main}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.badge}>Powered by 0G Decentralized Storage</div>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroAccent}>Permanent</span> proof.<br />
          Trustless verification.
        </h1>
        <p className={styles.heroSub}>
          Upload any document to 0G's permanent decentralized storage, then record an immutable
          on-chain timestamp. Anyone can verify your document's authenticity and provenance —
          no notary, no middleman, no trust required.
        </p>
      </div>

      {/* How it works */}
      <div className={styles.steps}>
        <Step n="01" title="Upload" desc="Your file is stored permanently on 0G's decentralized network." />
        <div className={styles.stepArrow}>→</div>
        <Step n="02" title="Notarize" desc="Your wallet signs an on-chain record with the file's content hash." />
        <div className={styles.stepArrow}>→</div>
        <Step n="03" title="Verify" desc="Anyone can verify the document and prove it hasn't changed." />
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <div className={styles.tabNav}>
          <TabBtn id="notarize" active={tab} label="Notarize" onClick={setTab} />
          <TabBtn id="verify"   active={tab} label="Verify"   onClick={setTab} />
          <TabBtn id="my-docs"  active={tab} label="My Records" onClick={setTab} />
        </div>

        <div className={styles.tabBody}>
          {tab === "notarize" && <NotarizeTab />}
          {tab === "verify"   && <VerifyTab initialHash={verifyHash} />}
          {tab === "my-docs"  && <MyDocsTab />}
        </div>
      </div>
    </main>
  );
}

function TabBtn({ id, active, label, onClick }: {
  id: Tab; active: Tab; label: string; onClick: (id: Tab) => void;
}) {
  return (
    <button
      className={`${styles.tabBtn} ${active === id ? styles.tabBtnActive : ""}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className={styles.step}>
      <span className={styles.stepN}>{n}</span>
      <p className={styles.stepTitle}>{title}</p>
      <p className={styles.stepDesc}>{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
